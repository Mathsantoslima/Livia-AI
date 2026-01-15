# ✅ Configurar Webhook W-API - Passo a Passo

## 📸 O Que Vejo na Sua Tela

Você já tem os webhooks configurados! Vejo que:

✅ **URL configurada:** `https://livia-ai.vercel.app/webhook/w-api`  
✅ **Evento importante marcado:** "Ao receber uma mensagem"  
✅ **Outros eventos também configurados**

---

## 🔴 AÇÃO NECESSÁRIA AGORA

### **1. Salvar as Alterações**

**IMPORTANTE:** Clique no botão verde **"Salvar alterações"** no canto inferior direito do painel!

Sem salvar, as configurações não serão aplicadas.

---

### **2. Verificar se a Instância Está Conectada**

No painel W-API, verifique se a instância `VH1570-AP32GM-N91RKI` está:

- ✅ **Status:** "Conectado" ou "Connected"
- ✅ **Número:** `5511936188540` aparece como conectado

Se não estiver conectada:
1. Clique na instância
2. Procure por "Conectar" ou "QR Code"
3. Escaneie o QR Code com seu WhatsApp

---

## 🧪 Teste Após Salvar

### **1. Salvar Alterações**

Clique em **"Salvar alterações"** no painel.

### **2. Aguardar alguns segundos**

Aguarde 5-10 segundos para as configurações serem aplicadas.

### **3. Enviar Mensagem de Teste**

Envie uma mensagem para `(11) 93618-8540` (ou o número conectado).

### **4. Verificar Logs do Vercel**

Após enviar, verifique os logs:
1. Vá em **Deployments**
2. Clique no deployment mais recente
3. Vá em **Function Logs**
4. Procure por:
   - `[W-API Webhook] Evento recebido`
   - `[WhatsApp] Mensagem recebida`

---

## 🔍 Verificações Adicionais

### **Verificar Status da Instância**

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
    "instanceId": "VH1570-AP32GM-N91RKI"
  }
}
```

Se retornar `"connection": "disconnected"`, a instância não está conectada.

---

## ⚠️ Problemas Comuns

### **1. "Salvei mas ainda não funciona"**

- ✅ Aguarde 10-15 segundos após salvar
- ✅ Verifique se a instância está conectada
- ✅ Teste enviando uma mensagem novamente
- ✅ Verifique os logs do Vercel

### **2. "Instância não está conectada"**

1. Clique na instância no painel
2. Procure por "Conectar" ou "QR Code"
3. Escaneie o QR Code
4. Aguarde a conexão ser estabelecida

### **3. "Mensagem chega mas não responde"**

Verifique:
- ✅ Variáveis de ambiente no Vercel (`W_API_TOKEN`, `GOOGLE_AI_API_KEY`)
- ✅ Logs do Vercel para erros
- ✅ Se há créditos/quota nos providers de IA

---

## 📋 Checklist Final

- [ ] Webhooks configurados com URL correta
- [ ] **"Salvar alterações" clicado** ⚠️ IMPORTANTE!
- [ ] Aguardou alguns segundos após salvar
- [ ] Instância está conectada
- [ ] Enviou mensagem de teste
- [ ] Verificou logs do Vercel
- [ ] Viu `[W-API Webhook] Evento recebido` nos logs

---

## 🎯 Próximos Passos

1. **Clique em "Salvar alterações"** (se ainda não salvou)
2. **Verifique se a instância está conectada**
3. **Envie uma mensagem de teste**
4. **Verifique os logs do Vercel**

---

**O mais importante agora é SALVAR as alterações!** 💾

Depois de salvar, teste novamente e me diga o que aparece nos logs.
