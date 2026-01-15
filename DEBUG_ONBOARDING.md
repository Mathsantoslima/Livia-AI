# 🐛 Debug do Sistema de Onboarding

## ✅ Correções Aplicadas

### 1. **Normalização de Phone** ✅
- ✅ Todas as funções agora normalizam o phone (removem caracteres não numéricos)
- ✅ Busca no banco usa phone normalizado
- ✅ Criação/atualização usa phone normalizado

### 2. **Logging Detalhado** ✅
- ✅ Logs em cada etapa do onboarding
- ✅ Logs de verificação de status
- ✅ Logs de criação/atualização de usuário
- ✅ Logs de detecção de perfil completo

### 3. **Lógica de Detecção** ✅
- ✅ `welcome` não é considerado resposta de onboarding
- ✅ Primeira mensagem sempre inicia onboarding
- ✅ Mensagens subsequentes processam respostas

### 4. **Verificação de Perfil Completo** ✅
- ✅ `onboarding_completed = true` → perfil completo
- ✅ `onboarding_completed = false` → precisa de onboarding
- ✅ Verifica nome + (rotina OU hábitos)

---

## 🔍 Como Verificar se Está Funcionando

### 1. **Verificar Logs do Vercel**

Após enviar uma mensagem, verifique os logs:

```
[Onboarding] Verificando status para userId: 5511936188540 (normalizado: 5511936188540)
[Onboarding] Resultado da busca: { found: false, error: 'PGRST116', userId: '5511936188540' }
[Onboarding] Usuário 5511936188540 não encontrado - precisa de onboarding
[Livia] Usuário 5511936188540 precisa de onboarding. Passo: welcome
[Livia] Iniciando onboarding para usuário 5511936188540
```

### 2. **Verificar Banco de Dados**

```sql
-- Verificar se usuário foi criado
SELECT * FROM users_livia WHERE phone = '5511936188540';

-- Verificar conversas de onboarding
SELECT * FROM conversations_livia 
WHERE phone = '5511936188540' 
ORDER BY sent_at DESC;
```

### 3. **Testar Fluxo Completo**

1. Enviar "Oi" → Deve iniciar onboarding
2. Responder com nome → Deve perguntar idade/gênero
3. Responder idade/gênero → Deve perguntar sobre sono
4. E assim por diante...

---

## 🐛 Possíveis Problemas

### Problema 1: Phone não está sendo normalizado
**Sintoma:** Usuário não é encontrado mesmo existindo
**Solução:** ✅ Já corrigido - normalização aplicada

### Problema 2: Onboarding não inicia
**Sintoma:** Mensagem é processada normalmente
**Causa possível:** 
- Phone não está sendo passado corretamente
- Verificação está falhando silenciosamente

**Debug:**
```javascript
// Adicionar no início de processMessage
logger.info(`[Livia] userId recebido: ${userId}, tipo: ${typeof userId}`);
```

### Problema 3: Resposta não é processada
**Sintoma:** Onboarding inicia mas não avança
**Causa possível:**
- Lógica de detecção de resposta está errada
- Passo não está sendo atualizado

**Debug:**
```javascript
// Verificar logs:
[Livia] É resposta de onboarding? true/false
[Onboarding] Atualizando perfil para userId: ...
```

---

## 📝 Próximos Passos para Debug

Se ainda não funcionar:

1. **Verificar formato do phone que chega:**
   - Adicionar log no `_phoneToUserId`
   - Verificar se está removendo caracteres corretamente

2. **Verificar se usuário está sendo criado:**
   - Verificar logs de criação
   - Verificar se há erro no Supabase

3. **Verificar se mensagem está sendo salva:**
   - Verificar logs de `_saveOnboardingMessage`
   - Verificar se há erro no Supabase

4. **Testar diretamente no código:**
   ```javascript
   const userOnboarding = require("./services/userOnboarding");
   const status = await userOnboarding.checkOnboardingStatus("5511936188540");
   console.log(status);
   ```

---

## ✅ Status

**Correções aplicadas:**
- ✅ Normalização de phone
- ✅ Logging detalhado
- ✅ Lógica de detecção corrigida
- ✅ Verificação de perfil melhorada

**Deploy:** ✅ Commit e push realizados

**Próximo passo:** Testar novamente e verificar logs do Vercel
