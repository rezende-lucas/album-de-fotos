# Diretório de Funcionários (PWA)

Aplicação Web Progressiva (PWA) para gestão de funcionários, desenvolvida com Next.js 16, Tailwind CSS e Supabase.

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente
Renomeie o arquivo `env.example` para `.env.local` e preencha com suas credenciais do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 2. Banco de Dados (Supabase)
1. Acesse o painel do Supabase.
2. Vá em **SQL Editor**.
3. Copie e execute o conteúdo do arquivo `supabase_schema.sql` (gerado na raiz ou artifacts).
   - Isso criará a tabela `funcionarios`, o Bucket de Storage `fotos-funcionarios` e as políticas de segurança (RLS).

### 3. Instalação e Execução
Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

## 📱 Funcionalidades
- **Login Seguro**: Acesso restrito via Supabase Auth.
- **Dashboard**: Lista de funcionários com busca rápida.
- **Cadastro**: Formulário otimizado para mobile com captura de câmera e compressão automática de imagem.
- **PWA**: Instalável no celular (Adicionar à Tela Inicial).

## 🛠️ Estrutura do Projeto
- `src/app`: Páginas e Rotas (App Router).
- `src/components`: Componentes Reutilizáveis (EmployeeCard, CameraInput).
- `src/lib/supabase`: Clientes Supabase (Client, Server, Middleware).

## ⚠️ Notas Importantes
- **PWA**: O suporte a PWA está configurado no `next.config.ts`. Em caso de erro no build (WorkerError), verifique a compatibilidade do plugin `@ducanh2912/next-pwa` com sua versão do Node/Next.
- **Login**: O primeiro usuário deve ser criado via painel do Supabase (Auth > Users) ou SignUp habilitado temporariamente. O sistema assume login existente.
