const express = require("express");
const router = express.Router();
const instancesController = require("../controllers/instancesController");

// Listar todas as instâncias
router.get("/", instancesController.listInstances);

// Criar uma nova instância
router.post("/", instancesController.createInstance);

// Iniciar conexão de uma instância
router.post("/:instanceName/connect", instancesController.connectInstance);

// Obter QR Code para uma instância
router.get("/:instanceName/qrcode", instancesController.getQrCode);

// Verificar status de uma instância
router.get("/:instanceName/status", instancesController.checkInstanceStatus);

// Desconectar uma instância
router.post(
  "/:instanceName/disconnect",
  instancesController.disconnectInstance
);

// Excluir uma instância
router.delete("/:instanceName", instancesController.deleteInstance);

// Configurar webhook para uma instância
router.post("/:instanceName/webhook", instancesController.setInstanceWebhook);

// Reiniciar uma instância
router.post("/:instanceName/restart", instancesController.restartInstance);

module.exports = router;
