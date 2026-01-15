# 🔍 Agente Não Responde - Troubleshooting

## ❌ Problema

Você envia mensagem para o WhatsApp, mas a Livia não responde.

---

## ✅ Checklist de Verificação

### **1. Webhook Configurado no Painel W-API?**

1. Acesse: https://painel.w-api.app
2. Vá em **Instâncias** → sua instância
3. Vá em **Configurações** ou **Webhook**
4. Verifique se está configurado:
   - **URL:** `https://livia-ai.vercel.app/webhook/w-api`
   - **Método:** `POST`
   - **Eventos:** ✅ "Mensagens recebidas" ou "webhookReceived"
5. **Salve** se necessário

---

### **2. Variáveis de Ambiente Configuradas no Vercel?**

No Vercel Dashboard → Settings → Environment Variables:

**Obrigatórias:**
```
W_API_URL=https://api.w-api.app/v1
W_API_TOKEN=seu_token_w_api
W_API_INSTANCE_ID=fibromialgia
```

**Para IA funcionar:**
```
GOOGLE_AI_API_KEY=sua_chave_google_ai
# OU
OPENAI_API_KEY=sua_chave_openai
# OU
CLAUDE_API_KEY=sua_chave_claude
```

**Outras importantes:**
```
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
JWT_SECRET=seu_segredo_jwt
```

⚠️ **Após adicionar variáveis, faça um novo deploy!**

---

### **3. Verificar Logs do Vercel**

1. Vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Function Logs**
4. Procure por:
   - `[W-API Webhook] Evento recebido`
   - `[WhatsApp] Mensagem recebida`
   - `[Livia] Processando mensagem`
   - `[WhatsApp] Erro ao enviar`

**O que procurar:**
- ✅ Se aparecer `[W-API Webhook] Evento recebido` → Webhook está funcionando
- ❌ Se NÃO aparecer → Webhook não está configurado ou W-API não está chamando
- ✅ Se aparecer `[WhatsApp] Mensagem recebida` → Mensagem chegou
- ❌ Se aparecer `[WhatsApp] Erro ao enviar` → Problema ao enviar resposta

---

### **4. Testar Webhook Manualmente**

```bash
curl -X POST https://livia-ai.vercel.app/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhookReceived",
    "instanceId": "fibromialgia",
    "sender": {"id": "5511999999999"},
    "text": "teste",
    "msgContent": {"conversation": "teste"}
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Mensagem processada"
}
```

Se retornar erro, veja a mensagem de erro nos logs.

---

### **5. Verificar Status da Instância W-API**

```bash
curl https://livia-ai.vercel.app/api/webhook/status
```

**Resposta esperada:**
```json
{
  "status": "success",
  "data": {
    "connection": "connected",
    "phone": "5511936188540",
    "instanceId": "fibromialgia"
  }
}
```

Se retornar `"connection": "disconnected"`, a instância não está conectada.

---

## 🔧 Problemas Comuns e Soluções

### **Problema 1: Webhook não recebe mensagens**

**Sintomas:**
- Nenhum log `[W-API Webhook] Evento recebido` aparece
- Mensagem enviada mas nada acontece

**Soluções:**
1. ✅ Verificar URL do webhook no painel W-API
2. ✅ Verificar se o método é `POST`
3. ✅ Verificar se os eventos estão marcados
4. ✅ Testar URL manualmente com `curl`

---

### **Problema 2: Mensagem chega mas não é processada**

**Sintomas:**
- Log `[W-API Webhook] Evento recebido` aparece
- Mas não aparece `[WhatsApp] Mensagem recebida`

**Soluções:**
1. ✅ Verificar formato do payload no log
2. ✅ Verificar se `sender.id` e `text` estão presentes
3. ✅ Verificar se `fromMe === true` (mensagem enviada por nós)

---

### **Problema 3: Mensagem processada mas não envia resposta**

**Sintomas:**
- Log `[WhatsApp] Mensagem recebida` aparece
- Log `[Livia] Processando mensagem` aparece
- Mas não aparece `[WhatsApp] Enviado para`

**Soluções:**
1. ✅ Verificar variáveis `W_API_TOKEN` e `W_API_INSTANCE_ID`
2. ✅ Verificar se a instância W-API está conectada
3. ✅ Verificar logs de erro: `[WhatsApp] Erro ao enviar via W-API`

---

### **Problema 4: Erro ao processar com IA**

**Sintomas:**
- Log `[WhatsApp] Erro ao processar mensagem` aparece
- Mensagem de erro: "Todos os providers falharam"

**Soluções:**
1. ✅ Configurar pelo menos um provider de IA:
   - `GOOGLE_AI_API_KEY` (recomendado)
   - `OPENAI_API_KEY`
   - `CLAUDE_API_KEY`
2. ✅ Verificar se as chaves estão corretas
3. ✅ Verificar se há créditos/quota disponível

---

### **Problema 5: Instância W-API desconectada**

**Sintomas:**
- Status retorna `"connection": "disconnected"`
- Erro ao enviar mensagem

**Soluções:**
1. ✅ Acessar painel W-API
2. ✅ Verificar se a instância está conectada
3. ✅ Reconectar se necessário (gerar novo QR Code)

---

## 🧪 Teste Completo Passo a Passo

### **1. Verificar se webhook está acessível:**
```bash
curl https://livia-ai.vercel.app/webhook/w-api
```
Deve retornar: `{"status":"ok",...}`

### **2. Verificar status da instância:**
```bash
curl https://livia-ai.vercel.app/api/webhook/status
```
Deve retornar: `{"connection":"connected",...}`

### **3. Testar webhook com mensagem simulada:**
```bash
curl -X POST https://livia-ai.vercel.app/webhook/w-api \
  -H "Content-Type: application/json" \
  -d '{
    "event": "webhookReceived",
    "sender": {"id": "5511999999999"},
    "text": "teste"
  }'
```

### **4. Verificar logs do Vercel:**
- Deployments → Function Logs
- Procure por erros ou mensagens de processamento

### **5. Enviar mensagem real:**
- Envie mensagem para `(11) 93618-8540`
- Aguarde alguns segundos
- Verifique logs novamente

---

## 📋 Checklist Final

- [ ] Webhook configurado no painel W-API
- [ ] URL do webhook: `https://livia-ai.vercel.app/webhook/w-api`
- [ ] Método: `POST`
- [ ] Eventos marcados: "Mensagens recebidas"
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `W_API_TOKEN` configurado
- [ ] `W_API_INSTANCE_ID` configurado
- [ ] Pelo menos um provider de IA configurado
- [ ] Instância W-API conectada
- [ ] Teste manual do webhook funcionou
- [ ] Logs do Vercel verificados

---

## 🆘 Se Nada Funcionar

1. **Verificar logs completos do Vercel**
2. **Testar webhook manualmente com `curl`**
3. **Verificar todas as variáveis de ambiente**
4. **Verificar se a instância W-API está conectada**
5. **Verificar se há créditos/quota nos providers de IA**

---

**Depois de verificar tudo, envie uma mensagem novamente e verifique os logs!** 🔍
