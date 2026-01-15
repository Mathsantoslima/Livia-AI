# 🚀 Comandos Rápidos - Referência

## 📋 Verificação de Status

### Backend

```bash
# Health check
curl http://localhost:3000/health

# Status WhatsApp
curl http://localhost:3000/api/webhook/status

# Login (obter token)
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fibroia.com","password":"123456"}'
```

### Frontend

```bash
# Abrir no navegador
open http://localhost:3001
# ou
open http://localhost:3001/login
```

---

## 🔄 Reiniciar Serviços

### Parar todos os serviços

```bash
pkill -f "node.*server.js"
pkill -f "react-scripts"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
```

### Iniciar Backend

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
npm start
```

### Iniciar Frontend

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/admin-panel
npm start
```

---

## 📱 WhatsApp

### Obter QR Code

```bash
curl http://localhost:3000/api/webhook/qrcode
```

### Verificar Status

```bash
curl http://localhost:3000/api/webhook/status
```

---

## 🗄️ Supabase

### Verificar Tabelas (via SQL Editor no Supabase)

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users_livia', 'conversations_livia');
```

---

## 🧪 Testes

### Testar Autenticação

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fibroia.com","password":"123456"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. Usar token para acessar dashboard
curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Portas

| Serviço          | Porta | URL                   |
| ---------------- | ----- | --------------------- |
| Backend          | 3000  | http://localhost:3000 |
| Frontend         | 3001  | http://localhost:3001 |
| WhatsApp Baileys | 8080  | http://localhost:8080 |

---

## 🔑 Credenciais

- **Email admin:** `admin@fibroia.com`
- **Senha admin:** `123456`
- **Instância W-API:** `VH1570-AP32GM-N91RKI`

---

## 📚 Documentação

- `RESUMO_STATUS_FINAL.md` - Status completo do sistema
- `CRIAR_TABELAS_SUPABASE.md` - Criar tabelas
- `CONECTAR_WHATSAPP.md` - Conectar WhatsApp
- `ROTAS_CORRETAS.md` - Rotas da API
- `INICIAR_SERVICOS_PASSO_A_PASSO.md` - Como iniciar serviços
