const express = require("express");
const router = express.Router();
const alertService = require("../services/alertService");
const { authenticateToken, isAdmin } = require("../middleware/auth");
const logger = require("../utils/logger");

/**
 * @route GET /api/alerts
 * @desc Obtém lista de alertas
 * @access Private/Admin
 */
router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const alerts = await alertService.getAlerts(req.query);
    res.json(alerts);
  } catch (error) {
    logger.error("Erro ao obter alertas:", error);
    res.status(500).json({ error: "Erro ao obter alertas" });
  }
});

/**
 * @route GET /api/alerts/active
 * @desc Obtém lista de alertas ativos
 * @access Private/Admin
 */
router.get("/active", authenticateToken, isAdmin, async (req, res) => {
  try {
    const alerts = await alertService.getActiveAlerts(req.query);
    res.json(alerts);
  } catch (error) {
    logger.error("Erro ao obter alertas ativos:", error);
    res.status(500).json({ error: "Erro ao obter alertas ativos" });
  }
});

/**
 * @route GET /api/alerts/stats
 * @desc Obtém estatísticas de alertas
 * @access Private/Admin
 */
router.get("/stats", authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await alertService.getAlertStats(req.query);
    res.json(stats);
  } catch (error) {
    logger.error("Erro ao obter estatísticas de alertas:", error);
    res.status(500).json({ error: "Erro ao obter estatísticas de alertas" });
  }
});

/**
 * @route PATCH /api/alerts/:id/status
 * @desc Atualiza status de um alerta
 * @access Private/Admin
 */
router.patch("/:id/status", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    const alert = await alertService.updateAlertStatus(req.params.id, status);
    res.json(alert);
  } catch (error) {
    logger.error("Erro ao atualizar status do alerta:", error);
    res.status(500).json({ error: "Erro ao atualizar status do alerta" });
  }
});

/**
 * @route POST /api/alerts/export
 * @desc Exporta alertas para arquivo
 * @access Private/Admin
 */
router.post("/export", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { format = "csv" } = req.body;
    const filepath = await alertService.exportAlerts(req.query, format);
    res.download(filepath);
  } catch (error) {
    logger.error("Erro ao exportar alertas:", error);
    res.status(500).json({ error: "Erro ao exportar alertas" });
  }
});

/**
 * @route POST /api/alerts/clean
 * @desc Limpa alertas antigos
 * @access Private/Admin
 */
router.post("/clean", authenticateToken, isAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const count = await alertService.cleanOldAlerts(days);
    res.json({ message: `${count} alertas removidos` });
  } catch (error) {
    logger.error("Erro ao limpar alertas antigos:", error);
    res.status(500).json({ error: "Erro ao limpar alertas antigos" });
  }
});

module.exports = router;
