# 🎯 Guia Rápido de Migração - Infraestrutura de IA

## ✅ O que foi criado

Uma infraestrutura completa de IA baseada em agentes usando Google Gemini API, totalmente modular e extensível.

## 📁 Estrutura Criada

```
backend/src/
├── core/                          # Core reutilizável
│   ├── AgentBase.js              # Classe base para agentes
│   ├── MemoryManager.js          # Memória individual + global
│   ├── Orchestrator.js            # Orquestração de decisões
│   └── tools/                    # Ferramentas do agente
│       └── index.js
├── agents/                        # Agentes específicos
│   └── LiviaAgent.js             # Agente Livia configurado
├── channels/                      # Canais de comunicação
│   └── WhatsAppChannel.js        # Adaptador WhatsApp
└── ai-infra/                     # Infraestrutura principal
    ├── index.js                  # Entry point
    ├── integration-example.js    # Exemplos de integração
    └── server-integration.js     # Integração com servidor
```

## 🚀 Como Usar

### 1. Instalar dependência

```bash
cd fibromialgia-assistant/backend
npm install @google/generative-ai
```

### 2. Configurar variáveis de ambiente

Adicione ao seu `.env`:

```env
GOOGLE_AI_API_KEY=sua-chave-google-ai
GEMINI_MODEL=gemini-1.5-pro
```

Obtenha a chave em: https://makersuite.google.com/app/apikey

### 3. Usar no código existente

#### Opção A: Integração com servidor Baileys existente

```javascript
const { initializeAIInfrastructure } = require('./src/ai-infra/integration-example');

// Após conectar WhatsApp
const aiInfra = initializeAIInfrastructure(sock);

// Mensagens serão processadas automaticamente
sock.ev.on("messages.upsert", async (m) => {
  if (m.type === "notify" && aiInfra) {
    for (const msg of m.messages) {
      const channel = aiInfra.getChannel("whatsapp");
      await channel.handleIncomingMessage(msg);
    }
  }
});
```

#### Opção B: Processar mensagem diretamente

```javascript
const { getAIInfrastructure } = require('./src/ai-infra');

const aiInfra = getAIInfrastructure();

const response = await aiInfra.processMessage(
  "5511999999999", // userId
  "Oi, estou com dor hoje", // mensagem
  { channel: "whatsapp" } // contexto
);

console.log(response.text); // Resposta
console.log(response.chunks); // Resposta quebrada
```

#### Opção C: Usar servidor de exemplo completo

```bash
node src/ai-infra/server-integration.js
```

## 🧠 Como Funciona

### Fluxo de uma Mensagem

1. **WhatsApp recebe mensagem** → `WhatsAppChannel`
2. **Canal extrai dados** → telefone, texto, timestamp
3. **Orchestrator analisa** → intenção, contexto, decisão
4. **LiviaAgent processa** → Google Gemini + Tools
5. **MemoryManager atualiza** → memória individual e global
6. **Resposta quebrada** → chunks curtos e naturais
7. **WhatsApp envia** → com delays simulando digitação

### Memória

- **Individual**: Nome, preferências, padrões, histórico resumido
- **Global**: Insights coletivos, padrões agregados (sem dados pessoais)

### Tools Disponíveis

- `buscar_historico`: Busca histórico de conversas
- `salvar_evento`: Salva conversa no banco
- `detectar_padroes`: Analisa padrões do usuário
- `gerar_resumo_diario`: Gera resumo do dia
- `sugerir_acoes`: Sugere ações baseadas em evidências

## 🔧 Personalização

### Modificar persona da Livia

Edite `src/agents/LiviaAgent.js`:

```javascript
persona: `Sua nova persona aqui...`
```

### Adicionar nova tool

Em `LiviaAgent.js`:

```javascript
this.registerTool(
  "minha_tool",
  async (userId, params) => {
    // Sua lógica aqui
  },
  "Descrição da tool"
);
```

### Criar novo agente

```javascript
const AgentBase = require('./src/core/AgentBase');

class MeuAgente extends AgentBase {
  constructor() {
    super({
      name: "MeuAgente",
      persona: "Você é...",
      objectives: ["Objetivo 1"],
      restrictions: ["Restrição 1"],
    });
  }
}
```

## 📊 Diferenças da Arquitetura Antiga

| Antes | Agora |
|-------|-------|
| Lógica hardcoded | Configuração por agente |
| Código acoplado | Componentes desacoplados |
| Sem memória persistente | Memória individual + global |
| Sem orquestração | Decisões inteligentes |
| Difícil de estender | Fácil adicionar agentes/canais |

## 🐛 Troubleshooting

### "GOOGLE_AI_API_KEY não configurada"
- Verifique `.env` ou variáveis de ambiente
- Obtenha chave em: https://makersuite.google.com/app/apikey

### "Canal WhatsApp não encontrado"
- Certifique-se de chamar `initializeAIInfrastructure(whatsappClient)`
- O cliente WhatsApp deve ser passado como parâmetro

### Respostas muito longas
- Ajuste `_optimizeChunksForLivia` em `LiviaAgent.js`
- Modifique limites de caracteres

## 📚 Documentação Completa

Veja `MIGRACAO_GOOGLE_ADK.md` para documentação detalhada.

## 🎉 Próximos Passos

1. Testar em desenvolvimento
2. Configurar variáveis de ambiente
3. Integrar gradualmente
4. Monitorar performance
5. Adicionar novos agentes conforme necessário
