/**
 * =========================================
 * ORCHESTRATOR - ORQUESTRAÇÃO DE AGENTES
 * =========================================
 * 
 * Responsável por:
 * - Decidir quando o agente deve agir
 * - Gerenciar fluxo de decisões
 * - Evitar loops e perguntas repetitivas
 * - Coordenar múltiplos agentes (futuro)
 */

const logger = require("../utils/logger");

class Orchestrator {
  constructor(agent, memoryManager) {
    this.agent = agent;
    this.memoryManager = memoryManager;
    this.decisionHistory = new Map(); // Histórico de decisões por usuário
  }

  /**
   * Orquestra o processamento de uma mensagem
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} Decisão e resposta
   */
  async orchestrate(userId, message, context = {}) {
    try {
      // 1. Analisar intenção e contexto
      const analysis = await this._analyzeMessage(userId, message, context);

      // 2. Decidir ação
      const decision = await this._decideAction(userId, message, analysis);

      // 3. Executar ação
      const result = await this._executeAction(userId, message, decision, context);

      // 4. Registrar decisão
      this._recordDecision(userId, decision, result);

      return result;
    } catch (error) {
      logger.error("[Orchestrator] Erro na orquestração:", error);
      throw error;
    }
  }

  /**
   * Analisa mensagem para entender contexto
   */
  async _analyzeMessage(userId, message, context) {
    const userMemory = await this.memoryManager.getUserMemory(userId);
    const conversationContext = await this.memoryManager.getConversationContext(userId, 5);

    // Detectar intenção básica
    const intent = this._detectIntent(message);
    
    // Verificar se é resposta a pergunta anterior
    const isResponse = this._isResponseToQuestion(message, conversationContext);

    // Verificar se precisa de mais informações
    const needsInfo = this._needsMoreInfo(message, conversationContext);

    return {
      intent,
      isResponse,
      needsInfo,
      userMemory,
      conversationContext,
    };
  }

  /**
   * Decide qual ação tomar
   */
  async _decideAction(userId, message, analysis) {
    const { intent, isResponse, needsInfo, conversationContext } = analysis;

    // Evitar perguntas repetitivas
    const recentQuestions = this._getRecentQuestions(userId);
    const shouldAsk = !this._isRecentQuestion(message, recentQuestions);

    // Decidir tipo de ação
    let actionType = "respond";

    if (isResponse) {
      actionType = "acknowledge_and_continue";
    } else if (needsInfo && shouldAsk) {
      actionType = "ask_clarification";
    } else if (intent === "greeting" && conversationContext.length === 0) {
      actionType = "onboarding";
    } else if (intent === "symptom_report") {
      actionType = "empathize_and_explore";
    } else {
      actionType = "conversational_response";
    }

    return {
      type: actionType,
      shouldUseTools: this._shouldUseTools(intent, analysis),
      priority: this._calculatePriority(intent, analysis),
    };
  }

  /**
   * Executa a ação decidida
   */
  async _executeAction(userId, message, decision, context) {
    // Adicionar contexto da decisão
    context.decision = decision;
    context.orchestrator = {
      shouldAsk: decision.type.includes("ask"),
      priority: decision.priority,
    };

    // Processar com o agente
    const response = await this.agent.processMessage(userId, message, context);

    return {
      ...response,
      decision: decision.type,
      metadata: {
        ...response.metadata,
        orchestrated: true,
        decisionType: decision.type,
      },
    };
  }

  /**
   * Detecta intenção básica da mensagem
   */
  _detectIntent(message) {
    const text = message.toLowerCase();

    if (text.match(/^(oi|olá|bom dia|boa tarde|boa noite)/i)) {
      return "greeting";
    }
    if (text.includes("dor") || text.includes("doendo") || text.includes("machuca")) {
      return "symptom_report";
    }
    if (text.includes("ajuda") || text.includes("não sei") || text.includes("como")) {
      return "help_request";
    }
    if (text.includes("obrigad") || text.includes("valeu")) {
      return "gratitude";
    }
    if (text.match(/^(sim|não|talvez)/i)) {
      return "yes_no_response";
    }

    return "general";
  }

  /**
   * Verifica se é resposta a pergunta anterior
   */
  _isResponseToQuestion(message, conversationContext) {
    if (conversationContext.length === 0) {
      return false;
    }

    const lastMessage = conversationContext[conversationContext.length - 1];
    const isQuestion = lastMessage.content.includes("?");
    const isShortResponse = message.length < 50;
    const isYesNo = /^(sim|não|talvez|claro|nunca)/i.test(message);

    return isQuestion && (isShortResponse || isYesNo);
  }

  /**
   * Verifica se precisa de mais informações
   */
  _needsMoreInfo(message, conversationContext) {
    // Se a mensagem é muito curta e não é resposta direta
    if (message.length < 10 && !/^(sim|não|ok)/i.test(message)) {
      return true;
    }

    // Se menciona sintoma mas sem detalhes
    if (message.includes("dor") && message.length < 30) {
      return true;
    }

    return false;
  }

  /**
   * Verifica se deve usar tools
   */
  _shouldUseTools(intent, analysis) {
    // Usar tools para buscar histórico se necessário
    if (intent === "symptom_report" || intent === "help_request") {
      return true;
    }

    // Usar tools para detectar padrões periodicamente
    const lastPatternCheck = this._getLastPatternCheck(analysis.userMemory);
    const daysSinceCheck = (Date.now() - new Date(lastPatternCheck || 0)) / (1000 * 60 * 60 * 24);
    
    if (daysSinceCheck > 7) {
      return true;
    }

    return false;
  }

  /**
   * Calcula prioridade da resposta
   */
  _calculatePriority(intent, analysis) {
    if (intent === "symptom_report") {
      return "high";
    }
    if (intent === "help_request") {
      return "high";
    }
    if (analysis.userMemory.engagementLevel < 0.3) {
      return "high"; // Usuário novo precisa de atenção
    }

    return "normal";
  }

  /**
   * Obtém perguntas recentes do usuário
   */
  _getRecentQuestions(userId) {
    const history = this.decisionHistory.get(userId) || [];
    return history
      .filter((d) => d.decision.includes("ask"))
      .slice(-5)
      .map((d) => d.message);
  }

  /**
   * Verifica se é pergunta recente
   */
  _isRecentQuestion(message, recentQuestions) {
    return recentQuestions.some((q) => {
      const similarity = this._calculateSimilarity(message.toLowerCase(), q.toLowerCase());
      return similarity > 0.7;
    });
  }

  /**
   * Calcula similaridade simples entre strings
   */
  _calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this._levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calcula distância de Levenshtein
   */
  _levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Obtém última verificação de padrões
   */
  _getLastPatternCheck(userMemory) {
    if (!userMemory.patterns || userMemory.patterns.length === 0) {
      return null;
    }

    // Assumindo que padrões têm timestamp
    return userMemory.patterns[0].detected_at || null;
  }

  /**
   * Registra decisão no histórico
   */
  _recordDecision(userId, decision, result) {
    const history = this.decisionHistory.get(userId) || [];
    
    history.push({
      decision: decision.type,
      timestamp: new Date().toISOString(),
      result: result.type,
    });

    // Manter apenas últimas 20 decisões
    if (history.length > 20) {
      history.shift();
    }

    this.decisionHistory.set(userId, history);
  }
}

module.exports = Orchestrator;
