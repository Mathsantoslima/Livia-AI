/**
 * =========================================
 * COST TRACKER - RASTREAMENTO DE CUSTOS
 * =========================================
 * 
 * Rastreia custos por provider baseado em uso de tokens
 */

class CostTracker {
  constructor() {
    // Preços por 1M tokens (preços aproximados, atualize conforme necessário)
    this.pricing = {
      gemini: {
        input: 0.125,    // $0.125 por 1M tokens de input
        output: 0.375,   // $0.375 por 1M tokens de output
      },
      chatgpt: {
        input: 0.150,    // $0.150 por 1M tokens de input
        output: 0.600,   // $0.600 por 1M tokens de output
      },
      claude: {
        input: 0.300,    // $0.300 por 1M tokens de input
        output: 1.500,   // $1.500 por 1M tokens de output
      },
    };

    // Estatísticas de custo
    this.costStats = {
      daily: new Map(),
      monthly: new Map(),
      total: new Map(),
    };
  }

  /**
   * Calcula custo de uma requisição
   * @param {string} providerName - Nome do provider
   * @param {Object} usage - Uso de tokens {promptTokens, completionTokens, inputTokens, outputTokens}
   * @returns {number} Custo em dólares
   */
  calculateCost(providerName, usage) {
    const pricing = this.pricing[providerName];
    if (!pricing || !usage) {
      return 0;
    }

    const inputTokens = usage.promptTokens || usage.inputTokens || 0;
    const outputTokens = usage.completionTokens || usage.outputTokens || 0;

    const inputCost = (inputTokens / 1000000) * pricing.input;
    const outputCost = (outputTokens / 1000000) * pricing.output;

    return inputCost + outputCost;
  }

  /**
   * Registra custo de uma requisição
   * @param {string} providerName - Nome do provider
   * @param {Object} usage - Uso de tokens
   * @param {number} cost - Custo calculado
   */
  recordCost(providerName, usage, cost) {
    const date = new Date().toISOString().split("T")[0];

    // Atualizar custo diário
    const dailyKey = `${providerName}_${date}`;
    const dailyCost = this.costStats.daily.get(dailyKey) || 0;
    this.costStats.daily.set(dailyKey, dailyCost + cost);

    // Atualizar custo mensal
    const month = date.substring(0, 7); // YYYY-MM
    const monthlyKey = `${providerName}_${month}`;
    const monthlyCost = this.costStats.monthly.get(monthlyKey) || 0;
    this.costStats.monthly.set(monthlyKey, monthlyCost + cost);

    // Atualizar total
    const totalCost = this.costStats.total.get(providerName) || 0;
    this.costStats.total.set(providerName, totalCost + cost);
  }

  /**
   * Obtém custos por período
   * @param {string} period - Período: 'daily' ou 'monthly'
   * @returns {Object} Custos organizados por provider e data
   */
  getCosts(period = "daily") {
    const stats = this.costStats[period] || new Map();
    const costs = {};

    for (const [key, value] of stats.entries()) {
      const parts = key.split("_");
      const provider = parts[0];
      const date = parts.slice(1).join("_"); // Permite datas com formato YYYY-MM-DD

      if (!costs[provider]) {
        costs[provider] = [];
      }
      costs[provider].push({ date, cost: value });
    }

    return costs;
  }

  /**
   * Obtém resumo de custos
   * @returns {Object} Resumo com total, hoje e este mês
   */
  getSummary() {
    const summary = {
      total: {},
      today: {},
      thisMonth: {},
    };

    // Totais
    for (const [provider, cost] of this.costStats.total.entries()) {
      summary.total[provider] = cost;
    }

    // Hoje
    const today = new Date().toISOString().split("T")[0];
    for (const [key, cost] of this.costStats.daily.entries()) {
      if (key.endsWith(today)) {
        const provider = key.split("_")[0];
        summary.today[provider] = cost;
      }
    }

    // Este mês
    const thisMonth = new Date().toISOString().substring(0, 7);
    for (const [key, cost] of this.costStats.monthly.entries()) {
      if (key.endsWith(thisMonth)) {
        const provider = key.split("_")[0];
        summary.thisMonth[provider] = cost;
      }
    }

    return summary;
  }

  /**
   * Estima custo mensal projetado
   * @returns {Object} Custo projetado por provider para o mês atual
   */
  getProjectedMonthlyCost() {
    const summary = this.getSummary();
    const today = new Date();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    const currentDay = today.getDate();

    const projected = {};

    for (const [provider, todayCost] of Object.entries(summary.today)) {
      if (todayCost > 0) {
        projected[provider] = (todayCost / currentDay) * daysInMonth;
      }
    }

    return projected;
  }

  /**
   * Obtém preços configurados
   * @returns {Object} Preços por provider
   */
  getPricing() {
    return this.pricing;
  }

  /**
   * Atualiza preços (útil para ajustes dinâmicos)
   * @param {string} providerName - Nome do provider
   * @param {Object} pricing - Novo preço {input, output}
   */
  updatePricing(providerName, pricing) {
    if (this.pricing[providerName]) {
      this.pricing[providerName] = pricing;
    }
  }
}

module.exports = CostTracker;
