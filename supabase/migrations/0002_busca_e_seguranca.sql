-- 0002 — Busca no banco (sem acentos, paginada) e limpeza de políticas antigas
-- Rode depois de supabase/schema.sql. Idempotente: pode ser executado mais de uma vez.

-- ---------------------------------------------------------------------------
-- 1. Segurança: remove políticas criadas antes do schema.sql
-- ---------------------------------------------------------------------------
-- "Public can view photos" permitia que QUALQUER pessoa com a chave pública (anon)
-- listasse e baixasse as fotos pela API do Storage, mesmo com o bucket privado.
drop policy if exists "Public can view photos" on storage.objects;
drop policy if exists "Authenticated users can upload photos" on storage.objects;

-- Duplicatas das políticas de schema.sql (políticas permissivas somam-se com OR,
-- então duplicatas atrapalham futuras restrições e o desempenho).
drop policy if exists "Authenticated users can insert employees" on public.funcionarios;
drop policy if exists "Authenticated users can update employees" on public.funcionarios;
drop policy if exists "Authenticated users can view employees" on public.funcionarios;
drop policy if exists "Enable delete for users based on user_id" on public.funcionarios;

-- Visitantes não autenticados não precisam enxergar a tabela (nem no GraphQL).
revoke all on table public.funcionarios from anon;

-- ---------------------------------------------------------------------------
-- 2. Normalização de texto para busca
-- ---------------------------------------------------------------------------
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() não é IMMUTABLE; este wrapper fixa o dicionário para poder ser usado
-- em colunas geradas e índices.
create or replace function public.f_unaccent(texto text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
    select extensions.unaccent('extensions.unaccent'::regdictionary, texto)
$$;

-- Texto pesquisável (minúsculas, sem acentos) e dígitos de CPF/RG.
-- Obs.: lower() depois de unaccent() para funcionar também em bancos com locale "C".
alter table public.funcionarios
    add column if not exists busca text generated always as (
        lower(public.f_unaccent(
            coalesce(nome_completo, '') || ' ' || coalesce(apelido, '') || ' ' ||
            coalesce(nome_mae, '') || ' ' || coalesce(nome_pai, '') || ' ' ||
            coalesce(filiacao, '') || ' ' || coalesce(logradouro, '') || ' ' ||
            coalesce(bairro, '') || ' ' || coalesce(cidade, '') || ' ' ||
            coalesce(endereco, '')
        ))
    ) stored;

alter table public.funcionarios
    add column if not exists documentos text generated always as (
        regexp_replace(coalesce(cpf, '') || ' ' || coalesce(rg, ''), '[^0-9 ]', '', 'g')
    ) stored;

create index if not exists funcionarios_busca_trgm_idx
    on public.funcionarios using gin (busca extensions.gin_trgm_ops);
create index if not exists funcionarios_documentos_trgm_idx
    on public.funcionarios using gin (documentos extensions.gin_trgm_ops);
create index if not exists funcionarios_cidade_idx on public.funcionarios (cidade);

-- ---------------------------------------------------------------------------
-- 3. RPCs usadas pela listagem (paginação feita pelo PostgREST com .range())
-- ---------------------------------------------------------------------------
-- Cada palavra do termo precisa aparecer no texto pesquisável. Termos só com
-- números/pontuação (ex.: "123.456") também buscam nos dígitos de CPF/RG.
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
    sql text := 'select f.* from public.funcionarios f where true';
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
    where coalesce(f.cidade, '') <> ''
    group by f.cidade
    order by f.cidade
$$;

revoke execute on function public.buscar_funcionarios(text, text) from public, anon;
revoke execute on function public.listar_cidades() from public, anon;
grant execute on function public.buscar_funcionarios(text, text) to authenticated;
grant execute on function public.listar_cidades() to authenticated;
