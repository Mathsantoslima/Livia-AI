# ✅ Rotas Corretas do Backend

## 🔍 Health Check

### ✅ Rota Correta:

```bash
curl http://localhost:3000/health
```

**Resposta esperada:**

```json
{
  "status": "online",
  "timestamp": "2026-01-14T13:56:45.110Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### ❌ Rota Incorreta (não existe):

```bash
curl http://localhost:3000/api/health
# Retorna: 404 - "Recurso não encontrado"
```

---

## 📱 Status WhatsApp

### ✅ Rota Correta:

```bash
curl http://localhost:3000/api/webhook/status
```

**Resposta esperada:**

```json
{
  "status": "success",
  "data": {
    "connection": "disconnected",
    "phone": null,
    "state": "unknown",
    "instanceId": "VH1570-AP32GM-N91RKI"
  },
  "timestamp": "2026-01-14T13:56:45.110Z"
}
```

---

## 🔗 Outras Rotas Úteis

### Health Check do Webhook:

```bash
curl http://localhost:3000/webhook/health
```

### Teste da API:

```bash
curl http://localhost:3000/api/test
```

---

## 📋 Resumo das Rotas

| Rota                  | Método | Descrição               | Status      |
| --------------------- | ------ | ----------------------- | ----------- |
| `/health`             | GET    | Health check geral      | ✅ Funciona |
| `/webhook/health`     | GET    | Health check do webhook | ✅ Funciona |
| `/api/webhook/status` | GET    | Status do WhatsApp      | ✅ Funciona |
| `/api/test`           | GET    | Teste da API            | ✅ Funciona |
| `/api/health`         | GET    | ❌ Não existe           | ❌ 404      |

---

## 💡 Dica

Sempre use `/health` (sem `/api`) para verificar se o backend está online!
