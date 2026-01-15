# ✅ Integração W-API - Resumo

## 📦 Arquivos Criados/Atualizados

### ✅ Criados
1. **`src/services/wApiService.js`** - Serviço completo para W-API
   - `getQrCode()` - Obter QR Code
   - `checkInstanceStatus()` - Verificar status
   - `sendTextMessage()` - Enviar mensagens
   - `restartInstance()` - Reiniciar instância
   - `disconnectInstance()` - Desconectar
   - `getInstanceInfo()` - Informações da instância

2. **`MIGRACAO_W_API.md`** - Documentação completa de migração

3. **`.env.example.w-api`** - Exemplo de configuração

### ✅ Atualizados
1. **`src/channels/WhatsAppChannel.js`**
   - Suporte automático para W-API
   - Fallback para Baileys se W-API não estiver configurado
   - Método `isConnected()` agora verifica W-API

2. **`src/routes/webhookRoutes.js`**
   - Nova rota `/webhook/w-api` para receber webhooks
   - Rotas `/qrcode` e `/status` atualizadas para usar W-API

3. **`src/controllers/whatsappController.js`**
   - Todos os métodos atualizados para usar W-API quando disponível
   - Fallback automático para métodos antigos

4. **`src/config/index.js`**
   - Nova seção `wApi` com todas as configurações

## 🚀 Como Usar

### 1. Configurar Variáveis de Ambiente

Adicione ao `backend/.env`:

```bash
W_API_URL=https://api.w-api.app/v1
W_API_TOKEN=seu_token_aqui
W_API_INSTANCE_ID=fibromialgia
USE_W_API=true
```

### 2. Obter Token e Instance ID

1. Acesse https://w-api.app
2. Crie uma conta ou faça login
3. Obtenha seu **TOKEN** no painel
4. Crie uma **instância** ou use uma existente
5. Copie o **INSTANCE_ID**

### 3. Configurar Webhook

No painel da W-API, configure o webhook:
```
https://seu-dominio.com/api/webhook/w-api
```

Para desenvolvimento local, use ngrok:
```bash
ngrok http 3000
# Use a URL do ngrok no webhook
```

### 4. Reiniciar Backend

```bash
cd backend
npm start
```

### 5. Obter QR Code

```bash
# Via API
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/qrcode

# Ou via painel admin
http://localhost:3000/api/webhook/qrcode
```

## 🔄 Fluxo de Funcionamento

1. **Mensagem Recebida** → W-API envia webhook → `/api/webhook/w-api` → Processa com IA → Responde via W-API
2. **Mensagem Enviada** → `wApiService.sendTextMessage()` → W-API → WhatsApp

## 📊 Endpoints Disponíveis

### QR Code
```
GET /api/whatsapp/qrcode
GET /api/webhook/qrcode
```

### Status
```
GET /api/whatsapp/status
GET /api/webhook/status
```

### Enviar Mensagem
```
POST /api/whatsapp/send
{
  "to": "559199999999",
  "message": "Olá!"
}
```

### Webhook (W-API)
```
POST /api/webhook/w-api
```

## ⚙️ Configuração Automática

O sistema detecta automaticamente se W-API está configurado:

- ✅ Se `W_API_TOKEN` estiver definido → Usa W-API
- ❌ Se não estiver → Usa Baileys/Evolution (método antigo)

## 🔍 Verificação

Para verificar se está funcionando:

```bash
# 1. Testar conexão
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/status

# 2. Obter QR Code
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/qrcode

# 3. Enviar mensagem de teste
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"to": "559199999999", "message": "Teste"}' \
  http://localhost:3000/api/whatsapp/send
```

## 📝 Próximos Passos

1. ✅ Obter TOKEN da W-API
2. ✅ Configurar INSTANCE_ID
3. ✅ Configurar webhook no painel W-API
4. ✅ Adicionar variáveis ao `.env`
5. ✅ Reiniciar backend
6. ✅ Obter QR Code e conectar
7. ✅ Testar envio/recebimento de mensagens

## ⚠️ Importante

- A W-API é um serviço pago (verifique planos)
- Mantenha o Baileys como fallback se necessário
- Teste em desenvolvimento antes de produção
- Monitore os logs para erros

## 🆘 Suporte

- Documentação: `MIGRACAO_W_API.md`
- W-API Dashboard: https://w-api.app
- Postman Collection: Incluída no projeto
