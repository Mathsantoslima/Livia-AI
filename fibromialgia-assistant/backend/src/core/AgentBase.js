/**
 * =========================================
 * CORE DE IA - AGENT BASE
 * =========================================
 *
 * Classe base para agentes inteligentes usando Google Gemini API
 * Implementa o conceito de Agent Development Kit (ADK)
 *
 * Responsabilidades:
 * - Raciocínio e decisão de próxima ação
 * - Uso de ferramentas (tools)
 * - Gestão de contexto
 * - Orquestração de fluxo
 */

const ProviderManager = require("./providers/ProviderManager");
const logger = require("../utils/logger");

class AgentBase {
  constructor(config = {}) {
    // Provider Manager - Gerencia múltiplos providers (Gemini, ChatGPT, Claude)
    this.providerManager =
      config.providerManager || new ProviderManager(config.providers || {});
    this.preferredProvider = config.preferredProvider || null; // Provider preferido (opcional)

    // Configuração do agente
    this.name = config.name || "Agent";
    this.persona = config.persona || "";
    this.restrictions = config.restrictions || [];
    this.objectives = config.objectives || [];
    this.conversationRules = config.conversationRules || [];

    // Tools disponíveis
    this.tools = new Map();

    // Memória
    this.memoryManager = config.memoryManager || null;

    // Estado da conversa
    this.conversationContext = new Map();
  }

  /**
   * Registra uma tool para o agente
   * @param {string} name - Nome da tool
   * @param {Function} handler - Função que executa a tool
   * @param {string} description - Descrição da tool para o modelo
   * @param {Object} schema - Schema JSON para a tool
   */
  registerTool(name, handler, description, schema = null) {
    this.tools.set(name, {
      handler,
      description,
      schema: schema || this._generateToolSchema(name, description),
    });
    logger.info(`Tool registrada: ${name}`);
  }

  /**
   * Gera schema básico para tool
   */
  _generateToolSchema(name, description) {
    return {
      name,
      description,
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    };
  }

  /**
   * Processa uma mensagem do usuário
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} Resposta do agente
   */
  async processMessage(userId, message, context = {}) {
    try {
      logger.info(`[${this.name}] Processando mensagem de ${userId}`);

      // 1. Carregar contexto da conversa
      const conversationContext = await this._loadConversationContext(userId);

      // 2. Carregar memória do usuário
      const userMemory = await this._loadUserMemory(userId);

      // 3. Construir prompt do sistema
      const systemPrompt = this._buildSystemPrompt(userMemory, context);

      // 4. Construir histórico de mensagens
      const messages = this._buildMessageHistory(conversationContext, message);

      // 5. Preparar tools para o modelo
      const toolsConfig = this._prepareToolsConfig();

      // 6. Chamar modelo com function calling
      const response = await this._callModel(
        systemPrompt,
        messages,
        toolsConfig
      );

      // 7. Processar resposta e executar tools se necessário
      const result = await this._processResponse(
        response,
        userId,
        message,
        context
      );

      // 8. Salvar contexto atualizado
      await this._saveConversationContext(userId, message, result);

      return result;
    } catch (error) {
      logger.error(`[${this.name}] Erro ao processar mensagem:`, error);
      return {
        text: "Desculpe, tive um problema técnico. Pode repetir?",
        type: "error",
        error: error.message,
      };
    }
  }

  /**
   * Carrega contexto da conversa do usuário
   */
  async _loadConversationContext(userId) {
    if (this.conversationContext.has(userId)) {
      return this.conversationContext.get(userId);
    }

    // Carregar do banco de dados se memoryManager disponível
    if (this.memoryManager) {
      const context = await this.memoryManager.getConversationContext(userId);
      this.conversationContext.set(userId, context);
      return context;
    }

    return [];
  }

  /**
   * Carrega memória do usuário (individual)
   */
  async _loadUserMemory(userId) {
    if (this.memoryManager) {
      return await this.memoryManager.getUserMemory(userId);
    }
    return {};
  }

