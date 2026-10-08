-- 0007 — Correções apontadas pelo verificador de segurança do Supabase (Advisors)
-- Rode depois da 0006 e SEMPRE por último (as migrações anteriores recriam as funções em
-- "public"; se alguma for rodada de novo, rode esta outra vez em seguida).
-- Idempotente. Dica: no SQL Editor, cole o arquivo inteiro e rode SEM nenhum trecho selecionado.

-- ---------------------------------------------------------------------------
-- 1. Funções de acesso fora da API (aviso "Signed-In Users Can Execute SECURITY DEFINER")
--    O schema "private" não é exposto pela API REST/GraphQL; as regras de acesso
--    continuam podendo usá-las.
-- ---------------------------------------------------------------------------
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.perfis
        where user_id = (select auth.uid()) and status = 'ativo'
    )
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1 from public.perfis
        where user_id = (select auth.uid()) and papel = 'admin' and status = 'ativo'
    )
$$;

revoke execute on function private.is_ativo() from public, anon;
revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_ativo() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Aponta todas as regras de acesso (tabelas e storage) para as funções em "private"
do $$
declare
    p record;
    usando text;
    checando text;
    comando text;
begin
    -- Com search_path vazio, as expressões vêm com o schema escrito (public.is_admin())
    perform set_config('search_path', '', true);

    for p in
        select schemaname, tablename, policyname, qual, with_check
        from pg_catalog.pg_policies
        where coalesce(qual, '') || coalesce(with_check, '') ~ 'public\.is_(admin|ativo)\(\)'
    loop
        usando := replace(replace(p.qual, 'public.is_admin()', 'private.is_admin()'), 'public.is_ativo()', 'private.is_ativo()');
        checando := replace(replace(p.with_check, 'public.is_admin()', 'private.is_admin()'), 'public.is_ativo()', 'private.is_ativo()');

        comando := format('alter policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
        if usando is not null then
            comando := comando || format(' using (%s)', usando);
        end if;
        if checando is not null then
            comando := comando || format(' with check (%s)', checando);
        end if;
        execute comando;
    end loop;
end;
$$;

-- Sem nada mais dependendo delas, as versões públicas saem da API
-- (se alguma regra ainda usar, o Postgres recusa e nada é apagado)
drop function if exists public.is_admin();
drop function if exists public.is_ativo();

-- ---------------------------------------------------------------------------
-- 2. GraphQL desligado (aviso "Signed-In Users Can See Object in GraphQL Schema")
--    O app usa apenas a API REST; o GraphQL só mostrava a estrutura das tabelas.
--    Para religar no futuro: create extension pg_graphql;
-- ---------------------------------------------------------------------------
drop extension if exists pg_graphql;
