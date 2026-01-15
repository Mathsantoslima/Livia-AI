# 📱 Como Conectar o WhatsApp (W-API)

## 🔍 Status Atual

A instância W-API está **desconectada**. Você precisa escanear o QR Code para conectar.

---

## ✅ Passo a Passo para Conectar

### 1. Obter QR Code

Execute no terminal:

```bash
curl http://localhost:3000/api/webhook/qrcode
```

Ou acesse no navegador:

```
http://localhost:3000/api/webhook/qrcode
```

### 2. Escanear QR Code

1. Abra o WhatsApp no seu celular
2. Vá em **Configurações** > **Aparelhos conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR Code exibido

### 3. Verificar Conexão

Após escanear, verifique o status:

```bash
curl http://localhost:3000/api/webhook/status
```

**Resposta esperada (conectado):**

```json
{
  "status": "success",
  "data": {
    "connection": "connected",
    "phone": "5511936188540",
    "state": "open",
    "instanceId": "VH1570-AP32GM-N91RKI"
  }
}
```

---

## 🔄 Alternativa: Via Painel W-API

Você também pode conectar diretamente pelo painel da W-API:

1. Acesse: https://painel.w-api.app
2. Faça login
3. Vá em **Instâncias**
4. Encontre a instância `VH1570-AP32GM-N91RKI`
5. Clique em **Conectar** ou **QR Code**
6. Escaneie o QR Code com seu WhatsApp

---

## 🧪 Testar Envio de Mensagem

Após conectar, teste enviando uma mensagem:

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "phone": "5511999999999",
    "message": "Teste de mensagem"
  }'
```

**Nota:** Você precisa estar autenticado (token JWT) para usar esta rota.

---

## 📊 Verificar Status Atual

```bash
# Status da conexão
curl http://localhost:3000/api/webhook/status

# Health check
curl http://localhost:3000/health

# Health check do webhook
curl http://localhost:3000/webhook/health
```

---

## ⚠️ Problemas Comuns

### QR Code não aparece

- Verifique se o backend está rodando
- Verifique se a instância existe na W-API
- Verifique se o token está correto no `.env`

### Conexão cai frequentemente

- Verifique sua conexão com a internet
- Verifique se o webhook está configurado corretamente
- Verifique os logs do backend

### Mensagens não chegam

- Verifique se o webhook está configurado na W-API
- Verifique se o ngrok está rodando (se estiver usando)
- Verifique os logs do backend para erros

---

## 🔗 Links Úteis

- **Painel W-API**: https://painel.w-api.app
- **Documentação W-API**: https://www.postman.com/w-api/w-api-api-do-whatsapp
- **Backend Health**: http://localhost:3000/health
