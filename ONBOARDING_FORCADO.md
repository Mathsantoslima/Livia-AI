# 🐛 Correção: Onboarding Forçado

## ✅ Problema Identificado

O onboarding não estava sendo executado porque:
1. A verificação de perfil completo estava muito permissiva
2. Erros silenciosos estavam bloqueando o onboarding
3. Não havia fallback quando a verificação falhava

---

## 🔧 Correções Aplicadas

### 1. **Forçar Onboarding em Caso de Erro** ✅
```javascript
// ANTES: Retornava needsOnboarding: false em caso de erro
// AGORA: Retorna needsOnboarding: true em caso de erro
```

**Mudança:**
- Se houver erro ao buscar usuário (exceto "não encontrado"), assume que precisa de onboarding
- Se houver erro crítico, assume que precisa de onboarding por segurança
- Nunca bloqueia o usuário por erro técnico

### 2. **Verificação de Perfil Mais Rigorosa** ✅
```javascript
// ANTES: Perfil completo se tinha nome E (rotina OU hábitos)
// AGORA: Perfil completo precisa ter:
// - Nome
// - Nickname
// - Info básica (idade OU gênero)
// - Hábitos de sono
// - Hábitos de trabalho
// - Rotina diária
// - Sintomas principais
```

**Mudança:**
- Verificação muito mais rigorosa
- Logs detalhados de cada campo
- Garante que onboarding só completa quando TODOS os dados estão presentes

### 3. **Forçar Onboarding no LiviaAgent** ✅
```javascript
// ANTES: if (onboardingStatus.needsOnboarding)
// AGORA: 
const shouldDoOnboarding = onboardingStatus.needsOnboarding || 
                           onboardingStatus.error || 
                           !onboardingStatus.profile;
```

**Mudança:**
- Força onboarding se:
  - `needsOnboarding = true` OU
  - Houve erro na verificação OU
  - Não tem perfil
- Garante que sempre há um passo definido (`currentStep || "welcome"`)

### 4. **Logs Detalhados** ✅
- Logs em cada verificação de perfil
- Logs mostrando motivo do onboarding
- Logs de cada campo verificado
- Fácil identificar por que onboarding está/está não acontecendo

---

## 📊 Fluxo Corrigido

```
Usuário envia mensagem
    ↓
LiviaAgent.processMessage()
    ↓
userOnboarding.checkOnboardingStatus()
    ↓
Busca usuário no banco
    ↓
┌─ Usuário não existe → needsOnboarding: true, step: "welcome"
├─ Erro ao buscar → needsOnboarding: true, step: "welcome" (NOVO!)
└─ Usuário existe → Verifica perfil completo
    ↓
┌─ Perfil completo → needsOnboarding: false
└─ Perfil incompleto → needsOnboarding: true, step: próximo passo
    ↓
LiviaAgent verifica shouldDoOnboarding
    ↓
┌─ needsOnboarding OU erro OU sem perfil → EXECUTA ONBOARDING
└─ Caso contrário → Processa normalmente
```

---

## 🔍 Logs Esperados

### Quando Onboarding Deve Acontecer:
```
[Onboarding] Verificando status para userId: 5511936188540 (normalizado: 5511936188540)
[Onboarding] Resultado da busca: { found: false, error: 'PGRST116', userId: '5511936188540' }
[Onboarding] Usuário 5511936188540 não encontrado - precisa de onboarding
[Livia] Status de onboarding: { needsOnboarding: true, currentStep: 'welcome', isNewUser: true }
[Livia] Usuário 5511936188540 precisa de onboarding. Passo: welcome, motivo: needsOnboarding=true
[Livia] Iniciando onboarding para usuário 5511936188540
```

### Quando Onboarding Não Deve Aconter (Perfil Completo):
```
[Onboarding] Verificando status para userId: 5511936188540
[Onboarding] Resultado da busca: { found: true, error: null }
[Onboarding] Verificando perfil completo: { hasName: true, hasNickname: true, ... }
[Onboarding] Perfil COMPLETO
[Livia] Status de onboarding: { needsOnboarding: false, currentStep: null }
[Livia] Processando mensagem normalmente...
```

---

## ✅ Validações Adicionadas

### 1. **Validação de Erro**
- Se erro ao buscar usuário → Força onboarding
- Se erro crítico → Força onboarding
- Nunca bloqueia por erro técnico

### 2. **Validação de Perfil**
- Verifica TODOS os campos necessários
- Logs detalhados de cada campo
- Só marca como completo se TUDO estiver preenchido

### 3. **Validação de Passo**
- Sempre garante que há um passo definido
- Fallback para "welcome" se não houver passo
- Logs mostram motivo do onboarding

---

## 🎯 Status

**✅ Correções aplicadas e deployadas!**

- ✅ Onboarding forçado em caso de erro
- ✅ Verificação de perfil mais rigorosa
- ✅ Logs detalhados em cada etapa
- ✅ Garantia de que sempre executa quando necessário

---

## 🔍 Como Verificar

1. **Enviar mensagem para usuário novo:**
   - Deve iniciar onboarding imediatamente
   - Logs devem mostrar: "Usuário não encontrado - precisa de onboarding"

2. **Verificar logs do Vercel:**
   - Procurar por `[Onboarding]` e `[Livia]`
   - Verificar se `needsOnboarding: true`
   - Verificar se `currentStep` está definido

3. **Se ainda não funcionar:**
   - Verificar logs para identificar onde está falhando
   - Verificar se há erros de conexão com Supabase
   - Verificar se tabela `users_livia` existe

---

## 📝 Próximos Passos

Se o onboarding ainda não acontecer:

1. **Verificar logs do Vercel** para ver:
   - Se `checkOnboardingStatus` está sendo chamado
   - Qual é o resultado da busca
   - Se há erros silenciosos

2. **Verificar banco de dados:**
   - Tabela `users_livia` existe?
   - Há usuários na tabela?
   - Permissões de leitura/escrita estão corretas?

3. **Testar diretamente:**
   ```javascript
   const userOnboarding = require("./services/userOnboarding");
   const status = await userOnboarding.checkOnboardingStatus("5511936188540");
   console.log(status);
   ```

---

## ✅ Garantias

**Agora o onboarding SEMPRE acontece quando:**
- ✅ Usuário não existe no banco
- ✅ Há erro ao buscar usuário
- ✅ Perfil está incompleto
- ✅ `onboarding_completed` é `false` ou `null`

**Onboarding NÃO acontece apenas quando:**
- ✅ `onboarding_completed` é explicitamente `true`
- ✅ TODOS os campos necessários estão preenchidos
