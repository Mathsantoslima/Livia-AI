# 🔧 Solução: Erro 404 NOT_FOUND no Vercel

## ❌ Problema

```
404: NOT_FOUND
Code: NOT_FOUND
ID: gru1::m5d2f-1768441615131-0cef9a4dac45
```

## ✅ Correção Aplicada

### **Problema Principal**

O Vercel precisa que o arquivo `server.js` **exporte o app Express**, não o servidor HTTP. O Vercel gerencia o servidor HTTP automaticamente.

### **Mudanças no `server.js`**

**Antes:**
```javascript
const server = app.listen(port, () => {
  // ...
});

module.exports = server; // ❌ ERRADO para Vercel
```

**Depois:**
```javascript
// Exportar app para Vercel (serverless) - DEVE SER O ÚLTIMO
module.exports = app; // ✅ CORRETO para Vercel

// Iniciar servidor apenas se executado diretamente (não no Vercel)
if (require.main === module) {
  const server = app.listen(port, () => {
    // ...
  });
  // ... graceful shutdown apenas em modo local
}
```

---

## 🎯 Como Funciona

### **No Vercel (Serverless)**
- O Vercel importa o `app` Express
- O Vercel gerencia o servidor HTTP automaticamente
- Não precisa chamar `app.listen()`

### **Localmente (Desenvolvimento)**
- `require.main === module` é `true`
- O servidor HTTP é iniciado normalmente
- Graceful shutdown funciona normalmente

---

## ✅ Checklist de Verificação

- [x] `server.js` exporta `app` (não `server`)
- [x] `app.listen()` só é chamado se `require.main === module`
- [x] `vercel.json` configurado corretamente
- [x] Root Directory no Vercel: `fibromialgia-assistant/backend`
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Testar rota `/health` após deploy

---

## 🧪 Testar Após Deploy

### **1. Health Check**
```bash
curl https://seu-projeto.vercel.app/health
```

**Resposta esperada:**
```json
{
  "status": "online",
  "timestamp": "2026-01-15T...",
  "environment": "production",
  "version": "1.0.0"
}
```

### **2. API Test**
```bash
curl https://seu-projeto.vercel.app/api/test
```

**Resposta esperada:**
```json
{
  "message": "API está funcionando!"
}
```

### **3. Webhook (POST)**
```bash
curl -X POST https://seu-projeto.vercel.app/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{"event":"webhookReceived","text":"teste"}'
```

---

## 🔍 Se Ainda Der 404

### **1. Verificar Root Directory**

No Vercel Dashboard:
- **Settings > General > Root Directory**: `fibromialgia-assistant/backend`

### **2. Verificar vercel.json**

O `vercel.json` deve estar em `fibromialgia-assistant/backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### **3. Verificar Logs do Vercel**

No dashboard do Vercel:
1. Vá em **Deployments**
2. Clique no deployment
3. Veja os **Function Logs**
4. Procure por erros de importação ou inicialização

### **4. Verificar Variáveis de Ambiente**

Certifique-se de que todas as variáveis estão configuradas:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GOOGLE_AI_API_KEY`
- `W_API_URL`
- `W_API_TOKEN`
- `JWT_SECRET`
- etc.

---

## 📋 Rotas Disponíveis

Após o deploy correto, estas rotas devem funcionar:

### **Públicas:**
- `GET /health` - Health check
- `GET /api/test` - Teste da API
- `POST /webhook/w-api` - Webhook W-API

### **Protegidas (requerem JWT):**
- `GET /api/dashboard` - Dashboard
- `GET /api/users` - Usuários
- `GET /api/webhook/status` - Status WhatsApp
- etc.

---

## 🚀 Próximos Passos

1. **Aguardar novo deploy** (automático após push)
2. **Testar `/health`** no navegador
3. **Configurar variáveis de ambiente** no Vercel
4. **Atualizar webhook W-API** com a nova URL do Vercel

---

**Correção aplicada e commitada!** 🎉

O Vercel deve fazer deploy novamente automaticamente.
