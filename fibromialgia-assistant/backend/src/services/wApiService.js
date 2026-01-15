/**
 * =========================================
 * SERVIÇO W-API
 * =========================================
 *
 * Integração com a API W-API (https://api.w-api.app)
 * Documentação: https://www.postman.com/w-api/w-api-api-do-whatsapp
 */

const axios = require("axios");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

// Configuração da W-API
const W_API_URL = process.env.W_API_URL || "https://api.w-api.app/v1";
const W_API_TOKEN = process.env.W_API_TOKEN || process.env.WHATSAPP_API_KEY;
const DEFAULT_INSTANCE_ID =
  process.env.W_API_INSTANCE_ID ||
  process.env.DEFAULT_WHATSAPP_INSTANCE ||
  "fibromialgia";

if (!W_API_TOKEN) {
  logger.warn(
    "W_API_TOKEN não configurado. A integração com W-API não funcionará."
  );
}

// Cliente HTTP para a W-API
const wApiClient = axios.create({
  baseURL: W_API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${W_API_TOKEN}`,
  },
  timeout: 30000, // 30 segundos
});

/**
 * Obtém QR Code para conexão
 * @param {string} instanceId - ID da instância
 * @param {Object} options - Opções (image: 'enable'|'disable', syncContacts: 'enable'|'disable')
 * @returns {Promise<Object>} QR Code (base64 ou URL)
 */
async function getQrCode(instanceId = DEFAULT_INSTANCE_ID, options = {}) {
  try {
    const params = {
      instanceId,
      image: options.image || "enable", // 'enable' para PNG, 'disable' para base64
      syncContacts: options.syncContacts || "disable",
    };

    const response = await wApiClient.get("/instance/qr-code", { params });

    logger.info(`QR Code obtido para instância: ${instanceId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao obter QR Code W-API: ${error.message}`, {
      instanceId,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
}

/**
 * Verifica status da instância
 * @param {string} instanceId - ID da instância
 * @returns {Promise<Object>} Status da instância
 */
async function checkInstanceStatus(instanceId = DEFAULT_INSTANCE_ID) {
  try {
    const response = await wApiClient.get("/instance/status-instance", {
      params: { instanceId },
    });

    // Log completo da resposta para debug
    logger.info(`Status da instância ${instanceId}:`, {
      status: response.data.status || response.data.state,
      connected: response.data.connected,
      phone:
        response.data.phone ||
        response.data.connectedPhone ||
        response.data.number,
      fullResponse: JSON.stringify(response.data).substring(0, 500),
    });

    return response.data;
  } catch (error) {
    logger.error(`Erro ao verificar status W-API: ${error.message}`, {
      instanceId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Envia mensagem de texto
 * @param {string} instanceId - ID da instância
 * @param {string} phone - Número do destinatário (formato: DDI DDD NÚMERO, ex: 559199999999)
 * @param {string} message - Mensagem a enviar
 * @param {Object} options - Opções (messageId, delayMessage)
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendTextMessage(instanceId, phone, message, options = {}) {
  try {
    // Limpar número de telefone
    const cleanPhone = phone.replace(/[^\d]/g, "");

    const payload = {
      phone: cleanPhone,
      message: message,
    };

    // Adicionar opções se fornecidas
    if (options.messageId) {
      payload.messageId = options.messageId;
    }
    if (options.delayMessage !== undefined) {
      payload.delayMessage = options.delayMessage;
    }

    const response = await wApiClient.post("/message/send-text", payload, {
      params: { instanceId },
    });

    logger.info(`Mensagem W-API enviada para ${cleanPhone}`, {
      instanceId,
      messageId: response.data.messageId,
    });

    // Registrar envio no banco de dados
    try {
      await supabase.from("message_logs").insert([
        {
          phone: cleanPhone,
          message_type: "text",
          content: message,
          status: "sent",
          instance_name: instanceId,
          api_response: response.data,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      logger.warn(
        "Erro ao registrar mensagem no banco (não crítico):",
        dbError.message
      );
    }

    return response.data;
  } catch (error) {
    logger.error(`Erro ao enviar mensagem W-API: ${error.message}`, {
      instanceId,
      phone,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Registrar erro no banco de dados
    try {
      await supabase.from("message_logs").insert([
        {
          phone: phone.replace(/[^\d]/g, ""),
          message_type: "text",
          content: message,
          instance_name: instanceId,
          status: "error",
          error_message: error.message,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      // Ignorar erro de banco
    }

    throw error;
  }
}

/**
 * Reinicia uma instância
 * @param {string} instanceId - ID da instância
 * @returns {Promise<Object>} Resultado do reinício
 */
async function restartInstance(instanceId = DEFAULT_INSTANCE_ID) {
  try {
    const response = await wApiClient.get("/instance/restart", {
      params: { instanceId },
    });

    logger.info(`Instância W-API reiniciada: ${instanceId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao reiniciar instância W-API: ${error.message}`, {
      instanceId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Obtém informações da instância
 * @param {string} instanceId - ID da instância
 * @returns {Promise<Object>} Informações da instância
 */
async function getInstanceInfo(instanceId = DEFAULT_INSTANCE_ID) {
  try {
    const response = await wApiClient.get("/instance/info", {
      params: { instanceId },
    });

    return response.data;
  } catch (error) {
    logger.error(
      `Erro ao obter informações da instância W-API: ${error.message}`,
      {
        instanceId,
        status: error.response?.status,
      }
    );
    throw error;
  }
}

/**
 * Desconecta uma instância
 * @param {string} instanceId - ID da instância
 * @returns {Promise<Object>} Resultado da desconexão
 */
async function disconnectInstance(instanceId = DEFAULT_INSTANCE_ID) {
  try {
    const response = await wApiClient.get("/instance/logout", {
      params: { instanceId },
    });

    logger.info(`Instância W-API desconectada: ${instanceId}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao desconectar instância W-API: ${error.message}`, {
      instanceId,
      status: error.response?.status,
    });
    throw error;
  }
}

/**
 * Envia mensagem de áudio
 * @param {string} instanceId - ID da instância
 * @param {string} phone - Número do destinatário
 * @param {string} audioUrl - URL do áudio
 * @param {Object} options - Opções
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendAudioMessage(instanceId, phone, audioUrl, options = {}) {
  try {
    // Limpar número de telefone
    const cleanPhone = phone.replace(/[^\d]/g, "");

    const payload = {
      phone: cleanPhone,
      audio: audioUrl,
    };

    // Adicionar opções se fornecidas
    if (options.messageId) {
      payload.messageId = options.messageId;
    }
    if (options.delayMessage !== undefined) {
      payload.delayMessage = options.delayMessage;
    }

    const response = await wApiClient.post("/message/send-audio", payload, {
      params: { instanceId },
    });

    logger.info(`Áudio W-API enviado para ${cleanPhone}`, {
      instanceId,
      messageId: response.data.messageId,
    });

    // Registrar envio no banco de dados
    try {
      await supabase.from("message_logs").insert([
        {
          phone: cleanPhone,
          message_type: "audio",
          content: audioUrl,
          status: "sent",
          instance_name: instanceId,
          api_response: response.data,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      logger.warn(
        "Erro ao registrar áudio no banco (não crítico):",
        dbError.message
      );
    }

    return response.data;
  } catch (error) {
    logger.error(`Erro ao enviar áudio W-API: ${error.message}`, {
      instanceId,
      phone,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Registrar erro no banco de dados
    try {
      await supabase.from("message_logs").insert([
        {
          phone: phone.replace(/[^\d]/g, ""),
          message_type: "audio",
          content: audioUrl,
          instance_name: instanceId,
          status: "error",
          error_message: error.message,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (dbError) {
      // Ignorar erro de banco
    }

    throw error;
  }
}

/**
 * Testa a conexão com a W-API
 * @returns {Promise<boolean>} true se conectado
 */
async function testConnection() {
  try {
    await checkInstanceStatus(DEFAULT_INSTANCE_ID);
    return true;
  } catch (error) {
    logger.error("Erro ao testar conexão W-API:", error.message);
    return false;
  }
}

module.exports = {
  getQrCode,
  checkInstanceStatus,
  sendTextMessage,
  restartInstance,
  getInstanceInfo,
  disconnectInstance,
  testConnection,
  DEFAULT_INSTANCE_ID,
};
