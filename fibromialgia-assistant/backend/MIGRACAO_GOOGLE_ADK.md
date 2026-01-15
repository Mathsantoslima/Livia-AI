# 🚀 Migração para Infraestrutura de IA com Google ADK

## 📋 Visão Geral

Esta migração transforma a assistente Livia de um chatbot simples em uma **infraestrutura de IA modular baseada em agentes**, usando o conceito de **Agent Development Kit (ADK)** com Google Gemini API.

## 🏗️ Arquitetura

### Estrutura de Pastas

```
backend/src/
├── core/                    # Core de IA (reutilizável)
│   ├── AgentBase.js        # Classe base para agentes
│   ├── MemoryManager.js    # Gerenciamento de memória
│   ├── Orchestrator.js     # Orquestração de decisões
│   └── tools/              # Ferramentas do agente
│       └── index.js
├── agents/                  # Agentes específicos
│   └── LiviaAgent.js       # Configuração do agente Livia
├── channels/                # Canais de comunicação
│   └── WhatsAppChannel.js  # Adaptador WhatsApp
└── ai-infra/               # Infraestrutura principal
    ├── index.js            # Entry point
    └── integration-example.js
```

## 🧩 Componentes Principais

### 1. Core de IA (`AgentBase`)

**Responsabilidades:**
- Raciocínio e decisão de próxima ação
- Uso de ferramentas (tools)
- Gestão de contexto
- Integração com Google Gemini API

**Características:**
- Reutilizável para múltiplos agentes
- Suporte a function calling (tools)
- Gestão automática de contexto
- Quebra de respostas em chunks

### 2. Agente Livia (`LiviaAgent`)

**Configuração:**
- **Persona**: Assistente empática especializada em fibromialgia
- **Objetivos**: Identificar padrões, melhorar qualidade de vida, suporte emocional
- **Restrições**: Não diagnosticar, não prescrever, sugerir acompanhamento médico
- **Regras de Conversa**: Mensagens curtas, sem loops, escuta ativa

**Tools Registradas:**
- `buscar_historico`: Busca histórico de conversas
- `salvar_evento`: Salva conversa no banco
- `detectar_padroes`: Analisa padrões do usuário
- `gerar_resumo_diario`: Gera resumo do dia
- `sugerir_acoes`: Sugere ações baseadas em evidências

### 3. Sistema de Memória (`MemoryManager`)

**Memória Individual (por usuário):**
- Nome e preferências
- Histórico resumido
- Padrões detectados
- Nível de engajamento

**Memória Global (aprendizado coletivo):**
- Insights agregados
- Padrões globais
- Eficácia de intervenções
- Correlações demográficas

**Características:**
- Cache em memória (TTL: 5 minutos)
- Persistência no Supabase
- Sem vazamento de dados pessoais

### 4. Orquestrador (`Orchestrator`)

**Responsabilidades:**
- Decidir quando o agente deve agir
- Evitar perguntas repetitivas
- Gerenciar fluxo de decisões
- Priorizar ações

**Tipos de Decisão:**
- `respond`: Resposta conversacional
- `acknowledge_and_continue`: Reconhecer e continuar
- `ask_clarification`: Pedir esclarecimento
- `onboarding`: Fluxo de onboarding
- `empathize_and_explore`: Empatizar e explorar

### 5. Canal WhatsApp (`WhatsAppChannel`)

**Responsabilidades:**
- Receber mensagens do WhatsApp
- Enviar mensagens para o WhatsApp
- Converter formatos entre WhatsApp e IA
- Gerenciar delays naturais

**Características:**
- Desacoplado da IA
- Suporta Baileys e Evolution API
- Simula digitação humana
- Quebra mensagens em chunks

## 🔄 Fluxo de Mensagem Completo

```
1. WhatsApp recebe mensagem
   ↓
2. WhatsAppChannel extrai dados
   ↓
3. Orchestrator analisa e decide ação
   ↓
4. LiviaAgent processa com Google Gemini
   ↓
5. Tools são executadas se necessário
   ↓
6. MemoryManager atualiza memória
   ↓
7. Resposta é quebrada em chunks
   ↓
8. WhatsAppChannel envia com delays naturais
```

## 📦 Instalação

### 1. Instalar dependências

```bash
cd fibromialgia-assistant/backend
npm install @google/generative-ai
```

