-- Registro de Abordados — esquema do Supabase
-- Execute no SQL Editor do Supabase. O script é idempotente: pode ser rodado
-- novamente em um projeto existente (ex.: para tornar o bucket de fotos privado).

-- ---------------------------------------------------------------------------
-- Tabela
-- ---------------------------------------------------------------------------
create table if not exists public.funcionarios (
    id uuid primary key default gen_random_uuid(),
    created_at timestamptz not null default now(),
    user_id uuid default auth.uid() references auth.users (id) on delete set null,

    nome_completo text not null,
    apelido text,
    cpf text not null unique,
    rg text,

    nome_mae text,
    nome_pai text,
    filiacao text,        -- legado (antes de nome_mae/nome_pai)

    cep text,
    logradouro text,
    numero text,
    complemento text,
    bairro text,
    cidade text,
    estado text,
    endereco text,        -- legado (endereço em texto livre)

    -- Caminho do arquivo no bucket "fotos-funcionarios".
    -- Registros antigos podem conter a URL pública completa; o app aceita os dois formatos.
    foto_url text
);

create index if not exists funcionarios_nome_completo_idx on public.funcionarios (nome_completo);

alter table public.funcionarios enable row level security;

drop policy if exists "funcionarios_select_authenticated" on public.funcionarios;
create policy "funcionarios_select_authenticated" on public.funcionarios
    for select to authenticated using (true);

drop policy if exists "funcionarios_insert_authenticated" on public.funcionarios;
create policy "funcionarios_insert_authenticated" on public.funcionarios
    for insert to authenticated with check (true);

drop policy if exists "funcionarios_update_authenticated" on public.funcionarios;
create policy "funcionarios_update_authenticated" on public.funcionarios
    for update to authenticated using (true) with check (true);

drop policy if exists "funcionarios_delete_authenticated" on public.funcionarios;
create policy "funcionarios_delete_authenticated" on public.funcionarios
    for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Storage: bucket PRIVADO de fotos (acesso apenas via URLs assinadas)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-funcionarios', 'fotos-funcionarios', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
    set public = false,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "fotos_select_authenticated" on storage.objects;
create policy "fotos_select_authenticated" on storage.objects
    for select to authenticated using (bucket_id = 'fotos-funcionarios');

drop policy if exists "fotos_insert_authenticated" on storage.objects;
create policy "fotos_insert_authenticated" on storage.objects
    for insert to authenticated with check (bucket_id = 'fotos-funcionarios');

drop policy if exists "fotos_update_authenticated" on storage.objects;
create policy "fotos_update_authenticated" on storage.objects
    for update to authenticated using (bucket_id = 'fotos-funcionarios');

drop policy if exists "fotos_delete_authenticated" on storage.objects;
create policy "fotos_delete_authenticated" on storage.objects
    for delete to authenticated using (bucket_id = 'fotos-funcionarios');
