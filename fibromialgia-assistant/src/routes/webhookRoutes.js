/**
 * Rotas para recebimento de webhooks
 */
const express = require("express");
const router = express.Router();
const assistantService = require("../services/assistantService");

/**
 * Rota para receber webhooks do WhatsApp
 * Processa mensagens recebidas e envia respostas
 */
router.post("/whatsapp", async (req, res) => {
  try {
    const { event, data } = req.body;

    // Logging básico
    console.log(`Webhook recebido: ${event}`);

    // Só processar eventos de mensagem
    if (event === "message") {
      // Verificar se é uma mensagem de entrada (não enviada pelo bot)
      if (data && data.from && data.body) {
        // Remover prefixo do WhatsApp (se existir)
        const phoneNumber = data.from.split("@")[0];

        // Processar mensagem e obter resposta
        const response = await assistantService.processMessage(
          phoneNumber,
          data.body
        );

        // Enviar resposta de volta
        if (response) {
          await assistantService.sendMessage(phoneNumber, response);
        }
      }
    }

    // Responder imediatamente para não bloquear o webhook
    return res.status(200).json({ status: "success" });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
