-- 0004 — Várias fotos por pessoa (álbum) com miniaturas
-- Rode depois da 0003. Idempotente: pode ser executado mais de uma vez.
-- Dica: no SQL Editor, cole o arquivo inteiro e rode SEM nenhum trecho selecionado.

-- ---------------------------------------------------------------------------
-- 1. Tabela de fotos
-- ---------------------------------------------------------------------------
create table if not exists public.fotos (
    id uuid primary key default gen_random_uuid(),
    funcionario_id uuid not null references public.funcionarios (id) on delete cascade,
    caminho text not null,          -- arquivo no bucket "fotos-funcionarios"
    miniatura text,                 -- versão pequena (lista e galeria)
    tipo text not null default 'rosto'
        check (tipo in ('rosto', 'perfil', 'corpo', 'tatuagem', 'documento', 'outro')),
    legenda text,
    principal boolean not null default false,
    ordem integer not null default 0,
    abordagem_id uuid,              -- vínculo com abordagens (etapa 4)
    created_by uuid default auth.uid() references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create unique index if not exists fotos_principal_unica on public.fotos (funcionario_id) where principal;
create index if not exists fotos_funcionario_idx on public.fotos (funcionario_id, ordem);

-- Miniatura da foto principal, mantida por gatilho (a lista continua com 1 consulta)
alter table public.funcionarios add column if not exists foto_miniatura text;

alter table public.fotos enable row level security;
revoke all on table public.fotos from anon;

-- Acesso às fotos segue o acesso ao cadastro (agente: só cadastros fora da lixeira)
drop policy if exists "fotos_select" on public.fotos;
create policy "fotos_select" on public.fotos
    for select to authenticated
    using (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

drop policy if exists "fotos_insert" on public.fotos;
create policy "fotos_insert" on public.fotos
    for insert to authenticated
    with check (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

drop policy if exists "fotos_update" on public.fotos;
create policy "fotos_update" on public.fotos
    for update to authenticated
    using (exists (select 1 from public.funcionarios f where f.id = funcionario_id))
    with check (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

drop policy if exists "fotos_delete" on public.fotos;
create policy "fotos_delete" on public.fotos
    for delete to authenticated
    using (exists (select 1 from public.funcionarios f where f.id = funcionario_id));

-- ---------------------------------------------------------------------------
-- 2. Foto de capa: funcionarios.foto_url/foto_miniatura = principal (ou a primeira)
-- ---------------------------------------------------------------------------
create or replace function public.sincronizar_foto_capa()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    alvo uuid;
    capa record;
begin
    foreach alvo in array array[
        case when tg_op <> 'INSERT' then old.funcionario_id end,
        case when tg_op <> 'DELETE' then new.funcionario_id end
    ] loop
        continue when alvo is null;

        select caminho, miniatura into capa
        from public.fotos
        where funcionario_id = alvo
        order by principal desc, ordem, created_at
        limit 1;

        update public.funcionarios
        set foto_url = capa.caminho, foto_miniatura = capa.miniatura
        where id = alvo
          and (foto_url is distinct from capa.caminho or foto_miniatura is distinct from capa.miniatura);
    end loop;
    return null;
end;
$$;

revoke execute on function public.sincronizar_foto_capa() from public, anon, authenticated;

drop trigger if exists sincronizar_foto_capa on public.fotos;
create trigger sincronizar_foto_capa
    after insert or update or delete on public.fotos
    for each row execute function public.sincronizar_foto_capa();

-- ---------------------------------------------------------------------------
-- 3. Auditoria: registra fotos no cadastro da pessoa
-- ---------------------------------------------------------------------------
create or replace function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    -- foto_url/foto_miniatura mudam junto com a tabela fotos, que já é auditada
    ignorar text[] := array['busca', 'documentos', 'updated_at', 'updated_by', 'deleted_by', 'foto_url', 'foto_miniatura'];
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

-- ---------------------------------------------------------------------------
-- 4. Fotos já existentes viram a foto principal do álbum
--    (depois da nova função de auditoria, para não registrar a conversão de foto_url)
-- ---------------------------------------------------------------------------
insert into public.fotos (funcionario_id, caminho, principal, created_by, created_at)
select
    f.id,
    -- URLs públicas antigas viram caminho (mesma regra de getPhotoPath no app)
    split_part(regexp_replace(f.foto_url, '^https?://.*/fotos-funcionarios/', ''), '?', 1),
    true,
    f.user_id,
    f.created_at
from public.funcionarios f
where coalesce(f.foto_url, '') <> ''
  and not exists (select 1 from public.fotos x where x.funcionario_id = f.id);

-- Auditoria das fotos (criada depois da conversão acima, que não é uma ação de usuário)
drop trigger if exists auditoria_fotos on public.fotos;
create trigger auditoria_fotos
    after insert or update or delete on public.fotos
    for each row execute function public.registrar_auditoria();
