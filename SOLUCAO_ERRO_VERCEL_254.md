# 🔧 Solução: Erro 254 no Vercel

## ❌ Problema

```
Command "npm install" exited with 254
```

## ✅ Correções Aplicadas

### 1. **Dependência Duplicada Removida** ✅

O `package.json` tinha `openai` duplicado (linhas 32 e 42). Isso foi corrigido.

### 2. **bcrypt Atualizado** ✅

Mudei de `bcrypt@^6.0.0` para `bcrypt@^5.1.1` porque:
- `bcrypt@6.x` pode ter problemas de compilação no Vercel
- `bcrypt@5.x` é mais estável e compatível

### 3. **Configuração Vercel Melhorada** ✅

Criado `vercel.json` com:
- `maxLambdaSize: 50mb` (para dependências grandes)
- `maxDuration: 30` (timeout de 30 segundos)

### 4. **Arquivo .npmrc Criado** ✅

Criado `.npmrc` com:
- `legacy-peer-deps=true` (resolve conflitos de dependências)
- `engine-strict=false` (permite flexibilidade de versão Node)

---

## 🚀 Próximos Passos

### **1. Aguardar Deploy Automático**

O Vercel deve detectar o novo push e tentar fazer deploy novamente automaticamente.

### **2. Se Ainda Falhar, Verificar Logs**

No dashboard do Vercel:
1. Acesse o projeto
2. Vá em **Deployments**
3. Clique no deployment que falhou
4. Veja os **Build Logs** completos

### **3. Configurações no Vercel Dashboard**

Certifique-se de que:

**Settings > General:**
- **Root Directory**: `fibromialgia-assistant/backend`
- **Build Command**: Deixe vazio ou `npm install`
- **Output Directory**: Deixe vazio (`.`)
- **Install Command**: `npm install --legacy-peer-deps`

**Settings > Environment Variables:**
- Todas as variáveis de ambiente configuradas

---

## 🔍 Outras Possíveis Causas

### **1. Memória Insuficiente**

Se ainda falhar, pode ser memória. Tente:

**No `vercel.json`:**
```json
{
  "functions": {
    "server.js": {
      "memory": 3008
    }
  }
}
```

### **2. Node.js Version**

No Vercel Dashboard:
- **Settings > General > Node.js Version**: `18.x` ou `20.x`

### **3. Dependências Nativas**

Se `bcrypt` ainda der problema, pode usar `bcryptjs` (puro JavaScript):

```bash
npm uninstall bcrypt
npm install bcryptjs
```

E no código, trocar:
```javascript
const bcrypt = require('bcryptjs');
```

---

## ✅ Checklist de Verificação

- [x] Dependência `openai` duplicada removida
- [x] `bcrypt` atualizado para versão 5.x
- [x] `vercel.json` criado com configurações adequadas
- [x] `.npmrc` criado com `legacy-peer-deps`
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Root Directory configurado como `fibromialgia-assistant/backend`
- [ ] Node.js version configurada (18.x ou 20.x)

---

## 📋 Comandos Úteis

### **Testar Localmente (simular Vercel)**

```bash
cd fibromialgia-assistant/backend
npm install --legacy-peer-deps
npm start
```

### **Verificar Dependências**

```bash
npm ls --depth=0
```

### **Limpar e Reinstalar**

```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 🆘 Se Ainda Não Funcionar

1. **Verifique os logs completos** no Vercel
2. **Teste localmente** com `npm install --legacy-peer-deps`
3. **Considere usar `bcryptjs`** em vez de `bcrypt`
4. **Verifique se todas as dependências são compatíveis** com Node.js 18+

---

**As correções foram commitadas e enviadas para o GitHub!** 🚀

O Vercel deve tentar fazer deploy novamente automaticamente.
