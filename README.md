# Registro de Abordados (PWA)

Aplicação Web Progressiva (PWA) para cadastro de abordados com foto, documentos, filiação e endereço, desenvolvida com Next.js 16, Tailwind CSS 4 e Supabase.

## 🚀 Configuração Inicial

### 1. Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env.local` e preencha com suas credenciais do Supabase:

```bash
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_projeto
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
```

### 2. Banco de Dados (Supabase)
1. Acesse o painel do Supabase.
2. Vá em **SQL Editor**.
3. Copie e execute o conteúdo de [`supabase/schema.sql`](supabase/schema.sql).
   - Cria a tabela `funcionarios`, o bucket **privado** `fotos-funcionarios` e as políticas de segurança (RLS).
   - O script é idempotente. **Projetos existentes** (criados quando o bucket era público) devem rodá-lo novamente: ele torna o bucket privado e cria as políticas de acesso às fotos. Registros antigos continuam funcionando — o app converte a URL pública salva no caminho do arquivo.

### 3. Instalação e Execução
Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

Acesse `https://localhost:3000` (o modo dev usa HTTPS para liberar a câmera no celular).

## 📱 Funcionalidades
- **Login Seguro**: Acesso restrito via Supabase Auth; todas as rotas são protegidas pelo `src/proxy.ts`.
- **Dashboard**: Lista de abordados com busca sem acentos por nome, apelido, filiação, endereço, CPF ou RG (com ou sem pontuação).
- **Cadastro**: Formulário otimizado para mobile com captura de câmera, compressão automática de imagem, validação de CPF (dígitos verificadores) e preenchimento de endereço pelo CEP (ViaCEP).
- **Fotos privadas**: As fotos ficam em bucket privado e são exibidas por URLs assinadas temporárias (1 hora). Fotos substituídas ou de registros excluídos são removidas do storage.
- **PWA**: Instalável no celular (Adicionar à Tela Inicial).

## 🛠️ Estrutura do Projeto
- `src/app`: Páginas e Rotas (App Router), incluindo telas de carregamento, erro e "não encontrado".
- `src/components`: Componentes Reutilizáveis (EmployeeCard, EmployeeForm, CameraInput...).
- `src/lib/supabase`: Clientes Supabase (Client, Server, Middleware/Proxy).
- `src/lib/photos.ts`: Upload/remoção de fotos e geração de URLs assinadas.
- `src/lib/format.ts`: Máscaras e validações (CPF, CEP) e normalização de texto para busca.
- `supabase/schema.sql`: Esquema do banco, bucket e políticas RLS.

## ⚠️ Notas Importantes
- **PWA**: O suporte a PWA está configurado no `next.config.ts` (desativado em desenvolvimento). Os arquivos do service worker são gerados em `public/` durante o build e não são versionados.
- **Login**: O primeiro usuário deve ser criado via painel do Supabase (Auth > Users) ou SignUp habilitado temporariamente. O sistema assume login existente.
