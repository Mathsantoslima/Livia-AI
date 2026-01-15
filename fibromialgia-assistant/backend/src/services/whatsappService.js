const axios = require("axios");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const evolutionApiService = require("./evolutionApiService");

// Configuração da API do WhatsApp
const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://localhost:8080";
const EVOLUTION_API_KEY =
  process.env.WHATSAPP_API_KEY ||
  process.env.EVOLUTION_API_KEY ||
  "12588eb53f90c49aff2f0cdfca0a4878";
const DEFAULT_INSTANCE =
  process.env.DEFAULT_WHATSAPP_INSTANCE || "fibromialgia";

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
  logger.warn(
    "Configuração da API do WhatsApp não encontrada, usando valores padrão"
  );
}

// Cliente HTTP para a API do WhatsApp
const whatsappClient = axios.create({
  baseURL: EVOLUTION_API_URL,
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": EVOLUTION_API_KEY,
  },
});

/**
 * Envia uma mensagem de texto via WhatsApp
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} message - Mensagem a ser enviada
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendTextMessage(
  phone,
  message,
  instanceName = DEFAULT_INSTANCE
) {
  try {
    // Limpar número de telefone (remover @s.whatsapp.net se existir)
    const cleanPhone = phone.replace(/@s\.whatsapp\.net$/, "");

    // Enviar mensagem via Baileys API
    const response = await whatsappClient.post("/send", {
      to: cleanPhone,
      message: message,
    });

    // Registrar envio no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone: cleanPhone,
        message_type: "text",
        content: message,
        status: "sent",
        instance_name: instanceName,
        api_response: response.data,
      },
    ]);

    logger.info(
      `Mensagem enviada para ${cleanPhone} via instância ${instanceName}`
    );
  } catch (error) {
    logger.error(`Erro ao enviar mensagem para ${phone}:`, error);

    // Registrar erro no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone,
        message_type: "text",
        content: message,
        instance_name: instanceName,
        status: "error",
        error_message: error.message,
      },
    ]);

    throw error;
  }
}

/**
 * Envia uma mensagem de imagem via WhatsApp
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} imageUrl - URL da imagem
 * @param {string} caption - Legenda da imagem
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendImageMessage(
  phone,
  imageUrl,
  caption = "",
  instanceName = DEFAULT_INSTANCE
) {
  try {
    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, "");
    const fullPhone = formattedPhone.startsWith("55")
      ? formattedPhone
      : `55${formattedPhone}`;

    // Enviar imagem via Evolution API
    const response = await whatsappClient.post(
      `/message/sendImage/${instanceName}`,
      {
        number: fullPhone,
        options: {
          delay: 1200,
        },
        imageMessage: {
          image: imageUrl,
          caption: caption,
        },
      }
    );

    // Registrar envio no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone: fullPhone,
        message_type: "image",
        content: imageUrl,
        caption: caption,
        instance_name: instanceName,
        status: "sent",
        api_response: response.data,
      },
    ]);

    logger.info(
      `Imagem enviada para ${fullPhone} via instância ${instanceName}`
    );
  } catch (error) {
    logger.error(`Erro ao enviar imagem para ${phone}:`, error);

    // Registrar erro no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone,
        message_type: "image",
        content: imageUrl,
        caption: caption,
        instance_name: instanceName,
        status: "error",
        error_message: error.message,
      },
    ]);

    throw error;
  }
}

/**
 * Envia uma mensagem de áudio via WhatsApp
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} audioUrl - URL do áudio
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendAudioMessage(
  phone,
  audioUrl,
  instanceName = DEFAULT_INSTANCE
) {
  try {
    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, "");
    const fullPhone = formattedPhone.startsWith("55")
      ? formattedPhone
      : `55${formattedPhone}`;

    // Enviar áudio via Evolution API
    const response = await whatsappClient.post(
      `/message/sendVoice/${instanceName}`,
      {
        number: fullPhone,
        options: {
          delay: 1200,
        },
        audioMessage: {
          audio: audioUrl,
        },
      }
    );

    // Registrar envio no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone: fullPhone,
        message_type: "audio",
        content: audioUrl,
        instance_name: instanceName,
        status: "sent",
        api_response: response.data,
      },
    ]);

    logger.info(
      `Áudio enviado para ${fullPhone} via instância ${instanceName}`
    );
  } catch (error) {
    logger.error(`Erro ao enviar áudio para ${phone}:`, error);

    // Registrar erro no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone,
        message_type: "audio",
        content: audioUrl,
        instance_name: instanceName,
        status: "error",
        error_message: error.message,
      },
    ]);

    throw error;
  }
}

/**
 * Envia uma mensagem de vídeo via WhatsApp
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} videoUrl - URL do vídeo
 * @param {string} caption - Legenda do vídeo
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendVideoMessage(
  phone,
  videoUrl,
  caption = "",
  instanceName = DEFAULT_INSTANCE
) {
  try {
    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, "");
    const fullPhone = formattedPhone.startsWith("55")
      ? formattedPhone
      : `55${formattedPhone}`;

    // Enviar vídeo via Evolution API
    const response = await whatsappClient.post(
      `/message/sendVideo/${instanceName}`,
      {
        number: fullPhone,
        options: {
          delay: 1200,
        },
        videoMessage: {
          video: videoUrl,
          caption: caption,
        },
      }
    );

    // Registrar envio no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone: fullPhone,
        message_type: "video",
        content: videoUrl,
        caption: caption,
        instance_name: instanceName,
        status: "sent",
        api_response: response.data,
      },
    ]);

    logger.info(
      `Vídeo enviado para ${fullPhone} via instância ${instanceName}`
    );
  } catch (error) {
    logger.error(`Erro ao enviar vídeo para ${phone}:`, error);

    // Registrar erro no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone,
        message_type: "video",
        content: videoUrl,
        caption: caption,
        instance_name: instanceName,
        status: "error",
        error_message: error.message,
      },
    ]);

    throw error;
  }
}

/**
 * Envia uma mensagem de documento via WhatsApp
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} documentUrl - URL do documento
 * @param {string} fileName - Nome do arquivo
 * @param {string} caption - Legenda do documento
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendDocumentMessage(
  phone,
  documentUrl,
  fileName,
  caption = "",
  instanceName = DEFAULT_INSTANCE
) {
  try {
    // Formatar número de telefone
    const formattedPhone = phone.replace(/\D/g, "");
    const fullPhone = formattedPhone.startsWith("55")
      ? formattedPhone
      : `55${formattedPhone}`;

    // Enviar documento via Evolution API
    const response = await whatsappClient.post(
      `/message/sendDocument/${instanceName}`,
      {
        number: fullPhone,
        options: {
          delay: 1200,
        },
        documentMessage: {
          document: documentUrl,
          fileName: fileName,
          caption: caption,
        },
      }
    );

    // Registrar envio no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone: fullPhone,
        message_type: "document",
        content: documentUrl,
        file_name: fileName,
        caption: caption,
        instance_name: instanceName,
        status: "sent",
        api_response: response.data,
      },
    ]);

    logger.info(
      `Documento enviado para ${fullPhone} via instância ${instanceName}`
    );
  } catch (error) {
    logger.error(`Erro ao enviar documento para ${phone}:`, error);

    // Registrar erro no banco de dados
    await supabase.from("message_logs").insert([
      {
        phone,
        message_type: "document",
        content: documentUrl,
        file_name: fileName,
        caption: caption,
        instance_name: instanceName,
        status: "error",
        error_message: error.message,
      },
    ]);

    throw error;
  }
}

/**
 * Verifica o status de uma mensagem
 * @param {string} messageId - ID da mensagem
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<Object>} Status da mensagem
 */
