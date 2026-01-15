const express = require("express");
const router = express.Router();
const monitoringService = require("../services/monitoringService");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route GET /api/admin/monitoring/health
 * @desc Verifica a saúde do sistema
 * @access Admin
 */
router.get("/health", requireAuth, requireAdmin, async (req, res) => {
  try {
    const health = await monitoringService.checkSystemHealth();
    res.json(health);
  } catch (error) {
    logger.error("Erro ao verificar saúde do sistema:", error);
    res.status(500).json({ error: "Erro ao verificar saúde do sistema" });
  }
});

/**
 * @route GET /api/admin/monitoring/performance
 * @desc Verifica o desempenho do sistema
 * @access Admin
 */
router.get("/performance", requireAuth, requireAdmin, async (req, res) => {
  try {
    const performance = await monitoringService.checkPerformance();
    res.json(performance);
  } catch (error) {
    logger.error("Erro ao verificar desempenho:", error);
    res.status(500).json({ error: "Erro ao verificar desempenho" });
  }
});

/**
 * @route GET /api/admin/monitoring/usage
 * @desc Verifica o uso do sistema
 * @access Admin
 */
router.get("/usage", requireAuth, requireAdmin, async (req, res) => {
  try {
    const usage = await monitoringService.checkUsage();
    res.json(usage);
  } catch (error) {
    logger.error("Erro ao verificar uso:", error);
    res.status(500).json({ error: "Erro ao verificar uso" });
  }
});

/**
 * @route GET /api/admin/monitoring/security
 * @desc Verifica a segurança do sistema
 * @access Admin
 */
router.get("/security", requireAuth, requireAdmin, async (req, res) => {
  try {
    const security = await monitoringService.checkSecurity();
    res.json(security);
  } catch (error) {
    logger.error("Erro ao verificar segurança:", error);
    res.status(500).json({ error: "Erro ao verificar segurança" });
  }
});

/**
 * @route GET /api/admin/monitoring/metrics
 * @desc Obtém todas as métricas do sistema
 * @access Admin
 */
router.get("/metrics", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [health, performance, usage, security] = await Promise.all([
      monitoringService.checkSystemHealth(),
      monitoringService.checkPerformance(),
      monitoringService.checkUsage(),
      monitoringService.checkSecurity(),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      health,
      performance,
      usage,
      security,
    });
  } catch (error) {
    logger.error("Erro ao obter métricas:", error);
    res.status(500).json({ error: "Erro ao obter métricas" });
  }
});

module.exports = router;
