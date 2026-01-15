# 🔧 Solução: Mensagens Não Chegam/Resposta

## ⚠️ Problema

Você enviou uma mensagem para `(11) 93618-8540`, mas a Livia não respondeu.

## 🔍 Diagnóstico

### Possíveis Causas

1. **Webhook não configurado ou inacessível**

   - O backend precisa estar acessível pela internet (ngrok ou similar)
   - A W-API precisa ter o webhook configurado corretamente

2. **Formato do payload diferente**

   - A W-API pode estar enviando mensagens em formato diferente
   - Os logs mostram eventos chegando, mas não sendo reconhecidos como mensagens

3. **Webhook não está apontando para a rota correta**
   - Deve apontar para: `https://seu-ngrok.ngrok-free.app/api/webhook/w-api`

---

## ✅ Solução Passo a Passo

### 1. Verificar Webhook na W-API

1. **Acesse:** https://painel.w-api.app
2. **Vá em:** Instâncias → `VH1570-AP32GM-N91RKI`
3. **Clique em:** Configurações ou Webhook
4. **Verifique se o webhook está configurado:**
   - URL: `https://seu-ngrok.ngrok-free.app/api/webhook/w-api`
   - Eventos: Marque "Mensagens recebidas" / "webhookReceived"

### 2. Configurar ngrok (Se necessário)

Se você está rodando localmente, precisa de um túnel:

```bash
# Instalar ngrok (se não tiver)
# brew install ngrok (macOS)

# Criar túnel para a porta 3000
ngrok http 3000
```

**Copie a URL HTTPS** que aparece (ex: `https://xxxxx.ngrok-free.app`)

### 3. Atualizar Webhook na W-API

1. **No painel W-API**, configure o webhook:

   - URL: `https://xxxxx.ngrok-free.app/api/webhook/w-api`
   - Método: POST
   - Eventos: Selecione todos ou pelo menos "Mensagens recebidas"

2. **Ou via API:**
   ```bash
   curl -X POST "https://api.w-api.app/v1/webhook/set-webhook" \
     -H "Authorization: Bearer R5gp06ocLyyRdFmrATleFzQEUFhwIgzO3" \
     -H "Content-Type: application/json" \
     -d '{
       "instanceId": "VH1570-AP32GM-N91RKI",
       "webhook": {
         "url": "https://xxxxx.ngrok-free.app/api/webhook/w-api",
         "events": ["webhookReceived", "message"]
       }
     }'
   ```

### 4. Verificar Logs do Backend

**Mantenha o terminal do backend aberto** e verifique quando enviar uma mensagem:

- ✅ Deve aparecer: `[W-API Webhook] Evento recebido:`
- ✅ Deve aparecer: `[W-API Webhook] Mensagem recebida de...`
- ⚠️ Se aparecer: `Evento não processado` → O formato está diferente

### 5. Testar Manualmente

```bash
# Testar webhook localmente
curl -X POST http://localhost:3000/api/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhookReceived",
    "instanceId": "VH1570-AP32GM-N91RKI",
    "sender": {
      "id": "5511999999999"
    },
    "text": "Teste de mensagem",
    "msgContent": {
      "conversation": "Teste de mensagem"
    }
  }'
```

---

## 🔍 Verificações Adicionais

### Verificar se o Backend Está Acessível

```bash
# Localmente
curl http://localhost:3000/health

# Via ngrok (se configurado)
curl https://seu-ngrok.ngrok-free.app/health
```

### Verificar Formato dos Eventos

**Os logs mostram que eventos estão chegando, mas muitos não têm dados de mensagem.**

A W-API pode estar enviando mensagens em um formato diferente. Verifique nos logs do backend o formato exato do payload quando uma mensagem chega.

---

## 📋 Checklist de Resolução

- [ ] **Backend rodando** (`curl http://localhost:3000/health`)
- [ ] **ngrok configurado** (se local)
- [ ] **Webhook configurado na W-API** com URL correta
- [ ] **Webhook aponta para** `/api/webhook/w-api`
- [ ] **Eventos marcados** na configuração do webhook
- [ ] **Testar envio de mensagem** novamente
- [ ] **Verificar logs** do backend quando enviar

---

## 🧪 Teste Completo

1. **Inicie ngrok** (se necessário):

   ```bash
   ngrok http 3000
   ```

2. **Configure webhook na W-API** com a URL do ngrok

3. **Envie uma mensagem** para `(11) 93618-8540`

4. **Verifique logs** do backend:

   - Deve aparecer evento recebido
   - Deve processar mensagem
   - Deve enviar resposta

5. **Verifique resposta** no WhatsApp

---

## ⚠️ Problema Comum: Webhook Inacessível

Se o webhook está configurado como `http://localhost:3000`, a W-API **não consegue acessar** porque `localhost` é apenas na sua máquina.

**Solução:** Use ngrok ou um serviço similar para expor o backend na internet.

---

## 📚 Próximos Passos

Após configurar o webhook corretamente:

1. ✅ Mensagens serão recebidas
2. ✅ Livia processará com IA
3. ✅ Respostas serão enviadas automaticamente
4. ✅ Dados serão salvos no Supabase

---

## 🔗 Links Úteis

- **Painel W-API:** https://painel.w-api.app
- **Documentação W-API:** https://www.postman.com/w-api/w-api-api-do-whatsapp
- **ngrok:** https://ngrok.com/download
