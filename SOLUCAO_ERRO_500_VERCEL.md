# 🔧 Solução: Erro 500 INTERNAL_SERVER_ERROR no Vercel

## ❌ Problema

```
500: INTERNAL_SERVER_ERROR
Code: FUNCTION_INVOCATION_FAILED
ID: gru1::89lgq-1768442488759-c941a16ded9d
```

## ✅ Correções Aplicadas

### **1. Tratamento de Erro Robusto**

Adicionei tratamento de erro em múltiplos níveis:

- **Erros de inicialização**: Capturados no bloco `try/catch` principal
- **Erros de rotas**: Tratados individualmente com fallback
- **Erros de ErrorHandler**: Fallback para handler básico se falhar
- **App mínimo**: Se tudo falhar, cria um app mínimo que retorna erro 500

### **2. Logs Melhorados**

Todos os erros agora são logados com `console.error` para aparecer nos logs do Vercel.

### **3. Fallbacks**

- Se rotas falharem → Rota `/health` ainda funciona com erro
- Se ErrorHandler falhar → Handler básico é usado
- Se tudo falhar → App mínimo retorna erro 500 com detalhes

---

## 🔍 Como Diagnosticar o Problema Real

### **1. Verificar Logs do Vercel**

No dashboard do Vercel:

1. Vá em **Deployments**
2. Clique no deployment que falhou
3. Vá em **Function Logs** ou **Runtime Logs**
4. Procure por:
   - `❌ Erro não capturado durante inicialização`
   - `❌ Erro ao configurar rotas`
   - `❌ Erro ao configurar ErrorHandler`
   - `❌ Erro fatal ao inicializar servidor`

### **2. Testar Rota `/health`**

Mesmo com erro, a rota `/health` deve retornar algo:

```bash
curl https://seu-projeto.vercel.app/health
```

**Se retornar erro 500:**
- O problema é na inicialização básica
- Verifique variáveis de ambiente

**Se retornar 200:**
- O problema é em rotas específicas
- Verifique logs para qual rota está falhando

---

## 🔧 Possíveis Causas

### **1. Variáveis de Ambiente Faltando**

Verifique se todas estão configuradas no Vercel:

**Obrigatórias:**
- `NODE_ENV` (deve ser `production`)
- `SUPABASE_URL`
- `SUPABASE_KEY`

**Opcionais (mas podem causar erro se usadas):**
- `GOOGLE_AI_API_KEY`
- `OPENAI_API_KEY`
- `CLAUDE_API_KEY`
- `W_API_URL`
- `W_API_TOKEN`
- `JWT_SECRET`

### **2. Erro ao Carregar Módulos**

Se algum `require()` falhar, o erro aparecerá nos logs.

**Verificar:**
- `./src/config` existe?
- `./src/utils/logger` existe?
- `./src/utils/errorHandler` existe?
- `./src/routes/index` existe?

### **3. Erro no Logger**

Se o logger tentar escrever em arquivo (não permitido no Vercel), pode falhar.

**Solução:** O logger deve usar apenas `console.log` no Vercel.

### **4. Erro no Helmet**

O `helmet()` pode ter problemas com algumas configurações.

**Solução:** Já está dentro do try/catch, então não deve quebrar tudo.

---

## 🧪 Testar Localmente

Para simular o ambiente do Vercel:

```bash
cd fibromialgia-assistant/backend

# Definir variáveis de ambiente
export NODE_ENV=production
export PORT=3000

# Testar se o app exporta corretamente
node -e "const app = require('./server.js'); console.log('App carregado:', typeof app)"
```

**Se funcionar:**
- O problema pode ser variáveis de ambiente no Vercel

**Se falhar:**
- O erro aparecerá no terminal
- Corrija o problema antes de fazer deploy

---

## 📋 Checklist de Verificação

- [x] Tratamento de erro robusto adicionado
- [x] Logs melhorados com `console.error`
- [x] Fallbacks para todos os componentes críticos
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Logs do Vercel verificados
- [ ] Rota `/health` testada

---

## 🚀 Próximos Passos

1. **Aguardar novo deploy** (automático após push)
2. **Verificar logs do Vercel** para identificar o erro real
3. **Testar `/health`** para ver se retorna algo
4. **Configurar variáveis de ambiente** se faltarem

---

## 🆘 Se Ainda Não Funcionar

### **Opção 1: Criar Versão Mínima**

Criar um `server-minimal.js` apenas para testar:

```javascript
const express = require("express");
const app = express();

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = app;
```

### **Opção 2: Verificar Dependências**

Algumas dependências podem não funcionar no Vercel:

- `bcrypt` → pode precisar de `bcryptjs`
- `sharp` → pode precisar de configuração especial
- Módulos nativos → podem não compilar

### **Opção 3: Usar Vercel CLI Localmente**

```bash
npm i -g vercel
vercel dev
```

Isso simula o ambiente do Vercel localmente.

---

**Correções aplicadas e commitadas!** 🎉

Agora o servidor não deve crashar silenciosamente. Verifique os logs do Vercel para ver o erro real.
