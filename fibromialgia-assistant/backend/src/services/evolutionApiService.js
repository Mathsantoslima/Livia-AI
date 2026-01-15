const axios = require("axios");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

// Configuração da API do Evolution API
const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY =
  process.env.EVOLUTION_API_KEY || "seu-token-secreto-aqui";

/**
 * Cliente HTTP para a API do Evolution
 */
const evolutionApi = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_KEY,
  },
});

/**
 * Cria uma nova instância do WhatsApp
 * @param {string} instanceName - Nome da instância
 * @param {Object} options - Opções adicionais da instância
 * @returns {Promise<Object>} Dados da instância criada
 */
async function createInstance(instanceName, options = {}) {
  try {
    const response = await evolutionApi.post("/instance/create", {
      instanceName,
      webhook: options.webhook || null,
      webhookUrl: options.webhookUrl || null,
      token: options.token || null,
      qrcode: true,
      status: true,
      mode: options.mode || "DEFAULT",
    });

    // Salvar no banco de dados local
    await supabase.from("whatsapp_instances").insert([
      {
        instance_name: instanceName,
        status: "created",
        webhook_url: options.webhookUrl,
        token: options.token,
        created_at: new Date().toISOString(),
      },
    ]);

    logger.info(`Nova instância WhatsApp criada: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao criar instância WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Conecta uma instância do WhatsApp
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} QR Code para conexão
 */
async function connectInstance(instanceName) {
  try {
    const response = await evolutionApi.post(
      `/instance/connect/${instanceName}`
    );

    // Atualizar status no banco de dados
    await supabase
      .from("whatsapp_instances")
      .update({
        status: "connecting",
        updated_at: new Date().toISOString(),
      })
      .eq("instance_name", instanceName);

    logger.info(`Conexão iniciada para instância: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao conectar instância WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Obter QR Code para conexão de uma instância
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} QR Code para conexão
 */
async function getQrCode(instanceName) {
  try {
    const response = await evolutionApi.get(`/instance/qrcode/${instanceName}`);
    logger.info(`QR Code obtido para instância: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Erro ao obter QR Code para instância WhatsApp: ${error.message}`
    );
    throw error;
  }
}

/**
 * Verificar status de uma instância
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} Status da instância
 */
async function checkInstanceStatus(instanceName) {
  try {
    const response = await evolutionApi.get(
      `/instance/connectionState/${instanceName}`
    );

    // Atualizar status no banco de dados
    await supabase
      .from("whatsapp_instances")
      .update({
        status: response.data.state,
        updated_at: new Date().toISOString(),
      })
      .eq("instance_name", instanceName);

    logger.info(`Status da instância ${instanceName}: ${response.data.state}`);
    return response.data;
  } catch (error) {
    logger.error(
      `Erro ao verificar status da instância WhatsApp: ${error.message}`
    );
    throw error;
  }
}

/**
 * Listar todas as instâncias disponíveis
 * @returns {Promise<Array>} Lista de instâncias
 */
async function listInstances() {
  try {
    const response = await evolutionApi.get("/instance/fetchInstances");
    logger.info(`${response.data.length} instâncias encontradas`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao listar instâncias WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Desconectar uma instância
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} Resultado da desconexão
 */
async function disconnectInstance(instanceName) {
  try {
    const response = await evolutionApi.delete(
      `/instance/logout/${instanceName}`
    );

    // Atualizar status no banco de dados
    await supabase
      .from("whatsapp_instances")
      .update({
        status: "disconnected",
        updated_at: new Date().toISOString(),
      })
      .eq("instance_name", instanceName);

    logger.info(`Instância WhatsApp desconectada: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao desconectar instância WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Excluir uma instância
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} Resultado da exclusão
 */
async function deleteInstance(instanceName) {
  try {
    const response = await evolutionApi.delete(
      `/instance/delete/${instanceName}`
    );

    // Remover do banco de dados
    await supabase
      .from("whatsapp_instances")
      .delete()
      .eq("instance_name", instanceName);

    logger.info(`Instância WhatsApp excluída: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao excluir instância WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Definir webhook para uma instância específica
 * @param {string} instanceName - Nome da instância
 * @param {string} webhookUrl - URL do webhook
 * @returns {Promise<Object>} Resultado da configuração
 */
async function setInstanceWebhook(instanceName, webhookUrl) {
  try {
    const response = await evolutionApi.post(
      `/instance/webhook/${instanceName}`,
      {
        webhook: true,
        webhookUrl,
      }
    );

    // Atualizar no banco de dados
    await supabase
      .from("whatsapp_instances")
      .update({
        webhook_url: webhookUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("instance_name", instanceName);

    logger.info(
      `Webhook configurado para instância ${instanceName}: ${webhookUrl}`
    );
    return response.data;
  } catch (error) {
    logger.error(
      `Erro ao configurar webhook para instância WhatsApp: ${error.message}`
    );
    throw error;
  }
}

/**
 * Reiniciar uma instância
 * @param {string} instanceName - Nome da instância
 * @returns {Promise<Object>} Resultado do reinício
 */
async function restartInstance(instanceName) {
  try {
    const response = await evolutionApi.post(
      `/instance/restart/${instanceName}`
    );

    // Atualizar status no banco de dados
    await supabase
      .from("whatsapp_instances")
      .update({
        status: "restarting",
        updated_at: new Date().toISOString(),
      })
      .eq("instance_name", instanceName);

    logger.info(`Instância WhatsApp reiniciada: ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao reiniciar instância WhatsApp: ${error.message}`);
    throw error;
  }
}

/**
 * Enviar mensagem de texto
 * @param {string} instanceName - Nome da instância
 * @param {string} to - Número de telefone do destinatário (com DDI e DDD)
 * @param {string} message - Conteúdo da mensagem
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendTextMessage(instanceName, to, message) {
  try {
    const response = await evolutionApi.post(`/message/text/${instanceName}`, {
      number: to,
      options: {
        delay: 1200,
        presence: "composing",
      },
      textMessage: {
        text: message,
      },
    });

    logger.info(`Mensagem enviada para ${to} pela instância ${instanceName}`);
    return response.data;
  } catch (error) {
    logger.error(`Erro ao enviar mensagem: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createInstance,
  connectInstance,
  getQrCode,
  checkInstanceStatus,
  listInstances,
  disconnectInstance,
  deleteInstance,
  setInstanceWebhook,
  restartInstance,
  sendTextMessage,
};