### 2. Configurar variáveis de ambiente

```env
# Google AI API
GOOGLE_AI_API_KEY=sua-chave-aqui
GEMINI_MODEL=gemini-1.5-pro

# Supabase (já configurado)
SUPABASE_URL=https://dbwrpdxwfqqbsngijrle.supabase.co
SUPABASE_KEY=sua-chave-supabase
```

### 3. Integrar com sistema existente

```javascript
const { initializeAIInfrastructure, handleBaileysMessage } = require('./src/ai-infra/integration-example');

// Inicializar infraestrutura
const aiInfra = initializeAIInfrastructure(whatsappClient);

// Handler para mensagens Baileys
sock.ev.on("messages.upsert", async (m) => {
  if (m.type === "notify") {
    for (const msg of m.messages) {
      await handleBaileysMessage(msg, aiInfra);
    }
  }
});
```

## 🎯 Exemplo de Uso

### Processar mensagem diretamente

```javascript
const { getAIInfrastructure } = require('./src/ai-infra');

const aiInfra = getAIInfrastructure();

const response = await aiInfra.processMessage(
  "5511999999999", // userId (telefone)
  "Oi, estou com muita dor hoje", // mensagem
  { channel: "whatsapp" } // contexto
);

console.log(response.text); // Resposta do agente
console.log(response.chunks); // Resposta quebrada em chunks
```

### Usar canal WhatsApp

```javascript
const aiInfra = getAIInfrastructure();
const channel = aiInfra.getChannel("whatsapp");

// Processar mensagem recebida
await channel.handleIncomingMessage(messageData);

// Enviar mensagem manualmente
await channel.sendMessage("5511999999999", "Olá! Como posso ajudar?");
```

## 🔧 Extensibilidade

### Criar novo agente

```javascript
const AgentBase = require('./src/core/AgentBase');

class MeuAgente extends AgentBase {
  constructor() {
    super({
      name: "MeuAgente",
      persona: "Você é um assistente especializado em...",
      objectives: ["Objetivo 1", "Objetivo 2"],
      restrictions: ["Restrição 1"],
    });
  }
}
```

### Criar novo canal

```javascript
class TelegramChannel {
  constructor(agent, telegramClient) {
    this.agent = agent;
    this.telegramClient = telegramClient;
  }

  async handleIncomingMessage(messageData) {
    // Implementar lógica do Telegram
  }
}
```

### Adicionar nova tool

```javascript
// No LiviaAgent.js
this.registerTool(
  "minha_tool",
  async (userId, params) => {
    // Implementar lógica
  },
  "Descrição da tool"
);
```

## 📊 Benefícios da Nova Arquitetura

1. **Modularidade**: Componentes desacoplados e reutilizáveis
2. **Escalabilidade**: Fácil adicionar novos agentes e canais
3. **Inteligência**: Memória persistente e aprendizado contínuo
4. **Flexibilidade**: Configuração por agente, não hardcoded
5. **Manutenibilidade**: Código organizado e testável

## 🔄 Migração Gradual

A nova arquitetura pode coexistir com o código antigo:

1. **Fase 1**: Implementar nova infraestrutura (✅ Concluído)
2. **Fase 2**: Testar em ambiente de desenvolvimento
3. **Fase 3**: Migrar gradualmente usuários
4. **Fase 4**: Desativar código antigo

## 📝 Próximos Passos

- [ ] Adicionar testes unitários
- [ ] Implementar function calling nativo do Gemini
- [ ] Adicionar suporte a múltiplos agentes simultâneos
- [ ] Criar dashboard de monitoramento
- [ ] Implementar A/B testing entre agentes

## 🐛 Troubleshooting

### Erro: "GOOGLE_AI_API_KEY não configurada"
- Verifique se a variável de ambiente está definida
- Obtenha chave em: https://makersuite.google.com/app/apikey

### Erro: "Canal WhatsApp não encontrado"
- Certifique-se de registrar o canal antes de usar
- Use `aiInfra.registerChannel("whatsapp", channel)`

### Respostas muito longas
- Ajuste `_optimizeChunksForLivia` em `LiviaAgent.js`
- Modifique limites de caracteres por chunk

## 📚 Referências

- [Google Gemini API](https://ai.google.dev/)
- [Agent Development Kit Concepts](https://ai.google.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
