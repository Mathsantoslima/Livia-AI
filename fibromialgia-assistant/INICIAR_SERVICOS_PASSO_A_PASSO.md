# 🚀 Passo a Passo para Iniciar os Serviços

## ⚠️ PROBLEMA IDENTIFICADO

O frontend (React) estava usando a porta 3000, impedindo o backend de iniciar.

## ✅ SOLUÇÃO: Execute na ordem abaixo

---

## 📋 PASSO 1: Limpar processos antigos

Execute este comando primeiro para garantir que não há processos rodando:

```bash
pkill -f "node.*server.js"; pkill -f "react-scripts"; lsof -ti:3000 | xargs kill -9 2>/dev/null; lsof -ti:3001 | xargs kill -9 2>/dev/null; sleep 2 && echo "✅ Limpeza concluída"
```

---

## 🖥️ PASSO 2: Iniciar Backend (TERMINAL 1)

**IMPORTANTE:** O backend DEVE iniciar primeiro na porta 3000.

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend && npm start
```

**Aguarde ver:**

```
Servidor iniciado em http://localhost:3000
Conexão com Supabase estabelecida com sucesso
```

**NÃO FECHE ESTE TERMINAL!**

---

## 🎨 PASSO 3: Iniciar Frontend (TERMINAL 2)

**IMPORTANTE:** O frontend vai usar a porta 3001 se 3000 estiver ocupada pelo backend.

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/admin-panel && npm start
```

**Aguarde ver:**

```
Compiled successfully!
You can now view admin-panel in the browser.
  Local:            http://localhost:3001
```

**NÃO FECHE ESTE TERMINAL!**

---

## 📱 PASSO 4: WhatsApp (OPCIONAL - apenas se NÃO usar W-API)

**Se você está usando W-API (recomendado):**
✅ **NÃO PRECISA DE TERMINAL 3!** A W-API é externa.

**Se quiser usar Baileys (alternativa):**

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api && node server.js
```

---

## ✅ VERIFICAÇÃO

### 1. Verificar Backend

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**

```json
{
  "status": "online",
  "timestamp": "...",
  "environment": "development",
  "version": "1.0.0"
}
```

**Nota:** A rota correta é `/health` (não `/api/health`)

### 2. Verificar Frontend

Abra no navegador:

- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:3001 (ou 3000 se configurado diferente)

### 3. Verificar Status WhatsApp

```bash
curl http://localhost:3000/api/webhook/status
```

---

## 🛑 Para Parar Tudo

```bash
pkill -f "node.*server.js"
pkill -f "react-scripts"
```

---

## 🔍 Troubleshooting

### Erro: "Porta 3000 em uso"

```bash
# Ver qual processo está usando
lsof -ti:3000

# Matar o processo
kill -9 $(lsof -ti:3000)
```

### Backend não inicia

1. Verifique se está no diretório correto: `backend/`
2. Verifique se tem `.env` configurado
3. Execute: `npm install` (se necessário)

### Frontend não abre

1. Verifique se o backend está rodando primeiro
2. O frontend pode estar em http://localhost:3001 se 3000 estiver ocupada

---

## 📊 Resumo dos Comandos

```bash
# Terminal 1 - Backend
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend && npm start

# Terminal 2 - Frontend
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/admin-panel && npm start

# Terminal 3 - WhatsApp Baileys (opcional)
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api && node server.js
```
