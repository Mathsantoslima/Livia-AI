const express = require("express");
const whatsappController = require("../controllers/whatsappController");
const { requireAuth } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /api/whatsapp/qrcode:
 *   get:
 *     summary: Gera e retorna um QR code para pareamento do WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code gerado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao gerar QR code
 */
router.get("/qrcode", requireAuth, whatsappController.getQRCode);

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Verifica o status da conexão com o WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retornado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao verificar status
 */
router.get("/status", requireAuth, whatsappController.getStatus);

/**
 * @swagger
 * /api/whatsapp/disconnect:
 *   post:
 *     summary: Desconecta a sessão do WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Desconectado com sucesso
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao desconectar
 */
router.post("/disconnect", requireAuth, whatsappController.disconnect);

/**
 * @swagger
 * /api/whatsapp/send:
 *   post:
 *     summary: Envia uma mensagem via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Número de telefone do destinatário
 *               message:
 *                 type: string
 *                 description: Mensagem a ser enviada
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 *       400:
 *         description: Parâmetros inválidos
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro ao enviar mensagem
 */
router.post("/send", requireAuth, whatsappController.sendMessage);

module.exports = router;
