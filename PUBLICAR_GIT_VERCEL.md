# 🚀 Publicar Projeto no Git e Vercel - GUIA COMPLETO

## 📋 Pré-requisitos

- ✅ Conta no GitHub
- ✅ Conta no Vercel
- ✅ Git instalado no seu computador

---

## 🔧 PASSO 1: Preparar o Projeto

### 1.1 Verificar arquivos sensíveis

Já foi criado um `.gitignore` para proteger:

- Arquivos `.env` (não serão commitados)
- `node_modules/`
- Sessões do WhatsApp
- Logs e arquivos temporários

---

## 📦 PASSO 2: Inicializar Git e Fazer Primeiro Commit

### 2.1 Inicializar repositório Git

```bash
cd /Users/matheuslima/Downloads/fibro.ia
git init
```

### 2.2 Adicionar todos os arquivos

```bash
git add .
```

### 2.3 Fazer primeiro commit

```bash
git commit -m "🎉 Primeiro commit: Sistema Fibro.IA completo"
```

---

## 🔗 PASSO 3: Criar Repositório no GitHub

### 3.1 No GitHub.com:

1. **Acesse**: https://github.com/new
2. **Nome do repositório**: `fibro.ia` (ou o nome que preferir)
3. **Descrição**: "Sistema completo de assistente de IA para pacientes com fibromialgia"
4. **Escolha**: Público ou Privado
5. **NÃO** marque "Initialize with README" (já temos um)
6. **Clique**: "Create repository"

### 3.2 Conectar repositório local ao GitHub

Após criar o repositório no GitHub, você verá instruções. Execute no terminal:

```bash
cd /Users/matheuslima/Downloads/fibro.ia
git remote add origin https://github.com/SEU-USUARIO/fibro.ia.git
git branch -M main
git push -u origin main
```

**Substitua** `SEU-USUARIO` pelo seu usuário do GitHub!

---

## ⚠️ IMPORTANTE: Antes de Fazer Push

### Criar arquivo `.env.example` para documentação

Crie um arquivo `.env.example` no backend com as variáveis necessárias (sem valores reais):

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
cat > .env.example << 'EOF'
# Servidor
PORT=3000
NODE_ENV=development
SERVER_BASE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase

# IA Providers
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=sua-chave-openai
CLAUDE_API_KEY=sua-chave-claude
GEMINI_MODEL=gemini-1.5-pro-latest

# WhatsApp (W-API)
W_API_URL=https://api.w-api.app
W_API_TOKEN=seu-token-w-api
W_API_INSTANCE_ID=sua-instancia

# JWT
JWT_SECRET=seu-secret-jwt
EOF
```

**Faça commit do `.env.example`**:

```bash
git add fibromialgia-assistant/backend/.env.example
git commit -m "📝 Adicionar .env.example para documentação"
```

---

## 🌐 PASSO 4: Deploy no Vercel

### 4.1 Instalar Vercel CLI (opcional, mas recomendado)

```bash
npm i -g vercel
```

### 4.2 Deploy via Dashboard (Mais Fácil) ✅ RECOMENDADO

1. **Acesse**: https://vercel.com
2. **Clique**: "Add New Project"
3. **Import Git Repository**: Conecte com seu GitHub
4. **Selecione**: O repositório `fibro.ia`
5. **Configure o Projeto**:
   - **Root Directory**: `/fibromialgia-assistant/backend` (para o backend)
   - **Framework Preset**: Other
   - **Build Command**: `npm install && npm start`
   - **Output Directory**: `.` (deixe vazio)
   - **Install Command**: `npm install`

### 4.3 Configurar Variáveis de Ambiente no Vercel

No dashboard do Vercel, vá em **Settings > Environment Variables** e adicione:

```
NODE_ENV=production
PORT=3000
SUPABASE_URL=sua-url-supabase
SUPABASE_KEY=sua-chave-supabase
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=sua-chave-openai
CLAUDE_API_KEY=sua-chave-claude
GEMINI_MODEL=gemini-1.5-pro-latest
W_API_URL=https://api.w-api.app
W_API_TOKEN=seu-token-w-api
W_API_INSTANCE_ID=sua-instancia
JWT_SECRET=seu-secret-jwt
SERVER_BASE_URL=https://seu-projeto.vercel.app
```

**⚠️ IMPORTANTE**: Substitua todos os valores pelos seus valores reais!

### 4.4 Deploy

Clique em **Deploy** e aguarde o processo!

---

## 🎯 PASSO 5: Deploy do Frontend (Separado)

O frontend precisa de um deploy separado:

1. **Crie outro projeto no Vercel**
2. **Root Directory**: `/fibromialgia-assistant/admin-panel`
3. **Framework Preset**: Create React App
4. **Build Command**: `npm run build`
5. **Output Directory**: `build`
6. **Environment Variables**:
   ```
   REACT_APP_API_URL=https://seu-backend.vercel.app
   REACT_APP_SUPABASE_URL=sua-url-supabase
   REACT_APP_SUPABASE_ANON_KEY=sua-chave-supabase
   ```

---

## 🔄 PASSO 6: Atualizações Futuras

Para atualizar o projeto:

```bash
# Fazer suas alterações...

# Adicionar mudanças
git add .

# Commit
git commit -m "Descrição das mudanças"

# Push para GitHub
git push

# O Vercel fará deploy automático! 🚀
```

---

## ✅ Checklist Final

- [ ] Repositório Git inicializado
- [ ] Arquivo `.gitignore` criado
- [ ] `.env.example` criado (sem valores reais)
- [ ] Primeiro commit feito
- [ ] Repositório criado no GitHub
- [ ] Push feito para GitHub
- [ ] Projeto criado no Vercel
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Backend deployado
- [ ] Frontend deployado (separado)
- [ ] Testes realizados em produção

---

## 🆘 Problemas Comuns

### Erro: "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/SEU-USUARIO/fibro.ia.git
```

### Erro: "refusing to merge unrelated histories"

```bash
git pull origin main --allow-unrelated-histories
```

### Erro no Vercel: "Module not found"

Verifique se todas as dependências estão no `package.json` e se o `node_modules` está no `.gitignore`.

---

## 📞 Próximos Passos

1. **Webhook do W-API**: Atualize a URL do webhook para apontar para o backend no Vercel
2. **CORS**: Configure CORS no backend para aceitar requisições do frontend
3. **Domain**: Configure um domínio personalizado no Vercel (opcional)

---

**Pronto! Seu projeto estará no ar! 🎉**
