# 🔄 Reiniciar Backend - PASSO A PASSO

## ⚠️ SITUAÇÃO ATUAL

- ✅ `.env` atualizado: `GEMINI_MODEL=gemini-1.5-pro-latest`
- ✅ Código corrigido
- ❌ Backend ainda não reiniciado com as novas configurações

## ✅ SOLUÇÃO RÁPIDA

### **Passo 1: Parar todos os processos do backend**

Se você tiver algum terminal com o backend rodando, pressione **Ctrl+C** nele.

Ou execute no terminal:

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
pkill -f 'node.*server.js'
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
```

---

### **Passo 2: Verificar que a porta está livre**

```bash
lsof -ti:3000
```

Se não retornar nada, a porta está livre ✅

---

### **Passo 3: Iniciar o backend novamente**

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/backend
npm start
```

---

### **Passo 4: Verificar se está usando o modelo correto**

Após iniciar, procure nos logs:

```
✅ Provider Gemini inicializado
```

E quando uma mensagem chegar, não deve mais aparecer o erro:

```
❌ models/gemini-1.5-flash is not found
```

---

## 📋 RESUMO DO QUE FOI CORRIGIDO

1. ✅ **`.env`**: Atualizado para `GEMINI_MODEL=gemini-1.5-pro-latest`
2. ✅ **`GeminiProvider.js`**: Código corrigido
3. ✅ **`LiviaAgent.js`**: Usando `process.env.GEMINI_MODEL` corretamente
4. ⏳ **Backend**: Precisa ser reiniciado para carregar as novas configurações

---

## ⚠️ OUTROS PROBLEMAS (não críticos)

1. **ChatGPT**: Quota excedida (erro 429) - precisa adicionar créditos
2. **Claude**: API key não configurada - precisa adicionar `CLAUDE_API_KEY` no `.env`
3. **UUID Error**: "invalid input syntax for type uuid" - problema na busca de usuário (pode ser ignorado por enquanto)

---

## ✅ APÓS REINICIAR

Envie uma mensagem no WhatsApp e verifique se o Gemini responde corretamente!
