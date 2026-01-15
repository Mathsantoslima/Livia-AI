/**
 * =========================================
 * PROVIDER MANAGER - GERENCIA MÚLTIPLOS PROVIDERS
 * =========================================
 * 
 * Gerencia múltiplos providers de IA com:
 * - Fallback automático
 * - Load balancing
 * - Seleção por estratégia
 * - Health checks
 */

const GeminiProvider = require("./GeminiProvider");
const ChatGPTProvider = require("./ChatGPTProvider");
const ClaudeProvider = require("./ClaudeProvider");
const CostTracker = require("./CostTracker");
const logger = require("../../utils/logger");

class ProviderManager {
  constructor(config = {}) {
    this.providers = new Map();
    this.defaultProvider = config.defaultProvider || "gemini";
    this.fallbackOrder = config.fallbackOrder || ["gemini", "chatgpt", "claude"];
    this.strategy = config.strategy || "fallback"; // fallback, round-robin, best-performance
    
    // Estatísticas
    this.stats = {
      totalRequests: 0,
      successCount: new Map(),
      errorCount: new Map(),
      totalLatency: new Map(),
    };

    // Health status
    this.healthStatus = new Map();

    // Cost tracker
    this.costTracker = new CostTracker();

    // Inicializar providers disponíveis
    this._initializeProviders(config);
  }

  /**
   * Inicializa providers configurados
   */
  _initializeProviders(config) {
    // Gemini
    if (config.gemini !== false && (config.gemini || process.env.GOOGLE_AI_API_KEY)) {
      try {
        const gemini = new GeminiProvider(config.gemini || {});
        this.providers.set("gemini", gemini);
        logger.info("✅ Provider Gemini inicializado");
      } catch (error) {
        logger.warn("⚠️ Gemini não configurado:", error.message);
      }
    }

    // ChatGPT
    if (config.chatgpt !== false && (config.chatgpt || process.env.OPENAI_API_KEY)) {
      try {
        const chatgpt = new ChatGPTProvider(config.chatgpt || {});
        this.providers.set("chatgpt", chatgpt);
        logger.info("✅ Provider ChatGPT inicializado");
      } catch (error) {
        logger.warn("⚠️ ChatGPT não configurado:", error.message);
      }
    }

    // Claude
    if (config.claude !== false && (config.claude || process.env.CLAUDE_API_KEY)) {
      try {
        const claude = new ClaudeProvider(config.claude || {});
        this.providers.set("claude", claude);
        logger.info("✅ Provider Claude inicializado");
      } catch (error) {
        logger.warn("⚠️ Claude não configurado:", error.message);
      }
    }

    if (this.providers.size === 0) {
      throw new Error("Nenhum provider configurado! Configure pelo menos um provider.");
    }

    logger.info(`📊 ${this.providers.size} provider(s) disponível(is): ${Array.from(this.providers.keys()).join(", ")}`);
  }

  /**
   * Gera resposta usando provider selecionado
   * @param {string} systemPrompt - Prompt do sistema
   * @param {Array} messages - Histórico de mensagens
   * @param {Object} options - Opções adicionais
   * @param {string} preferredProvider - Provider preferido (opcional)
   * @returns {Promise<Object>} Resposta do modelo
   */
  async generate(systemPrompt, messages, options = {}, preferredProvider = null) {
    const startTime = Date.now();
    this.stats.totalRequests++;

    try {
      // Selecionar provider
      const providerName = preferredProvider || this._selectProvider();
      const provider = this.providers.get(providerName);

      if (!provider) {
        throw new Error(`Provider ${providerName} não encontrado`);
      }

      // Verificar saúde do provider
      if (!this._isProviderHealthy(providerName)) {
        logger.warn(`[ProviderManager] Provider ${providerName} não está saudável, usando fallback`);
        return await this._generateWithFallback(systemPrompt, messages, options, providerName);
      }

      // Gerar resposta
      const response = await provider.generate(systemPrompt, messages, options);

      // Calcular e rastrear custo
      const cost = this.costTracker.calculateCost(providerName, response.usage || {});
      if (response.usage) {
        this.costTracker.recordCost(providerName, response.usage, cost);
      }

      // Atualizar estatísticas
      this._updateStats(providerName, true, Date.now() - startTime, response.usage);

      return {
        ...response,
        cost,
        providerUsed: providerName,
        fallbackUsed: false,
      };
    } catch (error) {
      // Tentar fallback se erro
      logger.error(`[ProviderManager] Erro com provider:`, error.message);
      return await this._generateWithFallback(systemPrompt, messages, options, preferredProvider);
    }
  }

  /**
   * Gera resposta com fallback automático
   */
  async _generateWithFallback(systemPrompt, messages, options, failedProvider = null) {
    const providersToTry = this.fallbackOrder.filter((p) => p !== failedProvider);

    for (const providerName of providersToTry) {
      const provider = this.providers.get(providerName);
      
      if (!provider || !this._isProviderHealthy(providerName)) {
        continue;
      }

      try {
        logger.info(`[ProviderManager] Tentando fallback com ${providerName}`);
        const startTime = Date.now();
        
        const response = await provider.generate(systemPrompt, messages, options);
        
        // Calcular e rastrear custo
        const cost = this.costTracker.calculateCost(providerName, response.usage || {});
        if (response.usage) {
          this.costTracker.recordCost(providerName, response.usage, cost);
        }

        this._updateStats(providerName, true, Date.now() - startTime, response.usage);
        this._markProviderHealthy(providerName);

        return {
          ...response,
          cost,
          providerUsed: providerName,
          fallbackUsed: true,
          originalProvider: failedProvider,
        };
      } catch (error) {
        logger.warn(`[ProviderManager] Fallback ${providerName} falhou:`, error.message);
        this._updateStats(providerName, false, 0);
        this._markProviderUnhealthy(providerName);
        continue;
      }
    }

    // Se todos falharam
    throw new Error("Todos os providers falharam. Verifique suas configurações.");
  }

