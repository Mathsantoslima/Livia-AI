# 🚀 Deploy no Vercel - Guia Rápido

## ✅ Git Publicado com Sucesso!

Seu repositório está disponível em:
**https://github.com/Mathsantoslima/Livia-AI**

---

## 🌐 Deploy no Vercel

### **Opção 1: Via Dashboard (Recomendado)**

1. **Acesse**: https://vercel.com
2. **Faça login** com sua conta GitHub
3. **Clique**: "Add New Project"
4. **Import Git Repository**:

   - Selecione `Mathsantoslima/Livia-AI`
   - Clique em "Import"

5. **Configure o Backend**:

   - **Project Name**: `livia-ai-backend` (ou o nome que preferir)
   - **Root Directory**: `fibromialgia-assistant/backend`
   - **Framework Preset**: Other
   - **Build Command**: `npm install`
   - **Output Directory**: `.` (deixe vazio)
   - **Install Command**: `npm install`

6. **Environment Variables** (Settings > Environment Variables):

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
   JWT_SECRET=seu-secret-jwt-aleatorio
   SERVER_BASE_URL=https://seu-backend.vercel.app
   ```

7. **Deploy**: Clique em "Deploy"

---

### **Opção 2: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# No diretório do backend
cd fibromialgia-assistant/backend
vercel

# Seguir as instruções interativas
# Quando perguntar sobre variáveis de ambiente, adicione uma por uma
```

---

## 🎨 Deploy do Frontend (Separado)

O frontend precisa de um deploy separado:

1. **Criar novo projeto no Vercel**
2. **Root Directory**: `fibromialgia-assistant/admin-panel`
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

## ⚙️ Configurações Importantes

### **Backend (Vercel)**

- **Runtime**: Node.js 18.x ou superior
- **Build Command**: `npm install` (ou deixe vazio)
- **Output Directory**: `.` (raiz do backend)

### **Frontend (Vercel)**

- **Framework**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`

---

## 🔗 URLs Após Deploy

Após o deploy, você terá URLs como:

- **Backend**: `https://livia-ai-backend.vercel.app`
- **Frontend**: `https://livia-ai-frontend.vercel.app`

---

## 🔄 Atualizações Automáticas

O Vercel faz deploy automático a cada push no GitHub!

Basta fazer:

```bash
git add .
git commit -m "Sua mensagem"
git push
```

O Vercel detecta automaticamente e faz o deploy! 🚀

---

## ⚠️ Importante

1. **Webhook W-API**: Após o deploy, atualize a URL do webhook no painel W-API para:
   `https://seu-backend.vercel.app/api/webhook/w-api`

2. **CORS**: O backend já está configurado para aceitar requisições do frontend

3. **Variáveis de Ambiente**: Nunca commite arquivos `.env` com chaves reais!

---

## 🆘 Problemas Comuns

### Erro: "Module not found"

- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que o `node_modules` está no `.gitignore`

### Erro: "Build failed"

- Verifique os logs no dashboard do Vercel
- Certifique-se de que todas as variáveis de ambiente estão configuradas

### Erro: "Function timeout"

- Aumente o timeout nas configurações do projeto (Settings > Functions)

---

**Pronto! Seu projeto estará no ar! 🎉**
