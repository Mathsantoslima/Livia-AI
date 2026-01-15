const evolutionApiService = require("../services/evolutionApiService");
const logger = require("../utils/logger");

/**
 * Lista todas as instâncias disponíveis
 */
async function listInstances(req, res) {
  try {
    const instances = await evolutionApiService.listInstances();
    res.status(200).json({
      status: "success",
      data: instances,
    });
  } catch (error) {
    logger.error("Erro ao listar instâncias:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao listar instâncias",
      error: error.message,
    });
  }
}

/**
 * Cria uma nova instância
 */
async function createInstance(req, res) {
  try {
    const { instanceName, webhook, webhookUrl, token, mode } = req.body;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    const result = await evolutionApiService.createInstance(instanceName, {
      webhook,
      webhookUrl,
      token,
      mode,
    });

    res.status(201).json({
      status: "success",
      message: "Instância criada com sucesso",
      data: result,
    });
  } catch (error) {
    logger.error("Erro ao criar instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao criar instância",
      error: error.message,
    });
  }
}

/**
 * Inicia a conexão de uma instância
 */
async function connectInstance(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    const result = await evolutionApiService.connectInstance(instanceName);

    res.status(200).json({
      status: "success",
      message: "Conexão iniciada",
      data: result,
    });
  } catch (error) {
    logger.error("Erro ao conectar instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao conectar instância",
      error: error.message,
    });
  }
}

/**
 * Obter QR Code para uma instância
 */
async function getQrCode(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    const result = await evolutionApiService.getQrCode(instanceName);

    if (!result || !result.qrcode) {
      return res.status(404).json({
        status: "error",
        message: "QR Code não disponível",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        qrcode: result.qrcode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Erro ao obter QR Code:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao obter QR Code",
      error: error.message,
    });
  }
}

/**
 * Verificar status de uma instância
 */
async function checkInstanceStatus(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    const result = await evolutionApiService.checkInstanceStatus(instanceName);

    res.status(200).json({
      status: "success",
      data: {
        instanceName,
        state: result.state,
        connected: result.state === "open",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Erro ao verificar status da instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao verificar status da instância",
      error: error.message,
    });
  }
}

/**
 * Desconectar uma instância
 */
async function disconnectInstance(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    await evolutionApiService.disconnectInstance(instanceName);

    res.status(200).json({
      status: "success",
      message: "Instância desconectada com sucesso",
    });
  } catch (error) {
    logger.error("Erro ao desconectar instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao desconectar instância",
      error: error.message,
    });
  }
}

/**
 * Excluir uma instância
 */
async function deleteInstance(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    await evolutionApiService.deleteInstance(instanceName);

    res.status(200).json({
      status: "success",
      message: "Instância excluída com sucesso",
    });
  } catch (error) {
    logger.error("Erro ao excluir instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao excluir instância",
      error: error.message,
    });
  }
}

/**
 * Configurar webhook para uma instância
 */
async function setInstanceWebhook(req, res) {
  try {
    const { instanceName } = req.params;
    const { webhookUrl } = req.body;

    if (!instanceName || !webhookUrl) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância e URL do webhook são obrigatórios",
      });
    }

    await evolutionApiService.setInstanceWebhook(instanceName, webhookUrl);

    res.status(200).json({
      status: "success",
      message: "Webhook configurado com sucesso",
    });
  } catch (error) {
    logger.error("Erro ao configurar webhook:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao configurar webhook",
      error: error.message,
    });
  }
}

/**
 * Reiniciar uma instância
 */
async function restartInstance(req, res) {
  try {
    const { instanceName } = req.params;

    if (!instanceName) {
      return res.status(400).json({
        status: "error",
        message: "Nome da instância é obrigatório",
      });
    }

    await evolutionApiService.restartInstance(instanceName);

    res.status(200).json({
      status: "success",
      message: "Instância reiniciada com sucesso",
    });
  } catch (error) {
    logger.error("Erro ao reiniciar instância:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao reiniciar instância",
      error: error.message,
    });
  }
}

module.exports = {
  listInstances,
  createInstance,
  connectInstance,
  getQrCode,
  checkInstanceStatus,
  disconnectInstance,
  deleteInstance,
  setInstanceWebhook,
  restartInstance,
};
