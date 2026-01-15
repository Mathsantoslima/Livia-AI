/**
 * =========================================
 * METRICS DASHBOARD - DASHBOARD DE MÉTRICAS
 * =========================================
 * 
 * Gerencia dashboard unificado de métricas
 */

const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

class MetricsDashboard {
  constructor(providerManager) {
    this.providerManager = providerManager;
  }

  /**
   * Gera dashboard completo de métricas
   * @param {string} period - Período: '24h', '7d', '30d'
   * @returns {Promise<Object>} Dashboard completo
   */
  async getDashboard(period = "24h") {
    try {
      const [
        providerStats,
        costStats,
        systemMetrics,
        usageMetrics,
      ] = await Promise.all([
        this._getProviderStats(),
        this._getCostStats(period),
        this._getSystemMetrics(),
        this._getUsageMetrics(period),
      ]);

      return {
        timestamp: new Date().toISOString(),
        period,
        providers: providerStats,
        costs: costStats,
        system: systemMetrics,
        usage: usageMetrics,
        summary: this._generateSummary(providerStats, costStats, usageMetrics),
      };
    } catch (error) {
      logger.error("Erro ao gerar dashboard:", error);
      throw error;
    }
  }

  /**
   * Estatísticas dos providers
   * @returns {Object} Estatísticas dos providers
   */
  _getProviderStats() {
    const stats = this.providerManager.getStats();
    const providersInfo = this.providerManager.getProvidersInfo();

    return {
      total: {
        requests: stats.totalRequests,
        providers: Object.keys(providersInfo).length,
      },
      byProvider: Object.entries(providersInfo).map(([name, info]) => ({
        name,
        healthy: info.healthy,
        successRate: (info.successRate * 100).toFixed(2) + "%",
        avgLatency: Math.round(info.avgLatency) + "ms",
        model: info.model,
      })),
    };
  }

  /**
   * Estatísticas de custo
   * @param {string} period - Período
   * @returns {Object} Estatísticas de custo
   */
  _getCostStats(period) {
    const costStats = this.providerManager.getCostStats();

    return {
      today: costStats.summary.today,
      thisMonth: costStats.summary.thisMonth,
      total: costStats.summary.total,
      projected: costStats.projected,
      breakdown: this._formatCostBreakdown(costStats),
    };
  }

  /**
   * Formata breakdown de custos
   * @param {Object} costStats - Estatísticas de custo
   * @returns {Array} Breakdown formatado
   */
  _formatCostBreakdown(costStats) {
    const breakdown = [];

    for (const [provider, cost] of Object.entries(costStats.summary.total)) {
      breakdown.push({
        provider,
        total: `$${cost.toFixed(4)}`,
        today: `$${(costStats.summary.today[provider] || 0).toFixed(4)}`,
        thisMonth: `$${(costStats.summary.thisMonth[provider] || 0).toFixed(4)}`,
        projected: `$${(costStats.projected[provider] || 0).toFixed(4)}`,
      });
    }

    return breakdown;
  }

  /**
   * Métricas do sistema
   * @returns {Object} Métricas do sistema
   */
  async _getSystemMetrics() {
    // Integrar com monitoringService existente se necessário
    return {
      uptime: process.uptime(),
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };
  }

  /**
   * Métricas de uso
   * @param {string} period - Período
   * @returns {Promise<Object>} Métricas de uso
   */
  async _getUsageMetrics(period) {
    try {
      const hours =
        period === "24h" ? 24 : period === "7d" ? 168 : period === "30d" ? 720 : 24;
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data: conversations, error } = await supabase
        .from("conversations_livia")
        .select("message_type, sent_at")
        .gte("sent_at", since.toISOString());

      if (error) {
        logger.error("Erro ao buscar métricas de uso:", error);
        return {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
        };
      }

      return {
        totalMessages: conversations?.length || 0,
        userMessages:
          conversations?.filter((c) => c.message_type === "user").length || 0,
        assistantMessages:
          conversations?.filter((c) => c.message_type === "assistant").length ||
          0,
      };
    } catch (error) {
      logger.error("Erro ao obter métricas de uso:", error);
      return {
        totalMessages: 0,
        userMessages: 0,
        assistantMessages: 0,
      };
    }
  }

  /**
   * Gera resumo executivo
   * @param {Object} providerStats - Estatísticas dos providers
   * @param {Object} costStats - Estatísticas de custo
   * @param {Object} usageMetrics - Métricas de uso
   * @returns {Object} Resumo executivo
   */
  _generateSummary(providerStats, costStats, usageMetrics) {
    const totalCost = Object.values(costStats.total).reduce(
      (a, b) => a + (typeof b === "number" ? b : 0),
      0
    );
    const todayCost = Object.values(costStats.today).reduce(
      (a, b) => a + (typeof b === "number" ? b : 0),
      0
    );

    return {
      totalRequests: providerStats.total.requests,
      totalCost: `$${totalCost.toFixed(4)}`,
      todayCost: `$${todayCost.toFixed(4)}`,
      totalMessages: usageMetrics.totalMessages,
      avgCostPerMessage:
        totalCost > 0 && usageMetrics.totalMessages > 0
          ? `$${(totalCost / usageMetrics.totalMessages).toFixed(6)}`
          : "$0.000000",
    };
  }
}

module.exports = MetricsDashboard;