async function checkMessageStatus(messageId, instanceName = DEFAULT_INSTANCE) {
  try {
    const response = await whatsappClient.get(
      `/message/${messageId}/${instanceName}`
    );

    // Atualizar status no banco de dados
    await supabase
      .from("message_logs")
      .update({
        status: response.data.status,
        updated_at: new Date().toISOString(),
      })
      .eq("message_id", messageId);

    return response.data;
  } catch (error) {
    logger.error(`Erro ao verificar status da mensagem ${messageId}:`, error);
    throw error;
  }
}

/**
 * Envia uma mensagem de texto via WhatsApp (wrapper para facilitar o uso)
 * @param {string} phone - Número de telefone do destinatário
 * @param {string} message - Mensagem a ser enviada
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<void>}
 */
async function sendMessage(phone, message, instanceName = DEFAULT_INSTANCE) {
  // Por padrão, enviar como texto
  return sendTextMessage(phone, message, instanceName);
}

/**
 * Verifica o status da conexão do WhatsApp
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<Object>} Status da conexão
 */
async function checkConnection(instanceName = DEFAULT_INSTANCE) {
  try {
    // Usar o serviço do Evolution API para verificar status
    const status = await evolutionApiService.checkInstanceStatus(instanceName);

    return {
      connected: status.state === "open",
      state: status.state,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Erro ao verificar status da conexão:", error);

    return {
      connected: false,
      state: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Obtém uma lista de instâncias disponíveis
 * @returns {Promise<Array>} Lista de instâncias
 */
async function getInstances() {
  try {
    return await evolutionApiService.listInstances();
  } catch (error) {
    logger.error("Erro ao listar instâncias:", error);
    throw error;
  }
}

/**
 * Obtém o QR code para conexão
 * @param {string} instanceName - Nome da instância (opcional)
 * @returns {Promise<Object>} QR Code
 */
async function getQrCode(instanceName = DEFAULT_INSTANCE) {
  try {
    return await evolutionApiService.getQrCode(instanceName);
  } catch (error) {
    logger.error("Erro ao obter QR code:", error);
    throw error;
  }
}

module.exports = {
  sendTextMessage,
  sendImageMessage,
  sendAudioMessage,
  sendVideoMessage,
  sendDocumentMessage,
  checkMessageStatus,
  checkConnection,
  sendMessage,
  getInstances,
  getQrCode,
};
