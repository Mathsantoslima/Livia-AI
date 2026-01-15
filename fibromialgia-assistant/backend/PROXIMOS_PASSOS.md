# Próximos Passos - Fazer o Agente Funcionar

## Estado Atual

✅ **Infraestrutura de agentes criada:**

- LiviaAgent (agente especializado)
- AgentBase (core de agentes)
- MemoryManager (gerenciamento de memória)
- Orchestrator (orquestração)
- ProviderManager (múltiplos providers: Gemini, ChatGPT, Claude)
- CostTracker (rastreamento de custos)

✅ **Canal WhatsApp criado:**

- WhatsAppChannel (adaptador desacoplado)

✅ **Sistema existente:**

- Servidor Baileys (whatsapp-baileys-api/server.js)
- Servidor Backend (backend/src/index.js)
- Supabase configurado

## Passos Necessários

### 1. Configurar Variáveis de Ambiente

Criar/atualizar arquivo `.env` no diretório `backend/`:

```env
# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase
SUPABASE_SERVICE_KEY=sua_service_key

# Google Gemini
GOOGLE_AI_API_KEY=sua_chave_google_ai
GEMINI_MODEL=gemini-1.5-pro

# OpenAI ChatGPT
OPENAI_API_KEY=sua_chave_openai
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude
CLAUDE_API_KEY=sua_chave_claude
CLAUDE_MODEL=claude-3-sonnet-20240229

# JWT
JWT_SECRET=seu_secret_jwt

# Assistente
ASSISTANT_PHONE_NUMBER=(11) 93618-8540
ASSISTANT_PHONE_NUMBER_RAW=5511936188540
```

### 2. Integrar Servidor Baileys com Agentes

**Opção A: Integrar no servidor Baileys existente** (recomendado)

Modificar `whatsapp-baileys-api/server.js` para usar a infraestrutura de agentes:

```javascript
// Adicionar no início do arquivo
const { getAIInfrastructure } = require("../backend/src/ai-infra");
const WhatsAppChannel = require("../backend/src/channels/WhatsAppChannel");

// Inicializar infraestrutura de IA
let aiInfra = null;
let whatsappChannel = null;

// Após conectar WhatsApp (connection === "open")
if (!aiInfra) {
  aiInfra = getAIInfrastructure();
  const liviaAgent = aiInfra.getAgent("Livia");
  whatsappChannel = new WhatsAppChannel(liviaAgent, sock);
  aiInfra.registerChannel("whatsapp", whatsappChannel);
}

// Substituir processamento de mensagens por:
sock.ev.on("messages.upsert", async (m) => {
  if (m.type === "notify") {
    for (const msg of m.messages) {
      if (!msg.key.fromMe && msg.message) {
        // Processar via canal WhatsApp
        if (whatsappChannel) {
          await whatsappChannel.handleIncomingMessage(msg);
        }
      }
    }
  }
});
```

**Opção B: Usar servidor de integração** (backend/src/ai-infra/server-integration.js)

O arquivo `server-integration.js` já existe como exemplo, mas precisa ser integrado ao fluxo principal.

### 3. Verificar Estrutura do Banco de Dados

Verificar se as tabelas necessárias existem no Supabase.

**📄 Documento completo:** `VERIFICACAO_BANCO_DADOS.md`

**Tabelas obrigatórias (sistema não funciona sem elas):**

- `users_livia` - Dados dos usuários
- `conversations_livia` - Histórico de conversas

**Tabelas recomendadas (funcionalidades avançadas):**

- `user_patterns` - Padrões detectados por usuário
- `daily_check_ins` - Check-ins diários

**Tabelas opcionais (funcionalidades extras):**

- `collective_insights` - Insights coletivos
- `global_patterns` - Padrões globais
- `agent_metrics` - Métricas de agentes (já tem migration)

**Como verificar:**

1. Acesse o Supabase Dashboard
2. Navegue para "Table Editor"
3. Verifique se as tabelas listadas existem
4. Execute SQL de verificação (disponível no documento completo)

### 4. Testar Providers de IA

Executar teste dos providers:

```bash
cd backend
node src/ai-infra/test-providers.js
```

Verificar se todos os providers estão funcionando corretamente.

### 5. Iniciar o Sistema

**Passo 1: Iniciar servidor backend**

```bash
cd backend
npm install  # Se necessário
npm start
```

**Passo 2: Iniciar servidor WhatsApp Baileys**

```bash
cd whatsapp-baileys-api
npm install  # Se necessário
node server.js
```

**Passo 3: Conectar WhatsApp**

- Escanear QR Code no terminal
- Aguardar conexão
- Verificar logs de inicialização do agente

### 6. Testar Funcionalidade

1. Enviar mensagem de teste via WhatsApp para o número conectado
2. Verificar se a mensagem é recebida
3. Verificar se o agente processa e responde
4. Verificar logs para erros

### 7. Monitorar e Ajustar

- Verificar logs do sistema
- Monitorar custos dos providers (via dashboard)
- Ajustar configurações conforme necessário

## Checklist de Integração

- [ ] Variáveis de ambiente configuradas
- [ ] Providers de IA testados e funcionando
- [ ] Banco de dados verificado/configurado
- [ ] Servidor Baileys integrado com agentes
- [ ] WhatsApp conectado e funcionando
- [ ] Testes básicos realizados
- [ ] Logs monitorados
- [ ] Dashboard de métricas acessível

## Possíveis Problemas e Soluções

### Problema: "Provider não encontrado"

**Solução:** Verificar se as chaves de API estão configuradas corretamente no `.env`

### Problema: "Cliente WhatsApp não configurado"

**Solução:** Verificar se o cliente Baileys está sendo passado corretamente para WhatsAppChannel

### Problema: "Erro ao salvar no Supabase"

**Solução:** Verificar credenciais do Supabase e estrutura das tabelas

### Problema: "Agent não responde"

**Solução:** Verificar logs, testar providers individualmente, verificar se a mensagem está chegando ao agente

## Arquivos de Referência

- `backend/src/ai-infra/index.js` - Infraestrutura principal
- `backend/src/ai-infra/integration-example.js` - Exemplo de integração
- `backend/src/ai-infra/server-integration.js` - Servidor de integração
- `backend/src/channels/WhatsAppChannel.js` - Canal WhatsApp
- `backend/src/agents/LiviaAgent.js` - Agente Livia
- `whatsapp-baileys-api/server.js` - Servidor WhatsApp Baileys
