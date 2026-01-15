const axios = require("axios");
const FormData = require("form-data");
const { config } = require("../config");
const logger = require("../utils/logger");

// Verificar as configurações do WhatsApp
if (!config.whatsapp.apiKey || !config.whatsapp.phoneNumberId) {
  logger.error(
    "Configuração do WhatsApp incompleta! Verifique as variáveis de ambiente."
  );
}

/**
 * Classe para interação com a API do WhatsApp
 */
class WhatsAppClient {
  constructor() {
    // Configurações da API
    this.apiKey = config.whatsapp.apiKey;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.baseUrl = config.whatsapp.baseUrl;
    this.businessAccountId = config.whatsapp.businessAccountId;
    this.apiVersion = "v18.0"; // Versão atual da API do WhatsApp

    // Headers padrão
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Cliente HTTP
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: this.defaultHeaders,
    });
  }

  /**
   * Envia uma mensagem de texto
   * @param {string} to - Número de telefone do destinatário (com código do país)
   * @param {string} text - Texto da mensagem
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendTextMessage(to, text, options = {}) {
    try {
      const { previewUrl = false } = options;

      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          body: text,
          preview_url: previewUrl,
        },
      };

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem de texto enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem de texto para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem de imagem
   * @param {string} to - Número de telefone do destinatário (com código do país)
   * @param {string} imageUrl - URL da imagem ou ID do attachment
   * @param {string} caption - Legenda opcional da imagem
   * @param {boolean} isId - Indica se imageUrl é um ID de attachment
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendImageMessage(to, imageUrl, caption = "", isId = false) {
    try {
      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const image = isId ? { id: imageUrl } : { link: imageUrl };

      if (caption) {
        image.caption = caption;
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "image",
        image,
      };

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem de imagem enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem de imagem para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem de documento
   * @param {string} to - Número de telefone do destinatário (com código do país)
   * @param {string} documentUrl - URL do documento ou ID do attachment
   * @param {string} filename - Nome do arquivo
   * @param {string} caption - Legenda opcional do documento
   * @param {boolean} isId - Indica se documentUrl é um ID de attachment
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendDocumentMessage(
    to,
    documentUrl,
    filename,
    caption = "",
    isId = false
  ) {
    try {
      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const document = isId ? { id: documentUrl } : { link: documentUrl };

      document.filename = filename;

      if (caption) {
        document.caption = caption;
      }

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document,
      };

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem de documento enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem de documento para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem de modelo/template
   * @param {string} to - Número de telefone do destinatário
   * @param {string} templateName - Nome do template
   * @param {string} language - Código do idioma (ex: "pt_BR")
   * @param {Array} components - Componentes do template
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendTemplateMessage(
    to,
    templateName,
    language = "pt_BR",
    components = []
  ) {
    try {
      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: language,
          },
        },
      };

      // Adicionar componentes, se fornecidos
      if (components && components.length > 0) {
        payload.template.components = components;
      }

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem de template "${templateName}" enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem de template para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem interativa (botões ou lista)
   * @param {string} to - Número de telefone do destinatário
   * @param {Object} interactive - Objeto com configuração interativa
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendInteractiveMessage(to, interactive) {
    try {
      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "interactive",
        interactive,
      };

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem interativa enviada para ${to}`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem interativa para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem com botões de ação rápida
   * @param {string} to - Número de telefone do destinatário
   * @param {string} headerText - Texto do cabeçalho (opcional)
   * @param {string} bodyText - Texto do corpo da mensagem
   * @param {string} footerText - Texto do rodapé (opcional)
   * @param {Array} buttons - Array de botões (máx. 3)
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendButtonMessage(
    to,
    bodyText,
    buttons,
    headerText = "",
    footerText = ""
  ) {
    try {
      // Limitar a 3 botões, que é o máximo permitido
      const limitedButtons = buttons.slice(0, 3).map((btn, index) => ({
        type: "reply",
        reply: {
          id: `btn_${index}_${Date.now()}`,
          title: btn.title.substring(0, 20), // Título máximo de 20 caracteres
        },
      }));

      const interactive = {
        type: "button",
        body: {
          text: bodyText,
        },
        action: {
          buttons: limitedButtons,
        },
      };

      // Adicionar cabeçalho, se fornecido
      if (headerText) {
        interactive.header = {
          type: "text",
          text: headerText,
        };
      }

      // Adicionar rodapé, se fornecido
      if (footerText) {
        interactive.footer = {
          text: footerText,
        };
      }

      return await this.sendInteractiveMessage(to, interactive);
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem com botões para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Envia uma mensagem com lista de opções
   * @param {string} to - Número de telefone do destinatário
   * @param {string} bodyText - Texto do corpo da mensagem
   * @param {string} buttonText - Texto do botão da lista
   * @param {Array} sections - Seções da lista
   * @param {string} headerText - Texto do cabeçalho (opcional)
   * @param {string} footerText - Texto do rodapé (opcional)
   * @returns {Promise<Object>} - Resposta da API
   */
  async sendListMessage(
    to,
    bodyText,
    buttonText,
    sections,
    headerText = "",
    footerText = ""
  ) {
    try {
      const interactive = {
        type: "list",
        body: {
          text: bodyText,
        },
        action: {
          button: buttonText,
          sections,
        },
      };

      // Adicionar cabeçalho, se fornecido
      if (headerText) {
        interactive.header = {
          type: "text",
          text: headerText,
        };
      }

      // Adicionar rodapé, se fornecido
      if (footerText) {
        interactive.footer = {
          text: footerText,
        };
      }

      return await this.sendInteractiveMessage(to, interactive);
    } catch (error) {
      logger.error(
        `Erro ao enviar mensagem com lista para ${to}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Marca uma mensagem como lida
   * @param {string} messageId - ID da mensagem
   * @returns {Promise<Object>} - Resposta da API
   */
  async markMessageAsRead(messageId) {
    try {
      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      };

      const response = await this.client.post(endpoint, payload);

      logger.info(`Mensagem ${messageId} marcada como lida`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao marcar mensagem como lida:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Faz upload de mídia para a API do WhatsApp
   * @param {Buffer|ReadStream} file - Arquivo a ser enviado
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {Promise<Object>} - Resposta da API com ID da mídia
   */
  async uploadMedia(file, mimeType) {
    try {
      const formData = new FormData();
      formData.append("messaging_product", "whatsapp");
      formData.append("file", file, {
        contentType: mimeType,
      });

      const endpoint = `/${this.apiVersion}/${this.phoneNumberId}/media`;

      const response = await axios.post(
        `${this.baseUrl}${endpoint}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      logger.info(`Mídia enviada com sucesso`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao fazer upload de mídia:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Obtém informações sobre um arquivo de mídia
   * @param {string} mediaId - ID da mídia
   * @returns {Promise<Object>} - Resposta da API com informações da mídia
   */
  async getMediaInfo(mediaId) {
    try {
      const endpoint = `/${this.apiVersion}/${mediaId}`;

      const response = await this.client.get(endpoint);

      logger.info(`Informações da mídia ${mediaId} obtidas com sucesso`);
      return response.data;
    } catch (error) {
      logger.error(
        `Erro ao obter informações da mídia:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Faz download de um arquivo de mídia
   * @param {string} mediaId - ID da mídia
   * @returns {Promise<Buffer>} - Buffer com o conteúdo do arquivo
   */
  async downloadMedia(mediaId) {
    try {
      // Primeiro, obter a URL de download
      const mediaInfo = await this.getMediaInfo(mediaId);

      if (!mediaInfo.url) {
        throw new Error(`URL de download não encontrada para mídia ${mediaId}`);
      }

      // Fazer o download do arquivo
      const response = await axios.get(mediaInfo.url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        responseType: "arraybuffer",
      });

      logger.info(`Mídia ${mediaId} baixada com sucesso`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(
        `Erro ao baixar mídia:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  /**
   * Verifica o token de verificação do webhook
   * @param {string} mode - Modo de verificação
   * @param {string} token - Token recebido
   * @param {string} challenge - Challenge recebido
   * @returns {boolean|string} - true se válido ou o challenge
   */
  verifyWebhook(mode, token, challenge) {
    const expectedToken = config.whatsapp.webhookVerifyToken;

    if (mode === "subscribe" && token === expectedToken) {
      logger.info("Webhook verificado com sucesso");
      return challenge;
    } else {
      logger.error("Falha na verificação do webhook");
      return false;
    }
  }

  /**
   * Processa dados recebidos do webhook
   * @param {Object} data - Dados do webhook
   * @returns {Array} - Mensagens processadas
   */
  processWebhookData(data) {
    try {
      // Verificar se é uma notificação de mensagem
      if (!data.entry || !data.entry.length) {
        return [];
      }

      const messages = [];

      // Processar cada entrada
      for (const entry of data.entry) {
        const changes = entry.changes || [];

        for (const change of changes) {
          // Verificar se é uma mudança de valor do WhatsApp
          if (change.field !== "messages" || !change.value) {
            continue;
          }

          const value = change.value;

          // Verificar se há mensagens
          if (!value.messages || !value.messages.length) {
            continue;
          }

          // Processar cada mensagem
          for (const msg of value.messages) {
            const sender = value.contacts && value.contacts[0];

            // Criar objeto de mensagem processada
            const processedMsg = {
              messageId: msg.id,
              from: msg.from,
              timestamp: msg.timestamp,
              type: msg.type,
              senderName: sender ? sender.profile.name : "Unknown",
              context: msg.context, // Para mensagens de resposta
            };

            // Adicionar conteúdo específico com base no tipo
            switch (msg.type) {
              case "text":
                processedMsg.text = msg.text.body;
                break;
              case "image":
                processedMsg.image = {
                  id: msg.image.id,
                  caption: msg.image.caption,
                  mimeType: msg.image.mime_type,
                };
                break;
              case "document":
                processedMsg.document = {
                  id: msg.document.id,
                  caption: msg.document.caption,
                  filename: msg.document.filename,
                  mimeType: msg.document.mime_type,
                };
                break;
              case "button":
                processedMsg.button = {
                  text: msg.button.text,
                  payload: msg.button.payload,
                };
                break;
              case "interactive":
                const interactive = msg.interactive;
                if (interactive.type === "button_reply") {
                  processedMsg.interactive = {
                    type: "button_reply",
                    id: interactive.button_reply.id,
                    title: interactive.button_reply.title,
                  };
                } else if (interactive.type === "list_reply") {
                  processedMsg.interactive = {
                    type: "list_reply",
                    id: interactive.list_reply.id,
                    title: interactive.list_reply.title,
                    description: interactive.list_reply.description,
                  };
                }
                break;
              // Adicionar mais tipos conforme necessário
            }

            messages.push(processedMsg);
          }
        }
      }

      return messages;
    } catch (error) {
      logger.error("Erro ao processar dados do webhook:", error);
      return [];
    }
  }
}

// Instância singleton do cliente WhatsApp
const whatsAppClient = new WhatsAppClient();

module.exports = whatsAppClient;
