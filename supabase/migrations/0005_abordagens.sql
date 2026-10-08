-- 0005 — Histórico de abordagens (data/hora, local com GPS, motivo, observações)
-- Rode depois da 0004. Idempotente: pode ser executado mais de uma vez.
-- Dica: no SQL Editor, cole o arquivo inteiro e rode SEM nenhum trecho selecionado.
--
-- Regras: qualquer usuário registra abordagens em cadastros que pode ver;
-- o agente edita as próprias; admin edita e remove qualquer uma.

-- ---------------------------------------------------------------------------
-- 1. Tabela
-- ---------------------------------------------------------------------------
create table if not exists public.abordagens (
    id uuid primary key default gen_random_uuid(),
    funcionario_id uuid not null references public.funcionarios (id) on delete cascade,
    data_hora timestamptz not null default now(),
    latitude double precision check (latitude between -90 and 90),
    longitude double precision check (longitude between -180 and 180),
    precisao_m real check (precisao_m >= 0),
    local_descricao text,
    motivo text,
    observacoes text,
    agente_id uuid default auth.uid() references auth.users (id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    check ((latitude is null) = (longitude is null))
);

create index if not exists abordagens_funcionario_idx on public.abordagens (funcionario_id, data_hora desc);
create index if not exists abordagens_data_idx on public.abordagens (data_hora desc);

-- Fotos tiradas durante uma abordagem ficam vinculadas a ela
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'fotos_abordagem_fk') then
        alter table public.fotos
            add constraint fotos_abordagem_fk foreign key (abordagem_id)
            references public.abordagens (id) on delete set null;
    end if;
end;
$$;
create index if not exists fotos_abordagem_idx on public.fotos (abordagem_id) where abordagem_id is not null;

-- Data da última abordagem no cadastro (mostrada na lista sem consulta extra)
alter table public.funcionarios add column if not exists ultima_abordagem_em timestamptz;

alter table public.abordagens enable row level security;
revoke all on table public.abordagens from anon;

drop policy if exists "abordagens_select" on public.abordagens;
create policy "abordagens_select" on public.abordagens
    for select to authenticated
    using (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

drop policy if exists "abordagens_insert" on public.abordagens;
create policy "abordagens_insert" on public.abordagens
    for insert to authenticated
    with check (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

drop policy if exists "abordagens_update" on public.abordagens;
create policy "abordagens_update" on public.abordagens
    for update to authenticated
    using (
        (agente_id = (select auth.uid()) or (select public.is_admin()))
        and exists (select 1 from public.funcionarios f where f.id = funcionario_id)
    )
    with check (
        (agente_id = (select auth.uid()) or (select public.is_admin()))
        and exists (select 1 from public.funcionarios f where f.id = funcionario_id)
    );

drop policy if exists "abordagens_delete_admin" on public.abordagens;
create policy "abordagens_delete_admin" on public.abordagens
    for delete to authenticated
    using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2. Gatilhos: autor/datas e última abordagem
-- ---------------------------------------------------------------------------
create or replace function public.abordagens_controle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if new.data_hora > now() + interval '5 minutes' then
        raise exception 'A data da abordagem não pode estar no futuro.' using errcode = '22007';
    end if;

    if tg_op = 'INSERT' then
        new.agente_id := coalesce((select auth.uid()), new.agente_id);
        new.created_at := now();
        new.updated_at := null;
    else
        new.agente_id := old.agente_id;
        new.created_at := old.created_at;
        new.funcionario_id := old.funcionario_id;
        new.updated_at := now();
    end if;
    return new;
end;
$$;

drop trigger if exists abordagens_controle on public.abordagens;
create trigger abordagens_controle
    before insert or update on public.abordagens
    for each row execute function public.abordagens_controle();

create or replace function public.sincronizar_ultima_abordagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    alvo uuid := case when tg_op = 'DELETE' then old.funcionario_id else new.funcionario_id end;
    ultima timestamptz;
begin
    select max(data_hora) into ultima from public.abordagens where funcionario_id = alvo;

    update public.funcionarios
    set ultima_abordagem_em = ultima
    where id = alvo and ultima_abordagem_em is distinct from ultima;
    return null;
end;
$$;

revoke execute on function public.sincronizar_ultima_abordagem() from public, anon, authenticated;

drop trigger if exists sincronizar_ultima_abordagem on public.abordagens;
create trigger sincronizar_ultima_abordagem
    after insert or update of data_hora or delete on public.abordagens
    for each row execute function public.sincronizar_ultima_abordagem();

-- ---------------------------------------------------------------------------
-- 3. Auditoria (ignora também a data da última abordagem, que é derivada)
-- ---------------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    -- Campos derivados, mantidos por gatilho a partir de tabelas que já são auditadas
    ignorar text[] := array[
        'busca', 'documentos', 'updated_at', 'updated_by', 'deleted_by',
        'foto_url', 'foto_miniatura', 'ultima_abordagem_em', 'created_at'
    ];
    antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) - ignorar end;
    depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) - ignorar end;
    linha jsonb := coalesce(depois, antes);
    acao text;
    registro uuid;
    nome text;
    antes_diff jsonb;
    depois_diff jsonb;
begin
    if tg_table_name = 'funcionarios' then
        registro := (linha ->> 'id')::uuid;
        nome := linha ->> 'nome_completo';
    else
        -- Tabelas filhas (fotos, abordagens) são registradas no cadastro da pessoa
        registro := (linha ->> 'funcionario_id')::uuid;
        select f.nome_completo into nome from public.funcionarios f where f.id = registro;
        if nome is null then
            return null; -- pessoa apagada definitivamente (exclusão em cascata): já auditado
        end if;
    end if;

    if tg_op = 'INSERT' then
        acao := 'criado';
    elsif tg_op = 'DELETE' then
        acao := 'apagado';
    else
        if antes ->> 'deleted_at' is null and depois ->> 'deleted_at' is not null then
            acao := 'excluido';
        elsif antes ->> 'deleted_at' is not null and depois ->> 'deleted_at' is null then
            acao := 'restaurado';
        else
            acao := 'alterado';
        end if;

        select jsonb_object_agg(d.key, antes -> d.key), jsonb_object_agg(d.key, d.value)
        into antes_diff, depois_diff
        from jsonb_each(depois) d
        where antes -> d.key is distinct from d.value;

        if depois_diff is null then
            return null; -- nada mudou de fato
        end if;

        antes := antes_diff;
        depois := depois_diff;
    end if;

    -- Mantém o nome para identificar o registro na tela de auditoria
    -- (se o próprio nome mudou, o valor antigo/novo do registro prevalece)
    antes := case when antes is not null then jsonb_build_object('nome_completo', nome) || antes end;
    depois := case when depois is not null then jsonb_build_object('nome_completo', nome) || depois end;

    insert into public.auditoria (tabela, registro_id, acao, usuario_id, antes, depois)
    values (tg_table_name, registro, acao, (select auth.uid()), antes, depois);
    return null;
end;
$$;

revoke execute on function public.registrar_auditoria() from public, anon, authenticated;

drop trigger if exists auditoria_abordagens on public.abordagens;
create trigger auditoria_abordagens
    after insert or update or delete on public.abordagens
    for each row execute function public.registrar_auditoria();
