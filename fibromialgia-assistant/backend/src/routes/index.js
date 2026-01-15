const express = require("express");
const router = express.Router();

// Importar rotas
const webhookRoutes = require("./webhookRoutes");
const userRoutes = require("./userRoutes");
const predictionRoutes = require("./predictionRoutes");
const adminRoutes = require("./adminRoutes");
const instancesRoutes = require("./instancesRoutes");
const whatsappRoutes = require("./whatsappRoutes");
const dashboardRoutes = require("./dashboardRoutes");

// Middleware de autenticação para rotas protegidas
const { authenticateToken } = require("../middleware/auth");

// Rotas públicas
router.use("/webhook", webhookRoutes);

// Rota pública de login admin (deve vir antes do middleware de autenticação)
const authService = require("../services/authService");
const logger = require("../utils/logger");
router.post("/admin/auth/login", async (req, res) => {
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

// Rotas protegidas
router.use("/users", authenticateToken, userRoutes);
router.use("/predictions", authenticateToken, predictionRoutes);
router.use("/admin", authenticateToken, adminRoutes);
router.use("/instances", authenticateToken, instancesRoutes);
router.use("/dashboard", dashboardRoutes);
// A rota do WhatsApp já tem seu próprio middleware de autenticação definido em whatsappRoutes.js
router.use("/whatsapp", whatsappRoutes);

// Rota de teste
router.get("/test", (req, res) => {
  res.json({ message: "API está funcionando!" });
});

module.exports = router;