  /**
   * Seleciona provider baseado na estratégia
   */
  _selectProvider() {
    switch (this.strategy) {
      case "round-robin":
        return this._selectRoundRobin();
      case "best-performance":
        return this._selectBestPerformance();
      case "fallback":
      default:
        return this.defaultProvider;
    }
  }

  /**
   * Seleção round-robin
   */
  _selectRoundRobin() {
    const availableProviders = Array.from(this.providers.keys());
    if (availableProviders.length === 0) {
      return this.defaultProvider;
    }
    
    // Implementação simples (pode ser melhorada)
    const index = this.stats.totalRequests % availableProviders.length;
    return availableProviders[index];
  }

  /**
   * Seleção por melhor performance
   */
  _selectBestPerformance() {
    let bestProvider = this.defaultProvider;
    let bestScore = -1;

    for (const [name, provider] of this.providers) {
      if (!this._isProviderHealthy(name)) {
        continue;
      }

      const successRate = this._getSuccessRate(name);
      const avgLatency = this._getAvgLatency(name);
      
      // Score baseado em taxa de sucesso e latência
      const score = successRate * (1 - Math.min(avgLatency / 5000, 0.5));

      if (score > bestScore) {
        bestScore = score;
        bestProvider = name;
      }
    }

    return bestProvider;
  }

  /**
   * Verifica se provider está saudável
   */
  _isProviderHealthy(providerName) {
    const status = this.healthStatus.get(providerName);
    if (!status) {
      return true; // Assume saudável se não testado
    }
    return status.isHealthy && (Date.now() - status.lastCheck) < 5 * 60 * 1000; // Cache de 5 minutos
  }

  /**
   * Marca provider como saudável
   */
  _markProviderHealthy(providerName) {
    this.healthStatus.set(providerName, {
      isHealthy: true,
      lastCheck: Date.now(),
    });
  }

  /**
   * Marca provider como não saudável
   */
  _markProviderUnhealthy(providerName) {
    this.healthStatus.set(providerName, {
      isHealthy: false,
      lastCheck: Date.now(),
    });
  }

  /**
   * Atualiza estatísticas
   * @param {string} providerName - Nome do provider
   * @param {boolean} success - Se a requisição foi bem-sucedida
   * @param {number} latency - Latência em milissegundos
   * @param {Object} usage - Uso de tokens (opcional)
   */
  _updateStats(providerName, success, latency, usage = null) {
    if (success) {
      const count = this.stats.successCount.get(providerName) || 0;
      this.stats.successCount.set(providerName, count + 1);
      
      const total = this.stats.totalLatency.get(providerName) || 0;
      this.stats.totalLatency.set(providerName, total + latency);
    } else {
      const count = this.stats.errorCount.get(providerName) || 0;
      this.stats.errorCount.set(providerName, count + 1);
    }
  }

  /**
   * Obtém taxa de sucesso
   */
  _getSuccessRate(providerName) {
    const success = this.stats.successCount.get(providerName) || 0;
    const errors = this.stats.errorCount.get(providerName) || 0;
    const total = success + errors;
    
    return total > 0 ? success / total : 1;
  }

  /**
   * Obtém latência média
   */
  _getAvgLatency(providerName) {
    const success = this.stats.successCount.get(providerName) || 0;
    const totalLatency = this.stats.totalLatency.get(providerName) || 0;
    
    return success > 0 ? totalLatency / success : 0;
  }

  /**
   * Obtém provider específico
   */
  getProvider(name) {
    return this.providers.get(name);
  }

  /**
   * Lista providers disponíveis
   */
  listProviders() {
    return Array.from(this.providers.keys());
  }

  /**
   * Obtém informações de todos os providers
   */
  getProvidersInfo() {
    const info = {};
    for (const [name, provider] of this.providers) {
      info[name] = {
        ...provider.getInfo(),
        healthy: this._isProviderHealthy(name),
        successRate: this._getSuccessRate(name),
        avgLatency: this._getAvgLatency(name),
      };
    }
    return info;
  }

  /**
   * Obtém estatísticas
   */
  getStats() {
    return {
      totalRequests: this.stats.totalRequests,
      providers: this.getProvidersInfo(),
    };
  }

  /**
   * Obtém estatísticas de custo
   * @returns {Object} Estatísticas de custo
   */
  getCostStats() {
    return {
      summary: this.costTracker.getSummary(),
      projected: this.costTracker.getProjectedMonthlyCost(),
      daily: this.costTracker.getCosts("daily"),
      monthly: this.costTracker.getCosts("monthly"),
    };
  }

  /**
   * Testa todos os providers
   */
  async testAllProviders() {
    const results = {};
    
    for (const [name, provider] of this.providers) {
      try {
        const isHealthy = await provider.testConnection();
        results[name] = {
          healthy: isHealthy,
          error: null,
        };
        this._markProviderHealthy(name);
      } catch (error) {
        results[name] = {
          healthy: false,
          error: error.message,
        };
        this._markProviderUnhealthy(name);
      }
    }

    return results;
  }
}

module.exports = ProviderManager;