  /**
   * Constrói prompt do sistema com persona, regras e objetivos
   */
  _buildSystemPrompt(userMemory, context) {
    let prompt = "";

    // Persona
    if (this.persona) {
      prompt += `Você é ${this.name}. ${this.persona}\n\n`;
    }

    // Objetivos
    if (this.objectives.length > 0) {
      prompt += "OBJETIVOS:\n";
      this.objectives.forEach((obj, i) => {
        prompt += `${i + 1}. ${obj}\n`;
      });
      prompt += "\n";
    }

    // Restrições
    if (this.restrictions.length > 0) {
      prompt += "RESTRIÇÕES IMPORTANTES:\n";
      this.restrictions.forEach((restriction, i) => {
        prompt += `${i + 1}. ${restriction}\n`;
      });
      prompt += "\n";
    }

    // Regras de conversa
    if (this.conversationRules.length > 0) {
      prompt += "REGRAS DE CONVERSA:\n";
      this.conversationRules.forEach((rule, i) => {
        prompt += `${i + 1}. ${rule}\n`;
      });
      prompt += "\n";
    }

    // Memória do usuário (expandida)
    if (userMemory && Object.keys(userMemory).length > 0) {
      prompt += "MEMÓRIA DO USUÁRIO:\n";
      if (userMemory.name) {
        prompt += `- Nome: ${userMemory.name}\n`;
      }
      if (userMemory.preferences) {
        prompt += `- Preferências: ${JSON.stringify(userMemory.preferences)}\n`;
      }
      if (userMemory.patterns && userMemory.patterns.length > 0) {
        prompt += `- Padrões identificados: ${userMemory.patterns
          .map((p) => p.description)
          .join(", ")}\n`;
      }
      if (userMemory.summary) {
        prompt += `- Resumo do histórico: ${userMemory.summary}\n`;
      }
      
      // Rotina e hábitos
      if (userMemory.dailyRoutine && Object.keys(userMemory.dailyRoutine).length > 0) {
        prompt += `- Rotina diária: ${JSON.stringify(userMemory.dailyRoutine)}\n`;
      }
      if (userMemory.habits && Object.keys(userMemory.habits).length > 0) {
        prompt += `- Hábitos: sono ${userMemory.habits.sleep?.averageHours || "?"}h, trabalho ${userMemory.habits.work?.hoursPerDay || "?"}h/dia\n`;
      }
      
      // Sintomas e gatilhos
      if (userMemory.recurringSymptoms && userMemory.recurringSymptoms.length > 0) {
        prompt += `- Sintomas recorrentes: ${userMemory.recurringSymptoms.join(", ")}\n`;
      }
      if (userMemory.perceivedTriggers && userMemory.perceivedTriggers.length > 0) {
        prompt += `- Gatilhos percebidos: ${userMemory.perceivedTriggers.join(", ")}\n`;
      }
      
      // Estratégias
      if (userMemory.strategiesThatWorked && userMemory.strategiesThatWorked.length > 0) {
        prompt += `- Estratégias que funcionaram: ${userMemory.strategiesThatWorked.join(", ")}\n`;
      }
      
      prompt += "\n";
    }
    
    // Eventos passados (para referências)
    if (context.pastEvents && context.pastEvents.length > 0) {
      prompt += "EVENTOS RECENTES (para referenciar naturalmente):\n";
      context.pastEvents.forEach((event, i) => {
        const date = event.timestamp ? new Date(event.timestamp).toLocaleDateString("pt-BR") : "recentemente";
        prompt += `${i + 1}. ${date}: ${event.content}\n`;
      });
      prompt += "\n";
    }
    
    // Contexto de rotina
    if (context.routineContext) {
      const routine = context.routineContext;
      if (routine.sleep?.hours || routine.work?.hours) {
        prompt += "CONTEXTO DE ROTINA:\n";
        if (routine.sleep?.hours) {
          prompt += `- Sono: ${routine.sleep.hours}h/dia, qualidade: ${routine.sleep.quality || "?"}\n`;
        }
        if (routine.work?.hours) {
          prompt += `- Trabalho: ${routine.work.hours}h/dia, estresse: ${routine.work.stressLevel || "?"}\n`;
        }
        if (routine.physicalActivity?.level) {
          prompt += `- Atividade física: ${routine.physicalActivity.level}, frequência: ${routine.physicalActivity.frequency || "?"}\n`;
        }
        if (routine.mentalActivity?.level) {
          prompt += `- Esforço mental: ${routine.mentalActivity.level}\n`;
        }
        prompt += "\n";
      }
    }
    
    // Contexto preditivo
    if (context.predictiveContext && context.predictiveContext.today) {
      const today = context.predictiveContext.today;
      if (today.predictions && today.predictions.length > 0) {
        prompt += "PREVISÕES PARA HOJE (use com probabilidades, não certezas):\n";
        today.predictions.forEach((pred, i) => {
          prompt += `${i + 1}. ${pred.message}: ${pred.impact} (probabilidade: ${Math.round(pred.probability * 100)}%)\n`;
        });
        if (today.suggestions && today.suggestions.length > 0) {
          prompt += `Sugestões: ${today.suggestions.join(", ")}\n`;
        }
        prompt += "\n";
      }
    }

    // Contexto adicional
    if (context.globalInsights && context.globalInsights.length > 0) {
      prompt += "INSIGHTS COLETIVOS (aprendizado de outros usuários):\n";
      context.globalInsights.forEach((insight, i) => {
        prompt += `${i + 1}. ${insight.title}: ${insight.description}\n`;
      });
      prompt += "\n";
    }

    // Instruções sobre tools
    if (this.tools.size > 0) {
      prompt += "FERRAMENTAS DISPONÍVEIS:\n";
      this.tools.forEach((tool, name) => {
        prompt += `- ${name}: ${tool.description}\n`;
      });
      prompt += "\n";
      prompt +=
        "Use as ferramentas quando necessário para buscar informações ou realizar ações.\n";
    }

    // Informações sobre provider (se múltiplos disponíveis)
    const availableProviders = this.providerManager.listProviders();
    if (availableProviders.length > 1) {
      prompt += `\nVocê tem acesso a múltiplos modelos de IA: ${availableProviders.join(
        ", "
      )}.\n`;
      prompt +=
        "O sistema escolherá automaticamente o melhor modelo para sua resposta.\n";
    }

    return prompt;
  }

