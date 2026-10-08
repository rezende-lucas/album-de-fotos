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
3. Execute, nesta ordem:
   1. [`supabase/schema.sql`](supabase/schema.sql) — tabela `funcionarios`, bucket **privado** `fotos-funcionarios` e políticas de segurança (RLS).
   2. Cada arquivo de [`supabase/migrations/`](supabase/migrations) em ordem numérica (`0002_…`, `0003_…`).

   Todos os scripts são idempotentes (podem ser rodados novamente). **Cole o arquivo inteiro e rode sem nenhum trecho selecionado** — com uma seleção ativa, o SQL Editor executa só a parte selecionada. Em projetos existentes, rode apenas as migrações novas de cada atualização. Registros antigos continuam funcionando — o app converte a URL pública de fotos antigas no caminho do arquivo.

### 3. Instalação e Execução
Instale as dependências e inicie o servidor:

```bash
npm install
npm run dev
```

Acesse `https://localhost:3000` (o modo dev usa HTTPS para liberar a câmera no celular).

## 📱 Funcionalidades
- **Login Seguro**: Acesso restrito via Supabase Auth; todas as rotas são protegidas pelo `src/proxy.ts`.
- **Dashboard**: Lista paginada (rolagem infinita) com busca no banco sem acentos por nome, apelido, filiação, endereço, CPF ou RG (com ou sem pontuação) e filtro por cidade.
- **Interface**: Modo escuro automático (segue o sistema), layout adaptado para computador, avisos de confirmação e diálogos próprios.
- **Cadastro**: Formulário otimizado para mobile, validação de CPF (dígitos verificadores) e preenchimento de endereço pelo CEP (ViaCEP).
- **Álbum de fotos**: Até 20 fotos por pessoa (rosto, perfil, corpo, tatuagem/sinal, documento…) com legenda e foto principal (★). As fotos são comprimidas no próprio aparelho e ganham uma miniatura leve para a lista e a galeria. Na ficha, a galeria abre em tela cheia com setas, deslizar e Esc.
- **Perfis de acesso**: **Agentes** cadastram e editam; **Administradores** também excluem (lixeira), restauram, apagam definitivamente, consultam a auditoria e definem o papel dos usuários (ícone de escudo na tela inicial → Administração).
- **Lixeira e auditoria**: Exclusões são reversíveis; toda criação, alteração, exclusão e restauração fica registrada com autor, data e campos alterados.
- **Fotos privadas**: As fotos ficam em bucket privado e são exibidas por URLs assinadas temporárias (1 hora). Fotos removidas do álbum ou de cadastros apagados definitivamente são removidas do storage.
- **PWA**: Instalável no celular (Adicionar à Tela Inicial).

## 🛠️ Estrutura do Projeto
- `src/app`: Páginas e Rotas (App Router), incluindo telas de carregamento, erro e "não encontrado"; `actions.ts` com as Server Actions.
- `src/components`: Componentes Reutilizáveis (EmployeeCard, EmployeeForm, CameraInput...).
- `src/lib/supabase`: Clientes Supabase (Client, Server, Middleware/Proxy).
- `src/lib/photos.ts`: URLs assinadas, leitura do álbum e remoção de arquivos (servidor e cliente).
- `src/lib/photo-upload.ts`: Compressão, miniaturas e gravação do álbum (cliente).
- `src/lib/funcionarios.ts`: Listagem paginada (RPC `buscar_funcionarios`) e cidades para filtro.
- `src/lib/format.ts`: Máscaras e validações (CPF, CEP) e normalização de texto para busca.
- `supabase/schema.sql` e `supabase/migrations/`: Esquema do banco, bucket, políticas RLS e funções de busca.

## ⚠️ Notas Importantes
- **PWA**: O suporte a PWA está configurado no `next.config.ts` (desativado em desenvolvimento). Os arquivos do service worker são gerados em `public/` durante o build e não são versionados.
- **Login**: Usuários são criados no painel do Supabase (Authentication → Users) e entram como **agentes**. A migração `0003` torna administrador o usuário mais antigo; depois disso, promova outros pela tela **Administração → Usuários** (o sistema impede ficar sem nenhum administrador).
