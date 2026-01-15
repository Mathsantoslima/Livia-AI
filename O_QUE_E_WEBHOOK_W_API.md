# 📱 O Que É o Webhook W-API?

## 🔍 Conceito Básico

### **O que é um Webhook?**
Um **webhook** é uma URL que recebe notificações automáticas quando algo acontece. É como um "botão de notificação" que outra aplicação chama quando precisa te avisar de algo.

### **O que é W-API?**
**W-API** é um serviço que conecta seu sistema ao WhatsApp. Ele gerencia a conexão com o WhatsApp e envia notificações para seu backend quando:
- 📩 Alguém envia uma mensagem para seu número
- ✅ A conexão muda de status
- 🔄 O QR Code é gerado
- etc.

---

## 🔄 Como Funciona o Webhook W-API?

### **Fluxo de uma Mensagem:**

```
1. Usuário envia mensagem → WhatsApp
2. WhatsApp → W-API (serviço externo)
3. W-API → Seu Backend (via webhook)
   POST https://livia-ai.vercel.app/webhook/w-api
4. Backend processa mensagem com IA
5. Backend envia resposta → W-API
6. W-API → WhatsApp → Usuário
```

### **Exemplo Prático:**

1. **Você envia:** "Oi, estou com dor"
2. **W-API recebe** a mensagem do WhatsApp
3. **W-API chama** seu webhook: `POST /webhook/w-api` com os dados da mensagem
4. **Seu backend** processa com a Livia (IA)
5. **Livia responde:** "Olá! Entendo que você está com dor..."
6. **Resposta é enviada** de volta via W-API para o WhatsApp

---

## 🔗 URL do Webhook

### **Para Produção (Vercel):**
```
https://livia-ai.vercel.app/webhook/w-api
```

### **Para Desenvolvimento Local (com ngrok):**
```
https://xxxxx.ngrok-free.app/webhook/w-api
```

---

## ⚙️ Como Configurar o Webhook W-API

### **Passo 1: Acessar o Painel W-API**

1. Acesse: https://painel.w-api.app
2. Faça login
3. Vá em **Instâncias**
4. Selecione sua instância (ex: `VH1570-AP32GM-N91RKI`)

### **Passo 2: Configurar o Webhook**

1. Vá em **Configurações** ou **Webhook**
2. Preencha:
   - **URL:** `https://livia-ai.vercel.app/webhook/w-api`
   - **Método:** `POST`
   - **Eventos:** Marque ✅ "Mensagens recebidas" ou "webhookReceived"
3. **Salve** as configurações

---

## 📋 O Que o Webhook Recebe?

Quando alguém envia uma mensagem, o W-API envia um POST para seu webhook com:

```json
{
  "event": "webhookReceived",
  "instanceId": "fibromialgia",
  "sender": {
    "id": "5511999999999"
  },
  "text": "Oi, estou com dor",
  "msgContent": {
    "conversation": "Oi, estou com dor"
  },
  "chat": {
    "id": "5511999999999@c.us"
  },
  "timestamp": 1234567890,
  "messageId": "msg_123"
}
```

---

## 🎯 Endpoint no Seu Backend

O endpoint que recebe o webhook está em:

**Arquivo:** `backend/src/routes/webhookRoutes.js`

**Rota:** `POST /webhook/w-api`

**O que faz:**
1. Recebe os dados da mensagem
2. Extrai o número do remetente e o texto
3. Processa com a Livia (IA)
4. Envia resposta de volta via W-API

---

## ✅ Verificar se Está Funcionando

### **1. Testar o Endpoint Diretamente:**

```bash
curl -X POST https://livia-ai.vercel.app/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhookReceived",
    "sender": {"id": "5511999999999"},
    "text": "teste"
  }'
```

### **2. Verificar Logs no Vercel:**

1. Vá em **Deployments**
2. Clique no deployment
3. Vá em **Function Logs**
4. Procure por: `[W-API Webhook] Evento recebido`

### **3. Enviar Mensagem Real:**

1. Envie uma mensagem para `(11) 93618-8540`
2. Verifique os logs do Vercel
3. Aguarde a resposta da Livia

---

## 🔧 Variáveis de Ambiente Necessárias

Para o webhook funcionar, você precisa configurar no Vercel:

```
W_API_URL=https://api.w-api.app/v1
W_API_TOKEN=seu_token_w_api
W_API_INSTANCE_ID=fibromialgia
```

---

## 📝 Resumo

**Webhook W-API é:**
- ✅ Uma URL que recebe notificações do W-API
- ✅ Endpoint: `POST /webhook/w-api`
- ✅ Recebe mensagens do WhatsApp
- ✅ Processa com IA e envia resposta

**URL para configurar no painel W-API:**
```
https://livia-ai.vercel.app/webhook/w-api
```

---

## 🆘 Problemas Comuns

### **"Webhook não está recebendo mensagens"**
- ✅ Verifique se a URL está correta no painel W-API
- ✅ Verifique se o método é `POST`
- ✅ Verifique os logs do Vercel

### **"Mensagens chegam mas não são processadas"**
- ✅ Verifique as variáveis de ambiente (W_API_TOKEN, etc.)
- ✅ Verifique os logs do Vercel para erros
- ✅ Teste o endpoint diretamente com `curl`

---

**Agora você sabe o que é o webhook W-API!** 🎉
