# Migração para W-API

Este documento descreve como migrar do Baileys para a W-API (https://api.w-api.app).

## 📋 O que é W-API?

A W-API é uma API RESTful para WhatsApp que oferece:

- ✅ Conexão estável e confiável
- ✅ Sem necessidade de gerenciar sessões localmente
- ✅ Webhooks para receber mensagens
- ✅ API simples e intuitiva
- ✅ Suporte a múltiplas instâncias

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao arquivo `backend/.env`:

```bash
# W-API Configuration
W_API_URL=https://api.w-api.app/v1
W_API_TOKEN=seu_token_aqui
W_API_INSTANCE_ID=fibromialgia

# Opcional: desabilitar Baileys
USE_BAILEYS=false
USE_W_API=true
```

### 2. Obter Token e Instance ID

1. **Token**: Obtenha no painel da W-API (https://w-api.app)
2. **Instance ID**: Crie uma instância no painel ou use uma existente

### 3. Configurar Webhook

No painel da W-API, configure o webhook para:

```
https://seu-dominio.com/api/webhook/w-api
```

Ou para desenvolvimento local (usando ngrok ou similar):

```
https://seu-ngrok-url.ngrok.io/api/webhook/w-api
```

## 📡 Endpoints Disponíveis

### Obter QR Code

```bash
GET /api/whatsapp/qrcode
```

### Verificar Status

```bash
GET /api/whatsapp/status
```

### Enviar Mensagem

```bash
POST /api/whatsapp/send
{
  "to": "559199999999",
  "message": "Olá!"
}
```

## 🔄 Fluxo de Funcionamento

1. **Conexão**: A W-API gerencia a conexão automaticamente
2. **QR Code**: Obtenha via endpoint `/instance/qr-code`
3. **Mensagens Recebidas**: Chegam via webhook em `/api/webhook/w-api`
4. **Mensagens Enviadas**: Use o serviço `wApiService.sendTextMessage()`

## 📝 Estrutura de Arquivos

- `backend/src/services/wApiService.js` - Serviço principal da W-API
- `backend/src/channels/WhatsAppChannel.js` - Atualizado para suportar W-API
- `backend/src/routes/webhookRoutes.js` - Rota de webhook `/w-api`

## 🚀 Como Usar

### Enviar Mensagem

```javascript
const wApiService = require("./services/wApiService");

await wApiService.sendTextMessage(
  "fibromialgia", // instanceId
  "559199999999", // phone
  "Olá! Como posso ajudar?" // message
);
```

### Obter QR Code

```javascript
const qrCode = await wApiService.getQrCode("fibromialgia", {
  image: "enable", // 'enable' para PNG, 'disable' para base64
  syncContacts: "disable",
});
```

### Verificar Status

```javascript
const status = await wApiService.checkInstanceStatus("fibromialgia");
console.log(status); // { status: "connected", connectedPhone: "559199999999", ... }
```

## 🔍 Troubleshooting

### Erro: "W_API_TOKEN não configurado"

- Verifique se `W_API_TOKEN` está no `.env`
- Reinicie o servidor após adicionar a variável

### Erro: "Instance not found"

- Verifique se `W_API_INSTANCE_ID` está correto
- Crie a instância no painel da W-API se necessário

### Webhook não recebe mensagens

- Verifique se o webhook está configurado no painel da W-API
- Teste o webhook manualmente com um serviço como webhook.site
- Verifique os logs do servidor para erros

### QR Code não aparece

- Verifique se a instância existe
- Tente reiniciar a instância: `wApiService.restartInstance()`

## 📚 Documentação Adicional

- [W-API Postman Collection](https://www.postman.com/w-api/w-api-api-do-whatsapp)
- [W-API Dashboard](https://w-api.app)

## ⚠️ Notas Importantes

1. **Custos**: A W-API é um serviço pago. Verifique os planos disponíveis.
2. **Limites**: Cada plano tem limites de mensagens. Monitore o uso.
3. **Backup**: Mantenha o Baileys como fallback se necessário.
4. **Testes**: Teste em ambiente de desenvolvimento antes de produção.

## 🔄 Migração do Baileys

Se você estava usando Baileys:

1. **Pare o servidor Baileys**: `whatsapp-baileys-api/server.js`
2. **Configure as variáveis W-API** no `.env`
3. **Configure o webhook** no painel W-API
4. **Reinicie o backend**: `npm start`
5. **Obtenha o QR Code** via endpoint ou painel W-API
6. **Teste enviando uma mensagem**

O sistema automaticamente usará W-API se `W_API_TOKEN` estiver configurado.
