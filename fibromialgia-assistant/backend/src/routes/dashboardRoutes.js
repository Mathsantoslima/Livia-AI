/**
 * =========================================
 * DASHBOARD ROUTES
 * =========================================
 * 
 * Rotas para dashboard de métricas
 */

const express = require("express");
const router = express.Router();
const MetricsDashboard = require("../core/MetricsDashboard");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * Middleware para obter ProviderManager
 * O ProviderManager deve ser disponibilizado via req.app.get('providerManager')
 * ou via singleton/global state conforme a arquitetura do projeto
 */
function getProviderManager(req, res, next) {
  // Tentar obter do app (se disponível)
  let providerManager = req.app.get?.("providerManager");

  // Se não estiver disponível, criar uma instância temporária com dados vazios
  if (!providerManager) {
    const ProviderManager = require("../core/providers/ProviderManager");
    try {
      providerManager = new ProviderManager({});
    } catch (error) {
      // Se falhar ao criar, usar um mock simples
      logger.warn("ProviderManager não disponível, usando dados vazios");
      providerManager = {
        getStats: () => ({ providers: {}, summary: {} }),
        getCostStats: () => ({ summary: { total: {}, today: {} }, projected: {} }),
      };
    }
  }

  req.providerManager = providerManager;
  next();
}

/**
 * @route GET /api/dashboard
 * @desc Dashboard completo de métricas
 * @access Admin
 */
router.get(
  "/",
  requireAuth,
  requireAdmin,
  getProviderManager,
  async (req, res) => {
    try {
      const period = req.query.period || "24h"; // 24h, 7d, 30d
      const dashboard = new MetricsDashboard(req.providerManager);
      const data = await dashboard.getDashboard(period);

      res.json(data);
    } catch (error) {
      logger.error("Erro ao obter dashboard:", error);
      res.status(500).json({
        error: "Erro ao obter dashboard",
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/dashboard/costs
 * @desc Estatísticas de custo
 * @access Admin
 */
router.get(
  "/costs",
  requireAuth,
  requireAdmin,
  getProviderManager,
  async (req, res) => {
    try {
      const costStats = req.providerManager.getCostStats();
      res.json(costStats);
    } catch (error) {
      logger.error("Erro ao obter custos:", error);
      res.status(500).json({
        error: "Erro ao obter custos",
        message: error.message,
      });
    }
  }
);

/**
 * @route GET /api/dashboard/providers
 * @desc Estatísticas dos providers
 * @access Admin
 */
router.get(
  "/providers",
  requireAuth,
  requireAdmin,
  getProviderManager,
  async (req, res) => {
    try {
      const stats = req.providerManager.getStats();
      res.json(stats);
    } catch (error) {
      logger.error("Erro ao obter estatísticas:", error);
      res.status(500).json({
        error: "Erro ao obter estatísticas",
        message: error.message,
      });
    }
  }
);

module.exports = router;
