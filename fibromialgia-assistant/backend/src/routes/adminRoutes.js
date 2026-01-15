const express = require("express");
const router = express.Router();
const { authenticateToken, requireAdmin } = require("../middleware/auth");
const adminService = require("../services/adminService");
const authService = require("../services/authService");
const {
  requireAuth,
  requireSuperAdmin,
} = require("../middlewares/authMiddleware");
const logger = require("../utils/logger");

/**
 * @route POST /api/admin/auth/login
 * @desc Autenticar administrador
 * @access Public
 */
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    const result = await authService.authenticateAdmin(email, password);
    res.json(result);
  } catch (error) {
    logger.error("Erro no login:", error);
    res.status(401).json({ error: error.message });
  }
});

// Middleware para verificar se é admin (APLICADO APENAS APÓS AS ROTAS PÚBLICAS)
router.use(authenticateToken, requireAdmin);

/**
 * @route GET /api/admin/stats
 * @desc Busca estatísticas gerais
 * @access Admin
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await adminService.getGeneralStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

/**
 * @route GET /api/admin/users
 * @desc Busca usuários com filtros
 * @access Admin
 */
router.get("/users", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subscription_status,
      onboarding_completed,
      search,
    } = req.query;

    const filters = {
      subscription_status,
      onboarding_completed: onboarding_completed === "true",
      search,
    };

    const users = await adminService.getUsers(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

/**
 * @route GET /api/admin/interactions
 * @desc Busca interações com filtros
 * @access Admin
 */
router.get("/interactions", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user_id,
      type,
      intent,
      date_from,
      date_to,
    } = req.query;

    const filters = {
      user_id,
      type,
      intent,
      date_from,
      date_to,
    };

    const interactions = await adminService.getInteractions(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(interactions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar interações" });
  }
});

/**
 * @route GET /api/admin/predictions
 * @desc Busca previsões com filtros
 * @access Admin
 */
router.get("/predictions", async (req, res) => {
  try {
    const { page = 1, limit = 10, user_id, date_from, date_to } = req.query;

    const filters = {
      user_id,
      date_from,
      date_to,
    };

    const predictions = await adminService.getPredictions(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(predictions);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar previsões" });
  }
});

/**
 * @route PUT /api/admin/users/:id/subscription
 * @desc Atualiza status de assinatura
 * @access Admin
 */
router.put("/users/:id/subscription", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório" });
    }

    const user = await adminService.updateSubscriptionStatus(id, status);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar status de assinatura" });
  }
});

/**
 * @route POST /api/admin/auth/register
 * @desc Criar novo administrador
 * @access Private (SuperAdmin)
 */
router.post(
  "/auth/register",
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: "Nome, email e senha são obrigatórios" });
      }

      const admin = await authService.createAdmin({
        name,
        email,
        password,
        role,
      });
      res.status(201).json(admin);
    } catch (error) {
      logger.error("Erro ao criar administrador:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @route GET /api/admin/auth/admins
 * @desc Listar administradores
 * @access Private (Admin)
 */
router.get("/auth/admins", requireAuth, requireAdmin, async (req, res) => {
  try {
    const admins = await authService.listAdmins();
    res.json(admins);
  } catch (error) {
    logger.error("Erro ao listar administradores:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /api/admin/auth/admins/:id
 * @desc Atualizar administrador
 * @access Private (Admin)
 */
router.put("/auth/admins/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar se é superadmin tentando atualizar outro superadmin
    if (req.user.role !== "superadmin" && updateData.role === "superadmin") {
      return res
        .status(403)
        .json({ error: "Apenas superadmins podem criar outros superadmins" });
    }

    const admin = await authService.updateAdmin(id, updateData);
    res.json(admin);
  } catch (error) {
    logger.error("Erro ao atualizar administrador:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/admin/auth/admins/:id
 * @desc Remover administrador
 * @access Private (SuperAdmin)
 */
router.delete(
  "/auth/admins/:id",
  requireAuth,
  requireSuperAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Não permitir remover o próprio usuário
      if (id === req.user.id) {
        return res
          .status(400)
          .json({ error: "Não é possível remover seu próprio usuário" });
      }

      await authService.deleteAdmin(id);
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao remover administrador:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @route GET /api/admin/logs
 * @desc Obter logs do sistema
 * @access Private (Admin)
 */
router.get("/logs", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;

    // Implementar lógica para obter logs
    const logs = [];

    res.json({
      logs,
      page: parseInt(page),
      limit: parseInt(limit),
      total: 0,
    });
  } catch (error) {
    logger.error("Erro ao obter logs:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/admin/users/:id
 * @desc Obter detalhes de um usuário
 * @access Private (Admin)
 */
router.get("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Implementar lógica para obter detalhes do usuário
    const user = {};

    res.json(user);
  } catch (error) {
    logger.error("Erro ao obter detalhes do usuário:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Atualizar usuário
 * @access Private (Admin)
 */
router.put("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Implementar lógica para atualizar usuário
    const user = {};

    res.json(user);
  } catch (error) {
    logger.error("Erro ao atualizar usuário:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Remover usuário
 * @access Private (Admin)
 */
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Implementar lógica para remover usuário

    res.status(204).send();
  } catch (error) {
    logger.error("Erro ao remover usuário:", error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
