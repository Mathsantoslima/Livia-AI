const express = require("express");
const router = express.Router();
const statsService = require("../services/statsService");
const { requireAuth, requireAdmin } = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route GET /api/admin/stats/general
 * @desc Obtém estatísticas gerais do sistema
 * @access Private/Admin
 */
router.get("/general", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await statsService.getGeneralStats();
    res.json(stats);
  } catch (error) {
    logger.error("Erro ao obter estatísticas gerais:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas gerais" });
  }
});

/**
 * @route GET /api/admin/stats/usage
 * @desc Obtém estatísticas de uso do sistema
 * @access Private/Admin
 */
router.get("/usage", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { period = "day" } = req.query;
    const stats = await statsService.getUsageStats(period);
    res.json(stats);
  } catch (error) {
    logger.error("Erro ao obter estatísticas de uso:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de uso" });
  }
});

/**
 * @route GET /api/admin/stats/symptoms
 * @desc Obtém estatísticas de sintomas
 * @access Private/Admin
 */
router.get("/symptoms", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await statsService.getSymptomStats();
    res.json(stats);
  } catch (error) {
    logger.error("Erro ao obter estatísticas de sintomas:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de sintomas" });
  }
});

/**
 * @route GET /api/admin/stats/predictions
 * @desc Obtém estatísticas de previsões
 * @access Private/Admin
 */
router.get("/predictions", requireAuth, requireAdmin, async (req, res) => {
  try {
    const stats = await statsService.getPredictionStats();
    res.json(stats);
  } catch (error) {
    logger.error("Erro ao obter estatísticas de previsões:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de previsões" });
  }
});

/**
 * @route POST /api/admin/stats/report
 * @desc Gera relatório de estatísticas
 * @access Private/Admin
 */
router.post("/report", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, format = "pdf", filters = {} } = req.body;

    if (!type) {
      return res.status(400).json({ error: "Tipo de relatório é obrigatório" });
    }

    const report = await statsService.generateReport({
      type,
      format,
      filters,
    });

    res.json(report);
  } catch (error) {
    logger.error("Erro ao gerar relatório:", error);
    res.status(500).json({ error: "Erro ao gerar relatório" });
  }
});

module.exports = router;
