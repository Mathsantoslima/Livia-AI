# 🎯 Sistema de Onboarding Automático

## ✅ Implementado

O agente Livia agora **automaticamente detecta usuários novos** e faz o mapeamento completo do perfil antes de iniciar conversas normais.

---

## 🔄 Fluxo de Onboarding

### 1. **Detecção Automática**
Quando um usuário envia a primeira mensagem:
- ✅ Sistema verifica se o usuário existe no banco
- ✅ Se não existe → inicia onboarding
- ✅ Se existe mas perfil incompleto → continua onboarding
- ✅ Se perfil completo → processa mensagem normalmente

### 2. **Passos do Onboarding**

#### **Passo 1: Welcome + Nome**
```
Olá! 😊

Sou a Livia, sua assistente para ajudar com fibromialgia.

Antes de começarmos, preciso conhecer você melhor para poder ajudar de forma personalizada.

Qual é o seu nome?
```

#### **Passo 2: Informações Básicas**
```
Prazer em conhecê-lo(a)! 👋

Para personalizar melhor nossa conversa, me conte:
- Quantos anos você tem?
- Qual seu gênero?
```

#### **Passo 3: Hábitos de Sono**
```
Entendi! Obrigada por compartilhar. 💙

Agora, me fale sobre seu sono:
- Quantas horas você costuma dormir por noite?
- Como você avalia a qualidade do seu sono? (bom, médio, ruim)
```

#### **Passo 4: Hábitos de Trabalho**
```
Obrigada! 📝

E sobre seu trabalho:
- Você trabalha? Quantas horas por dia?
- Como você avalia o nível de estresse no trabalho? (baixo, médio, alto)
```

#### **Passo 5: Rotina Diária**
```
Perfeito! ✨

Me conte sobre sua rotina diária:
- Que horas você costuma acordar e dormir?
- Você faz alguma atividade física? Qual e com que frequência?
```

#### **Passo 6: Sintomas e Gatilhos**
```
Ótimo! Já estou conhecendo você melhor. 🎯

Por último, me conte:
- Quais são os principais sintomas de fibromialgia que você sente? (ex: dor, fadiga, problemas de sono)
- Há algo que você percebe que piora seus sintomas? (gatilhos)
```

#### **Passo 7: Conclusão**
```
Perfeito! Agora já tenho um perfil completo sobre você. 🎉

Vou usar essas informações para:
- Entender melhor seus padrões
- Fazer previsões sobre seus dias
- Dar sugestões personalizadas

Pode me contar como você está se sentindo hoje?
```

---

## 🧠 Extração Automática de Informações

O sistema **extrai automaticamente** informações das respostas do usuário:

### **Nome**
- Extrai de: "meu nome é João", "sou Maria", "me chamo Pedro"
- Salva: `name` e `nickname` (primeiro nome)

### **Idade e Gênero**
- Extrai idade de: "tenho 35 anos", "35 anos"
- Extrai gênero de: "mulher", "homem", "feminino", "masculino"

### **Sono**
- Extrai horas: "dormo 7 horas", "7h por noite"
- Extrai qualidade: "bom", "médio", "ruim"
- Extrai consistência: "sempre", "às vezes", "variável"

### **Trabalho**
- Extrai horas: "trabalho 8 horas", "8h por dia"
- Extrai estresse: "alto", "médio", "baixo"
- Detecta pausas: "faço pausas", "tenho descanso"

### **Rotina**
- Extrai horários: "acordo às 7h", "durmo às 22h"
- Detecta atividade física: "caminhada", "academia", "yoga"

### **Sintomas**
- Detecta automaticamente: dor, fadiga, sono, ansiedade, depressão, rigidez, memória

---

## 💾 Armazenamento

Todas as informações são salvas em:
- ✅ `users_livia` - Dados do usuário
- ✅ `conversations_livia` - Histórico de onboarding
- ✅ Campos JSONB para rotina, hábitos e perfil comportamental

---

## 🎯 Prioridade

**O onboarding tem PRIORIDADE MÁXIMA:**
- ✅ Verificado **ANTES** de processar qualquer mensagem
- ✅ Se usuário precisa de onboarding → **só faz onboarding**
- ✅ Só processa mensagens normais quando perfil está completo

---

## 🔍 Verificação de Perfil Completo

Um perfil é considerado completo quando tem:
- ✅ Nome (name ou nickname)
- ✅ Rotina básica OU hábitos
- ✅ `onboarding_completed = true`

---

## 📝 Exemplo de Fluxo

**Usuário novo envia:** "Oi"

**Livia responde:**
```
Olá! 😊

Sou a Livia, sua assistente para ajudar com fibromialgia.

Antes de começarmos, preciso conhecer você melhor para poder ajudar de forma personalizada.

Qual é o seu nome?
```

**Usuário responde:** "Meu nome é Maria"

**Livia responde:**
```
Prazer em conhecê-la, Maria! 👋

Para personalizar melhor nossa conversa, me conte:
- Quantos anos você tem?
- Qual seu gênero?
```

E assim por diante até completar o perfil...

---

## ✅ Status

**Sistema de onboarding implementado e funcionando!**

- ✅ Detecção automática
- ✅ Fluxo progressivo
- ✅ Extração automática
- ✅ Salvamento no banco
- ✅ Integração completa

**Pronto para uso!** 🎉
