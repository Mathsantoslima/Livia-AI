# ✨ Sistema de Nome e Apelido no Onboarding

## ✅ Implementação Completa

O onboarding agora pergunta separadamente o **nome** e o **apelido** (como o usuário prefere ser chamado), salva ambos no banco de dados e usa o apelido como prioridade no contexto das conversas.

---

## 📝 Fluxo do Onboarding

### 1. **Passo "welcome"** (Primeira mensagem)

- Livia se apresenta completamente
- Explica funcionalidades
- **Pergunta:** "Qual é o seu nome?"

### 2. **Passo "name"** (Nome completo)

- **Pergunta:** "Prazer em conhecê-lo(a)! 👋\n\nE como você prefere ser chamado(a)? (pode ser um apelido, diminutivo ou o próprio nome)"
- Extrai o nome de diferentes formatos:
  - "meu nome é João"
  - "sou Maria"
  - "me chamo Pedro"
  - "João" (resposta direta)

### 3. **Passo "nickname"** (Apelido/Preferência)

- **Pergunta:** "Perfeito! Vou te chamar assim então. 😊\n\nPara personalizar melhor nossa conversa, me conte:\n- Quantos anos você tem?\n- Qual seu gênero?"
- Extrai o apelido de diferentes formatos:
  - "me chame de João"
  - "chame de Maria"
  - "pode me chamar de Pedro"
  - "prefiro ser chamado de Ana"
  - "João" (resposta direta)

### 4. **Passos seguintes**

- Continua normalmente com idade, gênero, sono, trabalho, rotina, sintomas

---

## 💾 Armazenamento no Banco

### Campos Salvos:

- **`name`**: Nome completo do usuário
- **`nickname`**: Apelido/preferência de como ser chamado

### Exemplo:

```json
{
  "name": "Maria da Silva",
  "nickname": "Mari"
}
```

---

## 🎯 Uso no Contexto

### Prioridade de Uso:

1. **`nickname`** (se disponível) - **PRIORIDADE**
2. **`name`** (se nickname não disponível)
3. **"querido(a)"** (fallback genérico)

### Onde é Usado:

1. **MemoryManager** (`getUserMemory`)

   - Retorna `name` e `nickname` separadamente
   - Não faz fallback automático

2. **AgentBase** (`_buildSystemPrompt`)

   - Inclui no prompt:
     ```
     - Nome: Maria da Silva
     - Apelido/Como prefere ser chamado: Mari
     ```

3. **LiviaAgent** (`generateDailyCheckIn`)

   - Usa `nickname` como prioridade:
     ```javascript
     const name = userMemory.nickname || userMemory.name || "querido(a)";
     ```

4. **Mensagens de Onboarding**
   - Usa `nickname` se disponível, senão `name`
   - Exemplo: "Olá, Mari!" em vez de "Olá, Maria da Silva!"

---

## 🔍 Extração de Dados

### Nome (case "name"):

- Regex: `/(?:meu nome é|sou|me chamo|eu sou)\s+([A-Za-zÀ-ÿ\s]+)/i`
- Aceita: "meu nome é João", "sou Maria", "me chamo Pedro", "João"

### Apelido (case "nickname"):

- Regex: `/(?:me chame de|chame de|pode me chamar de|prefiro|gosto de ser chamado|apelido)\s+([A-Za-zÀ-ÿ\s]+)/i`
- Aceita: "me chame de Mari", "chame de João", "prefiro ser chamado de Ana", "Mari"

---

## 📊 Fluxo Completo

```
Usuário envia mensagem
    ↓
Onboarding detectado
    ↓
Passo "welcome" → Pergunta nome
    ↓
Usuário responde → Salva `name`
    ↓
Passo "nickname" → Pergunta apelido
    ↓
Usuário responde → Salva `nickname`
    ↓
Passo "basic_info" → Continua onboarding
    ↓
... (outros passos)
    ↓
Onboarding completo
    ↓
Livia usa `nickname` nas conversas
```

---

## ✅ Benefícios

1. **Personalização**: Usuário escolhe como prefere ser chamado
2. **Flexibilidade**: Aceita diferentes formatos de resposta
3. **Contexto Rico**: Livia sabe nome completo e preferência
4. **Experiência Natural**: Livia chama pelo apelido (mais íntimo)
5. **Fallback Inteligente**: Se não tiver apelido, usa nome

---

## 🎯 Exemplo de Uso

### Cenário 1: Usuário fornece nome e apelido

- **Nome:** "Maria da Silva"
- **Apelido:** "Mari"
- **Livia chama:** "Mari" ✅

### Cenário 2: Usuário fornece só nome

- **Nome:** "João"
- **Apelido:** null
- **Livia chama:** "João" ✅

### Cenário 3: Usuário não completa onboarding

- **Nome:** null
- **Apelido:** null
- **Livia chama:** "querido(a)" ✅

---

## ✅ Status

**Implementado e deployado!** 🚀

- ✅ Pergunta nome e apelido separadamente
- ✅ Salva ambos no banco
- ✅ Usa apelido como prioridade no contexto
- ✅ Extrai de diferentes formatos
- ✅ Fallback inteligente
