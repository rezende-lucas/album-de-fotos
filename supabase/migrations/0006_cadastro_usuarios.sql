-- 0006 — Cadastro de usuários (nome, CPF, matrícula, foto da funcional) com aprovação
-- Rode depois da 0005. Idempotente: pode ser executado mais de uma vez.
-- Dica: no SQL Editor, cole o arquivo inteiro e rode SEM nenhum trecho selecionado.
--
-- Fluxo: a pessoa se cadastra em /cadastro -> conta "pendente" -> um admin confere a
-- funcional e aprova em Administração -> Usuários. Sem aprovação, o banco não libera
-- nenhum dado (não é só a tela que bloqueia).

-- ---------------------------------------------------------------------------
-- 1. Dados do usuário e situação da conta
-- ---------------------------------------------------------------------------
alter table public.perfis add column if not exists cpf text;
alter table public.perfis add column if not exists matricula text;
alter table public.perfis add column if not exists funcional_url text;   -- caminho no bucket "funcionais"
alter table public.perfis add column if not exists status text;
alter table public.perfis add column if not exists aprovado_por uuid references auth.users (id) on delete set null;
alter table public.perfis add column if not exists aprovado_em timestamptz;

-- Quem já usava o sistema continua ativo
update public.perfis set status = 'ativo' where status is null;
alter table public.perfis alter column status set default 'pendente';
alter table public.perfis alter column status set not null;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'perfis_status_check') then
        alter table public.perfis add constraint perfis_status_check
            check (status in ('pendente', 'ativo', 'recusado', 'bloqueado'));
    end if;
end;
$$;

create unique index if not exists perfis_cpf_unico on public.perfis (cpf) where cpf is not null;
create index if not exists perfis_status_idx on public.perfis (status);

-- ---------------------------------------------------------------------------
-- 2. Funções de acesso: só contas ativas enxergam dados
-- ---------------------------------------------------------------------------
create or replace function public.is_ativo()
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

create or replace function public.is_admin()
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

revoke execute on function public.is_ativo() from public, anon;
grant execute on function public.is_ativo() to authenticated;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Perfil criado no cadastro (dados enviados pelo formulário em /cadastro)
-- ---------------------------------------------------------------------------
create or replace function public.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
    cpf_digitos text := regexp_replace(coalesce(meta ->> 'cpf', ''), '[^0-9]', '', 'g');
    funcional text := meta ->> 'funcional';
begin
    insert into public.perfis (user_id, email, nome, cpf, matricula, funcional_url, status)
    values (
        new.id,
        new.email,
        coalesce(nullif(btrim(meta ->> 'nome'), ''), split_part(new.email, '@', 1)),
        -- CPF guardado formatado (000.000.000-00), como nos cadastros de abordados
        case when length(cpf_digitos) = 11 then
            substr(cpf_digitos, 1, 3) || '.' || substr(cpf_digitos, 4, 3) || '.' ||
            substr(cpf_digitos, 7, 3) || '-' || substr(cpf_digitos, 10, 2)
        end,
        nullif(btrim(meta ->> 'matricula'), ''),
        -- Só aceita arquivos enviados pela página de cadastro
        case when funcional ~ '^cadastro/[A-Za-z0-9._-]+$' then funcional end,
        'pendente'
    )
    on conflict (user_id) do nothing;
    return new;
end;
$$;

revoke execute on function public.criar_perfil_usuario() from public, anon, authenticated;

-- Nunca deixar o sistema sem um administrador ativo
create or replace function public.proteger_ultimo_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    if old.papel = 'admin' and old.status = 'ativo'
       and (tg_op = 'DELETE' or new.papel <> 'admin' or new.status <> 'ativo')
       and not exists (
           select 1 from public.perfis
           where papel = 'admin' and status = 'ativo' and user_id <> old.user_id
       ) then
        raise exception 'É preciso manter ao menos um administrador ativo.' using errcode = 'P0001';
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

