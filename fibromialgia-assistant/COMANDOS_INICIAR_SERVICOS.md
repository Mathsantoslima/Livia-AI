# 🚀 Comandos para Iniciar Serviços Manualmente

## 📋 Abra 3 terminais separados e execute cada comando em um deles

---

## 🖥️ TERMINAL 1: Backend

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
npm start
```

**O que você deve ver:**
```
Servidor iniciado em http://localhost:3000
Ambiente: development
Conexão com Supabase estabelecida com sucesso
```

**Para verificar se está funcionando:**
Abra outro terminal e execute:
```bash
curl http://localhost:3000/api/health
```

---

## 🎨 TERMINAL 2: Frontend (Admin Panel)

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/admin-panel
npm start
```

**O que você deve ver:**
```
Compiled successfully!
You can now view admin-panel in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

**Nota:** O frontend pode usar a porta 3000 ou 3001, dependendo da configuração. Se der conflito, o React perguntará se quer usar outra porta.

---

## 📱 TERMINAL 3: WhatsApp (Opcional - apenas se usar Baileys)

**Se estiver usando W-API (recomendado):**
Não precisa de terminal separado! A W-API é um serviço externo.

**Se quiser usar Baileys (alternativa):**
```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api
node server.js
```

---

## ✅ Verificação Rápida

### 1. Verificar Backend
```bash
curl http://localhost:3000/api/health
```

### 2. Verificar Status WhatsApp
```bash
curl http://localhost:3000/api/webhook/status
```

### 3. Acessar Frontend
Abra no navegador: http://localhost:3000

---

## 🛑 Para Parar os Serviços

### Parar Backend
No terminal do backend, pressione: `Ctrl + C`

### Parar Frontend
No terminal do frontend, pressione: `Ctrl + C`

### Parar Todos de Uma Vez
```bash
pkill -f "node.*server.js"
pkill -f "react-scripts"
```

---

## 📝 Ordem Recomendada de Inicialização

1. **Primeiro**: Backend (Terminal 1)
2. **Segundo**: Frontend (Terminal 2)
3. **Terceiro**: WhatsApp Baileys (Terminal 3 - apenas se necessário)

---

## 🔍 Troubleshooting

### Porta 3000 já em uso
```bash
# Ver qual processo está usando
lsof -ti:3000

# Matar o processo
kill -9 $(lsof -ti:3000)
```

### Erro "Cannot find module"
```bash
# No diretório do serviço
npm install
```

### Frontend não abre
Verifique se o backend está rodando primeiro. O frontend pode depender do backend.

---

## 📊 Status dos Serviços

Após iniciar, você pode verificar:

```bash
# Ver processos Node rodando
ps aux | grep node

# Ver portas em uso
lsof -i :3000
lsof -i :3001
```
