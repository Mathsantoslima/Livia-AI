const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const logger = require("../utils/logger");

/**
 * Rotas do sistema avançado da Livia
 */

// ==============================================
// WEBHOOK PRINCIPAL DO WHATSAPP
// ==============================================

/**
 * POST /webhook/whatsapp
 * Recebe mensagens do WhatsApp e processa com toda a inteligência da Livia
 */
router.post("/whatsapp", webhookController.handleWhatsAppWebhook);

// ==============================================
// ENDPOINTS DE INTELIGÊNCIA ARTIFICIAL
// ==============================================

/**
 * POST /webhook/intelligence/analyze
 * Trigger manual para análise de inteligência coletiva
 * Útil para desenvolvimento e manutenção
 */
router.post(
  "/intelligence/analyze",
  webhookController.triggerCollectiveIntelligence
);

// ==============================================
// ENDPOINTS DE BROADCAST E AUTOMAÇÃO
// ==============================================

/**
 * POST /webhook/broadcast/morning
 * Envia sugestões matinais para todos os usuários que têm sugestões
 * Deve ser chamado por cron job entre 7h e 9h
 */
router.post("/broadcast/morning", webhookController.sendMorningBroadcast);

// ==============================================
// ENDPOINTS DE MONITORAMENTO
// ==============================================

/**
 * GET /webhook/stats
 * Retorna estatísticas do sistema Livia
 */
router.get("/stats", webhookController.getLiviaStats);

/**
 * GET /webhook/health
 * Health check do sistema
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    system: "Livia Fibromialgia Assistant",
    version: "2.0.0",
  });
});

// ==============================================
// MIDDLEWARE DE ERRO
// ==============================================

router.use((error, req, res, next) => {
  logger.error("Erro nas rotas do webhook:", error);

  res.status(500).json({
    status: "error",
    message: "Erro interno do servidor",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
