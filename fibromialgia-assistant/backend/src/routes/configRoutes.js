const express = require("express");
const router = express.Router();
const configService = require("../services/configService");
const {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
} = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route GET /api/admin/config/:key
 * @desc Obtém valor de uma configuração
 * @access Private/Admin
 */
router.get("/:key", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const value = await configService.getConfig(key);
    res.json({ key, value });
  } catch (error) {
    logger.error(`Erro ao obter configuração ${req.params.key}:`, error);
    res.status(500).json({ error: "Erro ao obter configuração" });
  }
});

/**
 * @route POST /api/admin/config/:key
 * @desc Define valor de uma configuração
 * @access Private/SuperAdmin
 */
router.post("/:key", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    if (!value) {
      return res.status(400).json({ error: "Valor é obrigatório" });
    }

    await configService.setConfig(key, value, description);
    res.json({ message: "Configuração atualizada com sucesso" });
  } catch (error) {
    logger.error(`Erro ao definir configuração ${req.params.key}:`, error);
    res.status(500).json({ error: "Erro ao definir configuração" });
  }
});

/**
 * @route GET /api/admin/config
 * @desc Lista todas as configurações
 * @access Private/Admin
 */
router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const configs = await configService.listConfigs();
    res.json(configs);
  } catch (error) {
    logger.error("Erro ao listar configurações:", error);
    res.status(500).json({ error: "Erro ao listar configurações" });
  }
});

/**
 * @route DELETE /api/admin/config/:key
 * @desc Remove uma configuração
 * @access Private/SuperAdmin
 */
router.delete("/:key", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    await configService.removeConfig(key);
    res.json({ message: "Configuração removida com sucesso" });
  } catch (error) {
    logger.error(`Erro ao remover configuração ${req.params.key}:`, error);
    res.status(500).json({ error: "Erro ao remover configuração" });
  }
});

/**
 * @route GET /api/admin/config/system
 * @desc Obtém configurações do sistema
 * @access Private/Admin
 */
router.get("/system", requireAuth, requireAdmin, async (req, res) => {
  try {
    const configs = await configService.getSystemConfigs();
    res.json(configs);
  } catch (error) {
    logger.error("Erro ao obter configurações do sistema:", error);
    res.status(500).json({ error: "Erro ao obter configurações do sistema" });
  }
});

/**
 * @route POST /api/admin/config/system
 * @desc Atualiza configurações do sistema
 * @access Private/SuperAdmin
 */
router.post("/system", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const configs = req.body;
    await configService.setSystemConfigs(configs);
    res.json({ message: "Configurações do sistema atualizadas com sucesso" });
  } catch (error) {
    logger.error("Erro ao atualizar configurações do sistema:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar configurações do sistema" });
  }
});

/**
 * @route GET /api/admin/config/notifications
 * @desc Obtém configurações de notificações
 * @access Private/Admin
 */
router.get("/notifications", requireAuth, requireAdmin, async (req, res) => {
  try {
    const configs = await configService.getNotificationConfigs();
    res.json(configs);
  } catch (error) {
    logger.error("Erro ao obter configurações de notificações:", error);
    res
      .status(500)
      .json({ error: "Erro ao obter configurações de notificações" });
  }
});

/**
 * @route POST /api/admin/config/notifications
 * @desc Atualiza configurações de notificações
 * @access Private/SuperAdmin
 */
router.post(
  "/notifications",
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const configs = req.body;
      await configService.setNotificationConfigs(configs);
      res.json({
        message: "Configurações de notificações atualizadas com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações de notificações:", error);
      res
        .status(500)
        .json({ error: "Erro ao atualizar configurações de notificações" });
    }
  }
);

/**
 * @route GET /api/admin/config/model
 * @desc Obtém configurações do modelo
 * @access Private/Admin
 */
router.get("/model", requireAuth, requireAdmin, async (req, res) => {
  try {
    const configs = await configService.getModelConfigs();
    res.json(configs);
  } catch (error) {
    logger.error("Erro ao obter configurações do modelo:", error);
    res.status(500).json({ error: "Erro ao obter configurações do modelo" });
  }
});

/**
 * @route POST /api/admin/config/model
 * @desc Atualiza configurações do modelo
 * @access Private/SuperAdmin
 */
router.post("/model", requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const configs = req.body;
    await configService.setModelConfigs(configs);
    res.json({ message: "Configurações do modelo atualizadas com sucesso" });
  } catch (error) {
    logger.error("Erro ao atualizar configurações do modelo:", error);
    res
      .status(500)
      .json({ error: "Erro ao atualizar configurações do modelo" });
  }
});

module.exports = router;
