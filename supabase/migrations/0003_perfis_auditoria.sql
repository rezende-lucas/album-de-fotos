-- 0003 — Perfis (Admin/Agente), lixeira (exclusão lógica) e auditoria
-- Rode depois da 0002. Idempotente: pode ser executado mais de uma vez.
--
-- Regras:
--   Agente: vê, cadastra e edita registros ativos. Não exclui.
--   Admin : tudo do agente + envia para a lixeira, restaura, apaga definitivamente,
--           vê a auditoria e altera o papel dos usuários.

-- ---------------------------------------------------------------------------
-- 1. Perfis
-- ---------------------------------------------------------------------------
create table if not exists public.perfis (
    user_id uuid primary key references auth.users (id) on delete cascade,
    nome text,
    email text,
    papel text not null default 'agente' check (papel in ('admin', 'agente')),
    created_at timestamptz not null default now()
);

alter table public.perfis enable row level security;
revoke all on table public.perfis from anon;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.perfis
        where user_id = (select auth.uid()) and papel = 'admin'
    )
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Todo usuário novo do Auth ganha um perfil de agente
create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.perfis (user_id, email, nome)
    values (
        new.id,
        new.email,
        coalesce(nullif(new.raw_user_meta_data ->> 'nome', ''), split_part(new.email, '@', 1))
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$;

revoke execute on function public.criar_perfil_usuario() from public, anon, authenticated;

drop trigger if exists criar_perfil_usuario on auth.users;
create trigger criar_perfil_usuario
    after insert on auth.users
    for each row execute function public.criar_perfil_usuario();

-- Perfis para os usuários que já existem
insert into public.perfis (user_id, email, nome, created_at)
select u.id, u.email, split_part(u.email, '@', 1), u.created_at
from auth.users u
on conflict (user_id) do nothing;

-- Primeiro admin: o usuário mais antigo, se ainda não houver nenhum admin
update public.perfis
set papel = 'admin'
where user_id = (select user_id from public.perfis order by created_at, user_id limit 1)
  and not exists (select 1 from public.perfis where papel = 'admin');

-- Nunca deixar o sistema sem administrador
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if old.papel = 'admin'
       and (tg_op = 'DELETE' or new.papel <> 'admin')
       and not exists (select 1 from public.perfis where papel = 'admin' and user_id <> old.user_id) then
        raise exception 'É preciso manter ao menos um administrador.' using errcode = 'P0001';
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists proteger_ultimo_admin on public.perfis;
create trigger proteger_ultimo_admin
    before update or delete on public.perfis
    for each row execute function public.proteger_ultimo_admin();

drop policy if exists "perfis_select_authenticated" on public.perfis;
create policy "perfis_select_authenticated" on public.perfis
    for select to authenticated using (true);

drop policy if exists "perfis_update_admin" on public.perfis;
create policy "perfis_update_admin" on public.perfis
    for update to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- 2. Funcionários: quem alterou e lixeira
-- ---------------------------------------------------------------------------
alter table public.funcionarios add column if not exists updated_at timestamptz;
alter table public.funcionarios add column if not exists updated_by uuid references auth.users (id) on delete set null;
alter table public.funcionarios add column if not exists deleted_at timestamptz;
alter table public.funcionarios add column if not exists deleted_by uuid references auth.users (id) on delete set null;

create index if not exists funcionarios_deleted_at_idx on public.funcionarios (deleted_at) where deleted_at is not null;

-- Preenche os campos de controle; impede forjar autor/data de criação
create or replace function public.funcionarios_controle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if tg_op = 'INSERT' then
        new.user_id := coalesce((select auth.uid()), new.user_id);
        new.created_at := now();
        new.updated_at := null;
        new.updated_by := null;
        new.deleted_at := null;
        new.deleted_by := null;
    else
        new.user_id := old.user_id;
        new.created_at := old.created_at;
        new.updated_at := now();
        new.updated_by := (select auth.uid());
        if new.deleted_at is null then
            new.deleted_by := null;
        elsif old.deleted_at is null then
            new.deleted_at := now();
            new.deleted_by := (select auth.uid());
        else
            new.deleted_at := old.deleted_at;
            new.deleted_by := old.deleted_by;
        end if;
    end if;
    return new;
end;
$$;

drop trigger if exists funcionarios_controle on public.funcionarios;
create trigger funcionarios_controle
    before insert or update on public.funcionarios
    for each row execute function public.funcionarios_controle();

-- RLS: substitui as políticas abertas de schema.sql
drop policy if exists "funcionarios_select_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_insert_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_update_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_delete_authenticated" on public.funcionarios;
drop policy if exists "funcionarios_select" on public.funcionarios;
drop policy if exists "funcionarios_insert" on public.funcionarios;
drop policy if exists "funcionarios_update" on public.funcionarios;
drop policy if exists "funcionarios_delete_admin" on public.funcionarios;

-- Registros na lixeira só aparecem para admin
create policy "funcionarios_select" on public.funcionarios
    for select to authenticated
    using (deleted_at is null or (select public.is_admin()));

create policy "funcionarios_insert" on public.funcionarios
    for insert to authenticated
    with check (deleted_at is null);

-- Agente edita registros ativos e não pode enviá-los para a lixeira
create policy "funcionarios_update" on public.funcionarios
    for update to authenticated
    using (deleted_at is null or (select public.is_admin()))
    with check (deleted_at is null or (select public.is_admin()));

-- Exclusão definitiva: só admin
create policy "funcionarios_delete_admin" on public.funcionarios
    for delete to authenticated
    using ((select public.is_admin()));

-- A listagem e o filtro de cidades ignoram a lixeira
create or replace function public.buscar_funcionarios(termo text default '', filtro_cidade text default null)
returns setof public.funcionarios
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
    normalizado text := lower(public.f_unaccent(btrim(coalesce(termo, ''))));
    digitos text := regexp_replace(coalesce(termo, ''), '[^0-9]', '', 'g');
    palavras text[];
    palavra text;
    sql text := 'select f.* from public.funcionarios f where f.deleted_at is null';
begin
    if filtro_cidade is not null and filtro_cidade <> '' then
        sql := sql || format(' and f.cidade = %L', filtro_cidade);
    end if;

    if normalizado <> '' then
        palavras := regexp_split_to_array(normalizado, '\s+');
        sql := sql || ' and ((true';
        -- Um LIKE por palavra (padrões literais) para o planejador usar o índice trigram
        foreach palavra in array palavras loop
            sql := sql || format(
                ' and f.busca like %L',
                '%' || replace(replace(replace(palavra, '\', '\\'), '%', '\%'), '_', '\_') || '%'
            );
        end loop;
        sql := sql || ')';

        if length(digitos) >= 3 and btrim(termo) ~ '^[0-9.\-/[:space:]]+$' then
            sql := sql || format(' or f.documentos like %L', '%' || digitos || '%');
        end if;
        sql := sql || ')';
    end if;

    return query execute sql || ' order by f.nome_completo, f.id';
end;
$$;

create or replace function public.listar_cidades()
returns table (cidade text, total bigint)
language sql
stable
security invoker
set search_path = ''
as $$
    select f.cidade, count(*)
    from public.funcionarios f
    where coalesce(f.cidade, '') <> '' and f.deleted_at is null
    group by f.cidade
    order by f.cidade
$$;

-- ---------------------------------------------------------------------------
-- 3. Auditoria
-- ---------------------------------------------------------------------------
create table if not exists public.auditoria (
    id bigint generated always as identity primary key,
    tabela text not null,
    registro_id uuid,
    acao text not null check (acao in ('criado', 'alterado', 'excluido', 'restaurado', 'apagado')),
    usuario_id uuid references auth.users (id) on delete set null,
    antes jsonb,
    depois jsonb,
    criado_em timestamptz not null default now()
);

create index if not exists auditoria_criado_em_idx on public.auditoria (criado_em desc);
create index if not exists auditoria_registro_idx on public.auditoria (registro_id, criado_em desc);

alter table public.auditoria enable row level security;
revoke all on table public.auditoria from anon;
-- Ninguém escreve direto: só o gatilho (SECURITY DEFINER)
revoke insert, update, delete on table public.auditoria from authenticated;

drop policy if exists "auditoria_select_admin" on public.auditoria;
create policy "auditoria_select_admin" on public.auditoria
    for select to authenticated using ((select public.is_admin()));

-- Gatilho genérico: guarda apenas os campos que mudaram em alterações
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    ignorar text[] := array['busca', 'documentos', 'updated_at', 'updated_by', 'deleted_by'];
    antes jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) - ignorar end;
    depois jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) - ignorar end;
    acao text;
    antes_diff jsonb;
    depois_diff jsonb;
begin
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

        -- Mantém o nome para identificar o registro na tela de auditoria
        antes := antes_diff || jsonb_build_object('nome_completo', antes -> 'nome_completo');
        depois := depois_diff || jsonb_build_object('nome_completo', depois -> 'nome_completo');
    end if;

    insert into public.auditoria (tabela, registro_id, acao, usuario_id, antes, depois)
    values (
        tg_table_name,
        case when tg_op = 'DELETE' then old.id else new.id end,
        acao,
        (select auth.uid()),
        antes,
        depois
    );
    return null;
end;
$$;

revoke execute on function public.registrar_auditoria() from public, anon, authenticated;

drop trigger if exists auditoria_funcionarios on public.funcionarios;
create trigger auditoria_funcionarios
    after insert or update or delete on public.funcionarios
    for each row execute function public.registrar_auditoria();
