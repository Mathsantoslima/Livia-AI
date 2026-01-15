/**
 * =========================================
 * INFRAESTRUTURA DE IA - ENTRY POINT
 * =========================================
 * 
 * Arquivo principal que integra:
 * - Core de IA (AgentBase)
 * - Agentes (LiviaAgent)
 * - Canais (WhatsAppChannel)
 * - Memória (MemoryManager)
 * - Orquestração (Orchestrator)
 * 
 * Este é o ponto de entrada para a nova arquitetura
 */

const LiviaAgent = require("../agents/LiviaAgent");
const MemoryManager = require("../core/MemoryManager");
const Orchestrator = require("../core/Orchestrator");
const WhatsAppChannel = require("../channels/WhatsAppChannel");
const logger = require("../utils/logger");

class AIInfrastructure {
  constructor(config = {}) {
    // Inicializar componentes
    this.memoryManager = new MemoryManager();
    
    // Criar agente Livia com múltiplos providers
    this.agent = new LiviaAgent({
      memoryManager: this.memoryManager,
      providers: config.providers || {
        // Configuração de providers (pode ser personalizada)
        gemini: config.providers?.gemini !== false ? {} : false,
        chatgpt: config.providers?.chatgpt !== false ? {} : false,
        claude: config.providers?.claude !== false ? {} : false,
      },
      preferredProvider: config.preferredProvider || null,
      providerStrategy: config.providerStrategy || "fallback",
      ...config.agent,
    });

    // Criar orquestrador
    this.orchestrator = new Orchestrator(this.agent, this.memoryManager);

    // Canais
    this.channels = new Map();

    logger.info("Infraestrutura de IA inicializada");
  }

  /**
   * Registra um canal (WhatsApp, Telegram, etc)
   * @param {string} name - Nome do canal
   * @param {Object} channel - Instância do canal
   */
  registerChannel(name, channel) {
    this.channels.set(name, channel);
    logger.info(`Canal registrado: ${name}`);
  }

  /**
   * Processa mensagem através do orquestrador
   * @param {string} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @param {Object} context - Contexto adicional
   * @returns {Promise<Object>} Resposta
   */
  async processMessage(userId, message, context = {}) {
    try {
      // Orquestrar processamento
      const result = await this.orchestrator.orchestrate(userId, message, context);

      return result;
    } catch (error) {
      logger.error("[AIInfra] Erro ao processar mensagem:", error);
      throw error;
    }
  }

  /**
   * Obtém agente específico
   * @param {string} agentName - Nome do agente
   * @returns {Object} Agente
   */
  getAgent(agentName = "Livia") {
    if (agentName === "Livia") {
      return this.agent;
    }
    throw new Error(`Agente ${agentName} não encontrado`);
  }

  /**
   * Obtém canal específico
   * @param {string} channelName - Nome do canal
   * @returns {Object} Canal
   */
  getChannel(channelName) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      throw new Error(`Canal ${channelName} não encontrado`);
    }
    return channel;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const health = {
        status: "healthy",
        components: {
          agent: this.agent ? "ok" : "error",
          memoryManager: this.memoryManager ? "ok" : "error",
          orchestrator: this.orchestrator ? "ok" : "error",
          channels: Array.from(this.channels.keys()),
        },
        timestamp: new Date().toISOString(),
      };

      return health;
    } catch (error) {
      logger.error("[AIInfra] Erro no health check:", error);
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

// Singleton instance
let aiInfraInstance = null;

/**
 * Obtém instância singleton da infraestrutura
 */
function getAIInfrastructure(config = {}) {
  if (!aiInfraInstance) {
    aiInfraInstance = new AIInfrastructure(config);
  }
  return aiInfraInstance;
}

module.exports = {
  AIInfrastructure,
  getAIInfrastructure,
};
