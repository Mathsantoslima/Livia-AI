# 🔗 Configurar Webhook W-API

## 📋 Credenciais Configuradas

✅ **Instance ID**: `VH1570-AP32GM-N91RKI`  
✅ **Token**: `R5gp06ocLyyRdFmrATleFzQEUFhwIgzO3`  
✅ **URL Base**: `https://api.w-api.app/v1`

## 🔧 Configurar Webhook no Painel W-API

### Passo 1: Acessar Painel W-API

1. Acesse: https://w-api.app
2. Faça login com sua conta
3. Vá para a seção de **Instâncias** ou **Webhooks**

### Passo 2: Configurar Webhook

Para **produção** (quando tiver domínio):
```
https://seu-dominio.com/api/webhook/w-api
```

Para **desenvolvimento local** (usando ngrok):

1. **Instalar ngrok** (se ainda não tiver):
   ```bash
   # macOS
   brew install ngrok
   
   # Ou baixar de: https://ngrok.com/download
   ```

2. **Iniciar ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Copiar a URL HTTPS** que o ngrok gerar (ex: `https://abc123.ngrok.io`)

4. **Configurar webhook no painel W-API**:
   ```
   https://abc123.ngrok.io/api/webhook/w-api
   ```

### Passo 3: Verificar Configuração

Após configurar o webhook, teste enviando uma mensagem para o número conectado na instância.

## 🧪 Testar Integração

### 1. Verificar Status da Instância

```bash
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/status
```

### 2. Obter QR Code

```bash
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/qrcode
```

### 3. Enviar Mensagem de Teste

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"to": "559199999999", "message": "Teste da integração W-API"}' \
  http://localhost:3000/api/whatsapp/send
```

## 📝 Formato do Webhook

O webhook da W-API enviará mensagens no seguinte formato:

```json
{
  "event": "message",
  "data": {
    "from": "559199999999",
    "body": "Texto da mensagem",
    "messageId": "ID_DA_MENSAGEM",
    "timestamp": 1234567890
  },
  "instanceId": "VH1570-AP32GM-N91RKI"
}
```

A rota `/api/webhook/w-api` processará automaticamente essas mensagens e enviará para a IA.

## ✅ Checklist

- [x] Credenciais configuradas no `.env`
- [ ] Webhook configurado no painel W-API
- [ ] Backend reiniciado
- [ ] QR Code obtido e escaneado
- [ ] Instância conectada
- [ ] Teste de envio/recebimento realizado

## 🆘 Troubleshooting

### Webhook não recebe mensagens

1. Verifique se o ngrok está rodando (para desenvolvimento)
2. Verifique se o backend está rodando na porta 3000
3. Teste o webhook manualmente:
   ```bash
   curl -X POST http://localhost:3000/api/webhook/w-api \
     -H "Content-Type: application/json" \
     -d '{"event":"message","data":{"from":"559199999999","body":"teste"}}'
   ```

### Erro 401 no webhook

- Verifique se o token está correto no painel W-API
- Verifique se o webhook está configurado corretamente

### Instância não conecta

- Verifique se o QR Code foi escaneado
- Tente reiniciar a instância no painel W-API
- Verifique os logs do backend para erros
