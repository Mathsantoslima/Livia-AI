# ✅ W-API Configurada e Pronta para Uso!

## 🎉 Credenciais Configuradas

✅ **Instance ID**: `VH1570-AP32GM-N91RKI`  
✅ **Token**: Configurado no `.env`  
✅ **URL Base**: `https://api.w-api.app/v1`  
✅ **Variáveis adicionadas ao `.env`**

## 🚀 Próximos Passos

### 1. Configurar Webhook no Painel W-API

**IMPORTANTE**: Você precisa configurar o webhook no painel da W-API para receber mensagens.

1. Acesse: https://w-api.app
2. Faça login
3. Vá para a instância `VH1570-AP32GM-N91RKI`
4. Configure o webhook:

   **Para desenvolvimento local (usando ngrok):**
   ```bash
   # 1. Instalar ngrok (se não tiver)
   brew install ngrok
   
   # 2. Iniciar ngrok
   ngrok http 3000
   
   # 3. Copiar a URL HTTPS gerada (ex: https://abc123.ngrok.io)
   # 4. Configurar no painel W-API:
   https://abc123.ngrok.io/api/webhook/w-api
   ```

   **Para produção (quando tiver domínio):**
   ```
   https://seu-dominio.com/api/webhook/w-api
   ```

### 2. Reiniciar o Backend

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
npm start
```

### 3. Obter QR Code e Conectar

**Opção A: Via API (requer autenticação)**
```bash
# Primeiro, faça login para obter o token JWT
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fibroia.com", "password": "123456"}'

# Use o token retornado para obter o QR Code
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/qrcode
```

**Opção B: Via Painel W-API**
- Acesse o painel W-API
- Vá para a instância `VH1570-AP32GM-N91RKI`
- Clique em "Conectar" ou "QR Code"
- Escaneie com seu WhatsApp

### 4. Verificar Status

```bash
curl -H "Authorization: Bearer SEU_TOKEN_JWT" \
  http://localhost:3000/api/whatsapp/status
```

### 5. Testar Envio de Mensagem

```bash
curl -X POST \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"to": "559199999999", "message": "Olá! Teste da integração W-API"}' \
  http://localhost:3000/api/whatsapp/send
```

## 📡 Como Funciona

1. **Mensagem Recebida**:
   - Usuário envia mensagem → W-API recebe → Envia webhook para `/api/webhook/w-api` → Processa com IA Livia → Responde via W-API

2. **Mensagem Enviada**:
   - Sistema chama `wApiService.sendTextMessage()` → W-API → WhatsApp

## 🔍 Verificar se Está Funcionando

### Teste Rápido

1. **Backend rodando?**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **W-API configurada?**
   ```bash
   # Verificar variáveis no .env
   grep W_API /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend/.env
   ```

3. **Webhook configurado?**
   - Verifique no painel W-API se o webhook está apontando para sua URL

4. **Instância conectada?**
   - Verifique no painel W-API ou via endpoint `/api/whatsapp/status`

## 📝 Checklist Final

- [x] Credenciais configuradas no `.env`
- [ ] Webhook configurado no painel W-API
- [ ] Backend reiniciado
- [ ] QR Code obtido e escaneado
- [ ] Instância conectada (status: "connected")
- [ ] Teste de envio realizado
- [ ] Teste de recebimento realizado

## 🆘 Problemas Comuns

### "W_API_TOKEN não configurado"
- ✅ **Resolvido**: Credenciais já estão no `.env`
- Reinicie o backend após adicionar as variáveis

### Webhook não recebe mensagens
- Verifique se o ngrok está rodando (desenvolvimento)
- Verifique se o backend está na porta 3000
- Teste o webhook manualmente (veja `CONFIGURAR_WEBHOOK_W_API.md`)

### Instância não conecta
- Obtenha novo QR Code
- Verifique se escaneou corretamente
- Tente reiniciar a instância no painel W-API

## 📚 Documentação

- **Migração completa**: `MIGRACAO_W_API.md`
- **Configurar webhook**: `CONFIGURAR_WEBHOOK_W_API.md`
- **Resumo integração**: `RESUMO_INTEGRACAO_W_API.md`

## 🎯 Pronto para Usar!

Agora é só:
1. Configurar o webhook no painel W-API
2. Reiniciar o backend
3. Obter QR Code e conectar
4. Começar a usar! 🚀
