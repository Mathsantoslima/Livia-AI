# ⚡ Configurar Webhook W-API - GUIA RÁPIDO

## 🔴 PROBLEMA ATUAL

Você enviou uma mensagem para `(11) 93618-8540`, mas a Livia não respondeu porque:

**O webhook não está configurado ou não está acessível pela internet!**

---

## ✅ SOLUÇÃO EM 3 PASSOS

### **Passo 1: Iniciar ngrok** (túnel para seu backend local)

```bash
# 1. Verificar se ngrok está instalado
which ngrok

# 2. Se não estiver, instalar:
# macOS:
brew install ngrok

# 3. Iniciar ngrok apontando para a porta 3000
ngrok http 3000
```

**IMPORTANTE:** Deixe o ngrok rodando em um terminal separado!

**Você verá algo assim:**
```
Forwarding  https://xxxxx.ngrok-free.app -> http://localhost:3000
```

**COPIE A URL HTTPS** (ex: `https://xxxxx.ngrok-free.app`)

---

### **Passo 2: Configurar Webhook no Painel W-API**

1. **Acesse:** https://painel.w-api.app
2. **Faça login** (se necessário)
3. **Vá para:** Instâncias → `VH1570-AP32GM-N91RKI`
4. **Clique em:** Configurações ou Webhook
5. **Configure o webhook:**
   - **URL:** `https://xxxxx.ngrok-free.app/api/webhook/w-api`
     (substitua `xxxxx` pela URL do seu ngrok)
   - **Método:** POST
   - **Eventos:** Marque ✅ "Mensagens recebidas" ou "webhookReceived"

6. **Salve as configurações**

---

### **Passo 3: Testar**

1. **Envie uma mensagem** para `(11) 93618-8540`
2. **Verifique o terminal do backend** - deve aparecer:
   ```
   [W-API Webhook] Evento recebido: ...
   [W-API Webhook] Mensagem recebida de 551199999999: ...
   ```
3. **Aguarde a resposta** da Livia (pode levar alguns segundos)

---

## 🔍 Verificações

### Verificar se o backend está rodando:

```bash
curl http://localhost:3000/health
```

Deve retornar:
```json
{
  "status": "online",
  ...
}
```

### Verificar se o ngrok está funcionando:

```bash
curl https://xxxxx.ngrok-free.app/health
```

(Substitua `xxxxx` pela sua URL do ngrok)

---

## ⚠️ IMPORTANTE

- **O ngrok precisa estar rodando** sempre que você quiser receber mensagens
- **A URL do ngrok muda** a cada vez que você reinicia (versão free)
- **Para produção**, use um domínio próprio com HTTPS

---

## 🧪 Teste Completo

1. ✅ Backend rodando (`curl http://localhost:3000/health`)
2. ✅ ngrok rodando (`ngrok http 3000`)
3. ✅ Webhook configurado no painel W-API
4. ✅ URL do webhook: `https://xxxxx.ngrok-free.app/api/webhook/w-api`
5. ✅ Enviar mensagem para `(11) 93618-8540`
6. ✅ Verificar logs do backend
7. ✅ Receber resposta da Livia

---

## 📋 Checklist

- [ ] Backend rodando na porta 3000
- [ ] ngrok instalado
- [ ] ngrok rodando (`ngrok http 3000`)
- [ ] URL do ngrok copiada
- [ ] Webhook configurado no painel W-API
- [ ] URL do webhook: `https://xxxxx.ngrok-free.app/api/webhook/w-api`
- [ ] Eventos marcados no webhook
- [ ] Testado enviando mensagem

---

## 🆘 Problemas Comuns

### "Webhook não está recebendo mensagens"

- ✅ Verifique se o ngrok está rodando
- ✅ Verifique se a URL no painel W-API está correta
- ✅ Teste a URL: `curl https://xxxxx.ngrok-free.app/health`

### "ngrok não está instalado"

```bash
# macOS
brew install ngrok

# Ou baixar de: https://ngrok.com/download
```

### "Mensagens chegam mas não são processadas"

- ✅ Verifique os logs do backend
- ✅ Verifique se o formato do payload está correto
- ✅ Veja: `SOLUCAO_MENSAGENS_NAO_CHEGAM.md`