  /**
   * Constrói histórico de mensagens
   */
  _buildMessageHistory(conversationContext, currentMessage) {
    const messages = [];

    // Adicionar histórico recente (últimas 10 mensagens)
    const recentContext = conversationContext.slice(-10);
    recentContext.forEach((msg) => {
      messages.push({
        role: msg.role || "user",
        parts: [{ text: msg.content }],
      });
    });

    // Adicionar mensagem atual
    messages.push({
      role: "user",
      parts: [{ text: currentMessage }],
    });

    return messages;
  }

  /**
   * Prepara configuração de tools para o modelo
   */
  _prepareToolsConfig() {
    if (this.tools.size === 0) {
      return null;
    }

    // Gemini usa function calling diferente, vamos usar o approach de instruções
    // Por enquanto, retornamos null e processamos tools manualmente
    return null;
  }

  /**
   * Chama o modelo usando ProviderManager
   */
  async _callModel(systemPrompt, messages, toolsConfig) {
    try {
      // Converter mensagens para formato do ProviderManager
      const formattedMessages = messages.map((msg) => ({
        role: msg.role || "user",
        content: msg.parts?.[0]?.text || msg.content || msg.text || "",
      }));

      // Opções de geração
      const options = {
        temperature: 0.7,
        maxTokens: 1000,
      };

      // Chamar provider manager (com fallback automático)
      const response = await this.providerManager.generate(
        systemPrompt,
        formattedMessages,
        options,
        this.preferredProvider
      );

      return {
        text: response.text,
        raw: response.raw,
        providerUsed: response.providerUsed,
        fallbackUsed: response.fallbackUsed,
        usage: response.usage,
      };
    } catch (error) {
      logger.error(`[${this.name}] Erro ao chamar modelo:`, error);
      throw error;
    }
  }