-- Registra quem aprovou e impede alterar CPF/funcional pelo app
create or replace function public.perfis_controle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.user_id := old.user_id;
    new.cpf := old.cpf;
    new.funcional_url := old.funcional_url;
    if new.status = 'ativo' and old.status <> 'ativo' then
        new.aprovado_por := (select auth.uid());
        new.aprovado_em := now();
    else
        new.aprovado_por := old.aprovado_por;
        new.aprovado_em := old.aprovado_em;
    end if;
    return new;
end;
$$;

drop trigger if exists perfis_controle on public.perfis;
create trigger perfis_controle
    before update on public.perfis
    for each row execute function public.perfis_controle();

-- Cada um vê o próprio perfil (para saber se foi aprovado); contas ativas veem a equipe
drop policy if exists "perfis_select_authenticated" on public.perfis;
drop policy if exists "perfis_select" on public.perfis;
create policy "perfis_select" on public.perfis
    for select to authenticated
    using (user_id = (select auth.uid()) or (select public.is_ativo()));

-- ---------------------------------------------------------------------------
-- 4. Políticas de dados exigem conta ativa
--    (fotos e abordagens dependem de funcionarios, então herdam a regra)
-- ---------------------------------------------------------------------------
drop policy if exists "funcionarios_select" on public.funcionarios;
create policy "funcionarios_select" on public.funcionarios
    for select to authenticated
    using ((select public.is_ativo()) and (deleted_at is null or (select public.is_admin())));

drop policy if exists "funcionarios_insert" on public.funcionarios;
create policy "funcionarios_insert" on public.funcionarios
    for insert to authenticated
    with check ((select public.is_ativo()) and deleted_at is null);

drop policy if exists "funcionarios_update" on public.funcionarios;
create policy "funcionarios_update" on public.funcionarios
    for update to authenticated
    using ((select public.is_ativo()) and (deleted_at is null or (select public.is_admin())))
    with check ((select public.is_ativo()) and (deleted_at is null or (select public.is_admin())));

-- Fotos dos abordados no storage: só contas ativas
drop policy if exists "fotos_select_authenticated" on storage.objects;
create policy "fotos_select_authenticated" on storage.objects
    for select to authenticated
    using (bucket_id = 'fotos-funcionarios' and (select public.is_ativo()));

drop policy if exists "fotos_insert_authenticated" on storage.objects;
create policy "fotos_insert_authenticated" on storage.objects
    for insert to authenticated
    with check (bucket_id = 'fotos-funcionarios' and (select public.is_ativo()));

drop policy if exists "fotos_update_authenticated" on storage.objects;
create policy "fotos_update_authenticated" on storage.objects
    for update to authenticated
    using (bucket_id = 'fotos-funcionarios' and (select public.is_ativo()));

drop policy if exists "fotos_delete_authenticated" on storage.objects;
create policy "fotos_delete_authenticated" on storage.objects
    for delete to authenticated
    using (bucket_id = 'fotos-funcionarios' and (select public.is_ativo()));

-- ---------------------------------------------------------------------------
-- 5. Bucket privado das funcionais
--    O envio acontece antes da conta existir (o visitante ainda não está logado),
--    por isso o anon pode APENAS enviar imagens para "cadastro/". Ninguém além do
--    admin lista, baixa ou apaga.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('funcionais', 'funcionais', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "funcionais_insert_cadastro" on storage.objects;
create policy "funcionais_insert_cadastro" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'funcionais' and (storage.foldername(name))[1] = 'cadastro');

drop policy if exists "funcionais_select_admin" on storage.objects;
create policy "funcionais_select_admin" on storage.objects
    for select to authenticated
    using (bucket_id = 'funcionais' and (select public.is_admin()));

drop policy if exists "funcionais_delete_admin" on storage.objects;
create policy "funcionais_delete_admin" on storage.objects
    for delete to authenticated
    using (bucket_id = 'funcionais' and (select public.is_admin()));
