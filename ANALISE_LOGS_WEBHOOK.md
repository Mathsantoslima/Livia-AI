# 🔍 Análise dos Logs - Webhook Não Está Sendo Chamado

## 📊 Análise dos Logs do Vercel

### **O Que os Logs Mostram:**

✅ **Funcionando:**
- Requisições GET para `/` → 200 OK
- Requisições GET para `/webhook/w-api` → 200 OK
- Conexão com Supabase estabelecida
- Sistema inicializando corretamente

❌ **Problema Identificado:**
- **NENHUMA requisição POST para `/webhook/w-api`**
- Nenhum log `[W-API Webhook] Evento recebido`
- Nenhum log `[WhatsApp] Mensagem recebida`

---

## 🎯 Conclusão

**O W-API não está chamando o webhook quando recebe mensagens!**

Isso significa que:
1. ✅ O webhook está acessível (GET funciona)
2. ❌ O W-API não está configurado para chamar o webhook
3. ❌ Ou o webhook não está configurado corretamente no painel W-API

---

## ✅ Solução: Configurar Webhook no Painel W-API

### **Passo 1: Acessar Painel W-API**

1. Acesse: https://painel.w-api.app
2. Faça login
3. Vá em **Instâncias**
4. Selecione sua instância (ex: `VH1570-AP32GM-N91RKI` ou `fibromialgia`)

### **Passo 2: Configurar Webhook**

1. Vá em **Configurações** ou **Webhook**
2. Procure por **Webhook URL** ou **URL de Callback**
3. Configure:
   - **URL:** `https://livia-ai.vercel.app/webhook/w-api`
   - **Método:** `POST` (não GET!)
   - **Eventos:** Marque ✅
     - "Mensagens recebidas"
     - "webhookReceived"
     - "message"
4. **Salve** as configurações

### **Passo 3: Verificar Configuração**

Alguns painéis W-API têm seções diferentes:
- **Webhook Settings**
- **Callbacks**
- **Notifications**
- **Integrations**

Procure em todas essas seções!

---

## 🧪 Teste Após Configurar

### **1. Enviar Mensagem de Teste**

Envie uma mensagem para `(11) 93618-8540`

### **2. Verificar Logs do Vercel**

Após enviar, verifique os logs novamente. Você deve ver:

```
[W-API Webhook] Evento recebido: ...
[WhatsApp] Mensagem recebida de 5511...
[Livia] Processando mensagem...
[WhatsApp] Enviado para 5511...
```

### **3. Se Ainda Não Aparecer**

Verifique:
- ✅ URL está correta no painel W-API?
- ✅ Método é POST (não GET)?
- ✅ Eventos estão marcados?
- ✅ Instância está conectada?

---

## 🔍 Como Verificar se Webhook Está Configurado

### **Opção 1: No Painel W-API**

1. Vá em **Instâncias** → sua instância
2. Procure por **Webhook** ou **Callbacks**
3. Deve mostrar a URL configurada

### **Opção 2: Via API W-API**

```bash
curl -X GET "https://api.w-api.app/v1/instance/webhook?instanceId=fibromialgia" \
  -H "Authorization: Bearer SEU_TOKEN_W_API"
```

Isso deve retornar a configuração do webhook.

---

## 📋 Checklist de Verificação

- [ ] Webhook configurado no painel W-API
- [ ] URL: `https://livia-ai.vercel.app/webhook/w-api`
- [ ] Método: `POST` (não GET!)
- [ ] Eventos marcados: "Mensagens recebidas"
- [ ] Instância conectada no painel W-API
- [ ] Teste enviando mensagem
- [ ] Verificar logs do Vercel após enviar

---

## 🆘 Se Ainda Não Funcionar

### **1. Verificar Formato da URL**

Alguns painéis W-API podem precisar de formato diferente:
- `https://livia-ai.vercel.app/webhook/w-api`
- `https://livia-ai.vercel.app/api/webhook/w-api` (tente este também)

### **2. Verificar Autenticação**

Alguns webhooks precisam de token de autenticação. Verifique se o painel W-API tem essa opção.

### **3. Testar Webhook Manualmente**

```bash
curl -X POST https://livia-ai.vercel.app/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhookReceived",
    "instanceId": "fibromialgia",
    "sender": {"id": "5511999999999"},
    "text": "teste manual"
  }'
```

Se isso funcionar, o problema é que o W-API não está chamando o webhook.

---

## 🎯 Próximos Passos

1. **Configurar webhook no painel W-API** (mais importante!)
2. **Verificar se está salvo corretamente**
3. **Enviar mensagem de teste**
4. **Verificar logs do Vercel novamente**
5. **Deve aparecer `[W-API Webhook] Evento recebido`**

---

**O problema é que o webhook não está configurado no painel W-API!** 🔧

Configure o webhook e teste novamente.