  /**
   * Processa resposta do modelo e executa tools se necessário
   */
  async _processResponse(response, userId, userMessage, context) {
    const responseText = response.text;

    // Verificar se a resposta menciona necessidade de usar tools
    // Por enquanto, processamos tools de forma manual baseado em keywords
    // Em uma implementação mais avançada, usaríamos function calling do Gemini

    // Detectar se precisa buscar informações
    const needsHistory = this._detectToolNeed(responseText, "buscar_historico");
    const needsPatterns = this._detectToolNeed(
      responseText,
      "detectar_padroes"
    );
    const needsSave = this._detectToolNeed(responseText, "salvar_evento");

    // Executar tools se necessário
    if (needsHistory && this.tools.has("buscar_historico")) {
      const tool = this.tools.get("buscar_historico");
      const history = await tool.handler(userId);

      // Se a tool retornou dados importantes, podemos regenerar resposta
      if (history && history.length > 0) {
        // Por enquanto, apenas logamos
        logger.info(
          `[${this.name}] Histórico carregado: ${history.length} mensagens`
        );
      }
    }

    if (needsPatterns && this.tools.has("detectar_padroes")) {
      const tool = this.tools.get("detectar_padroes");
      const patterns = await tool.handler(userId);

      if (patterns && patterns.length > 0) {
        logger.info(`[${this.name}] Padrões detectados: ${patterns.length}`);
      }
    }

    // Sempre salvar evento da conversa
    if (this.tools.has("salvar_evento")) {
      const tool = this.tools.get("salvar_evento");
      await tool.handler(userId, userMessage, responseText, context);
    }

    // Quebrar resposta em blocos se necessário
    const chunks = this._chunkResponse(responseText);

    return {
      text: responseText,
      chunks,
      type: "text",
      toolsUsed: [],
      metadata: {
        provider: response.providerUsed || "unknown",
        model: response.providerUsed || "unknown",
        fallbackUsed: response.fallbackUsed || false,
        usage: response.usage || {},
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Detecta se precisa usar uma tool específica
   */
  _detectToolNeed(responseText, toolName) {
    // Por enquanto, detecção simples baseada em keywords
    // Em produção, isso seria mais sofisticado
    const keywords = {
      buscar_historico: ["histórico", "anterior", "passado", "lembrar"],
      detectar_padroes: ["padrão", "tendência", "análise"],
      salvar_evento: ["salvar", "anotar", "registrar"],
    };

    const toolKeywords = keywords[toolName] || [];
    return toolKeywords.some((keyword) =>
      responseText.toLowerCase().includes(keyword)
    );
  }

  /**
   * Quebra resposta em chunks menores (para mensagens curtas)
   */
  _chunkResponse(text) {
    // Quebrar por parágrafos ou frases
    const sentences = text.split(/[.!?]\s+/).filter((s) => s.trim().length > 0);

    // Agrupar em chunks de 1-2 frases
    const chunks = [];
    let currentChunk = "";

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length < 150) {
        currentChunk += (currentChunk ? ". " : "") + sentence;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // Se não conseguiu quebrar, retorna o texto inteiro
    return chunks.length > 0 ? chunks : [text];
  }

  /**
   * Salva contexto da conversa
   */
  async _saveConversationContext(userId, userMessage, agentResponse) {
    const context = this.conversationContext.get(userId) || [];

    context.push({
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    context.push({
      role: "assistant",
      content: agentResponse.text,
      timestamp: new Date().toISOString(),
    });

    // Manter apenas últimas 20 mensagens em memória
    if (context.length > 20) {
      context.shift();
    }

    this.conversationContext.set(userId, context);

    // Salvar no banco se memoryManager disponível
    if (this.memoryManager) {
      await this.memoryManager.saveConversationContext(userId, context);
    }
  }

  /**
   * Limpa contexto de um usuário
   */
  clearContext(userId) {
    this.conversationContext.delete(userId);
    logger.info(`[${this.name}] Contexto limpo para ${userId}`);
  }
}

module.exports = AgentBase;
