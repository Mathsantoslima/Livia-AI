/**
 * =========================================
 * CANAL WHATSAPP - ADAPTADOR
 * =========================================
 *
 * Adaptador desacoplado da IA
 * Responsável apenas por:
 * - Receber mensagens do WhatsApp
 * - Enviar mensagens para o WhatsApp
 * - Converter formatos entre WhatsApp e IA
 */

const logger = require("../utils/logger");
const wApiService = require("../services/wApiService");
const mediaProcessor = require("../services/mediaProcessor");

class WhatsAppChannel {
  constructor(agent, whatsappClient = null, config = {}) {
    this.agent = agent; // Agente de IA (ex: LiviaAgent)
    this.whatsappClient = whatsappClient; // Cliente WhatsApp (Baileys ou Evolution) - opcional
    this.messageQueue = new Map(); // Fila de mensagens por usuário

    // Configuração W-API
    this.useWApi = config.useWApi !== false; // Por padrão usa W-API
    this.instanceId =
      config.instanceId ||
      process.env.W_API_INSTANCE_ID ||
      wApiService.DEFAULT_INSTANCE_ID;
  }

  /**
   * Processa mensagem recebida do WhatsApp
   * @param {Object} messageData - Dados da mensagem do WhatsApp
   */
  async handleIncomingMessage(messageData) {
    try {
      const extracted = this._extractMessageData(messageData);
      const { from, body, messageId, timestamp, mediaType, mediaUrl } =
        extracted;

      if (!from) {
        logger.warn("Mensagem inválida recebida do WhatsApp (sem remetente)");
        return;
      }

      // Converter telefone para userId
      const userId = this._phoneToUserId(from);
      
      logger.info(
        `[WhatsApp] Mensagem recebida de ${from}. Tipo: ${mediaType || "texto"}, URL: ${mediaUrl || "N/A"}`
      );

      let processedContent = body || "";
      let mediaContext = null;
      let originalMediaType = mediaType; // Guardar tipo original para resposta

      // Processar mídia se presente
      if (mediaType && mediaUrl) {
        logger.info(
          `[WhatsApp] Iniciando processamento de mídia ${mediaType} de ${from}: ${mediaUrl}`
        );
        try {
          logger.info(
            `[WhatsApp] Processando mídia ${mediaType} de ${from}: ${mediaUrl}`
          );

          if (mediaType === "audio") {
            const audioResult = await mediaProcessor.processAudio(
              mediaUrl,
              extracted.mimeType
            );
            processedContent = audioResult.text;
            mediaContext = {
              type: "audio",
              transcription: audioResult.text,
              language: audioResult.language,
            };
            logger.info(
              `[WhatsApp] Áudio transcrito: ${processedContent.substring(
                0,
                50
              )}...`
            );
          } else if (mediaType === "image") {
            const imageResult = await mediaProcessor.processImage(
              mediaUrl,
              body // Caption se houver
            );
            processedContent = body
              ? `${body}\n\n[Imagem: ${imageResult.description}]`
              : `[Imagem: ${imageResult.description}]`;
            mediaContext = {
              type: "image",
              description: imageResult.description,
              context: imageResult.context,
              relevantInfo: imageResult.relevantInfo,
            };
            logger.info(
              `[WhatsApp] Imagem analisada: ${imageResult.description.substring(
                0,
                50
              )}...`
            );
          } else if (mediaType === "document") {
            const docResult = await mediaProcessor.processDocument(
              mediaUrl,
              extracted.mimeType
            );
            processedContent = body
              ? `${body}\n\n[Documento resumido: ${docResult.summary}]`
              : `[Documento: ${docResult.summary}]`;
            mediaContext = {
              type: "document",
              summary: docResult.summary,
              relevantInfo: docResult.relevantInfo,
              fullText: docResult.text.substring(0, 2000), // Limitar tamanho
            };
            logger.info(
              `[WhatsApp] Documento processado: ${docResult.summary.substring(
                0,
                50
              )}...`
            );
          }
        } catch (mediaError) {
          logger.error(
            `[WhatsApp] Erro ao processar mídia ${mediaType}:`,
            mediaError
          );
          // Continuar com texto se houver, ou enviar mensagem de erro
          if (!processedContent) {
            processedContent =
              "Recebi sua mídia, mas tive dificuldade para processá-la. Pode descrever o que enviou?";
          }
        }
      }

      // Se não há conteúdo processado, mas há mídia, tentar processar
      if (!processedContent && mediaType && mediaUrl) {
        logger.warn(
          `[WhatsApp] Mídia ${mediaType} não foi processada corretamente. URL: ${mediaUrl}`
        );
        // Continuar mesmo assim - o agente pode processar o contexto de mídia
      }

      if (!processedContent && !mediaContext) {
        logger.warn(
          "[WhatsApp] Mensagem sem conteúdo processável recebida do WhatsApp"
        );
        return;
      }

      logger.info(
        `[WhatsApp] Conteúdo processado de ${from}: ${processedContent ? processedContent.substring(0, 50) + "..." : "sem texto"} (mídia: ${mediaType || "nenhuma"})`
      );

      logger.info(
        `[WhatsApp] Processando mensagem com agente. userId: ${userId}, conteúdo: ${processedContent.substring(
          0,
          50
        )}...`
      );

      // Processar com o agente (incluindo contexto de mídia)
      // O LiviaAgent já verifica onboarding internamente
      // Passar tipo de mídia original para que possa responder no mesmo formato
      const response = await this.agent.processMessage(
        userId,
        processedContent || "[Áudio recebido]", // Garantir que sempre há conteúdo
        {
          channel: "whatsapp",
          messageId,
          timestamp,
          mediaType: originalMediaType, // Tipo original (audio, image, etc)
          mediaContext,
          originalBody: body, // Manter texto original se houver
          userSentAudio: originalMediaType === "audio", // Flag para indicar que usuário enviou áudio
        }
      );

      logger.info(
        `[WhatsApp] Resposta recebida do agente: ${
          response?.text?.substring(0, 50) || "sem texto"
        }...`
      );

      if (!response || !response.text) {
        logger.error(
          "[WhatsApp] Resposta do agente está vazia ou inválida:",
          response
        );
        // Enviar mensagem de erro ao invés de lançar exceção
        await this.sendMessage(
          from,
          "Desculpe, tive um problema ao processar sua mensagem. Pode repetir?"
        );
        return;
      }

      // Enviar resposta (passar contexto para detectar se deve responder em áudio)
      logger.info(`[WhatsApp] Enviando resposta para ${from}`);
      await this.sendResponse(from, response, {
        userSentAudio: originalMediaType === "audio",
        mediaType: originalMediaType,
      });
      logger.info(`[WhatsApp] Resposta enviada com sucesso para ${from}`);
    } catch (error) {
      logger.error("[WhatsApp] Erro ao processar mensagem:", error);

      // Enviar mensagem de erro mais amigável
      try {
        const errorMessage = error.message?.includes(
          "Todos os providers falharam"
        )
          ? "Olá! 😊 Estou tendo dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes. Se o problema persistir, pode ser necessário verificar as configurações dos serviços de IA."
          : "Desculpe, tive um problema técnico. Pode repetir?";

        await this.sendMessage(from, errorMessage);
      } catch (sendError) {
        logger.error("[WhatsApp] Erro ao enviar mensagem de erro:", sendError);
      }
    }
  }

  /**
   * Envia resposta do agente via WhatsApp
   * @param {string} phoneNumber - Número do WhatsApp
   * @param {Object} response - Resposta do agente
   */
  async sendResponse(phoneNumber, response) {
    try {
      const chunks = response.chunks || [response.text];

      // Enviar cada chunk com delay natural
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Delay entre mensagens (exceto a primeira)
        if (i > 0) {
          await this._delay(800);
        }

        // Simular tempo de digitação
        const typingDelay = Math.min(chunk.length * 30, 2000);
        await this._delay(typingDelay);

        // Enviar mensagem
        await this.sendMessage(phoneNumber, chunk);

        logger.info(
          `[WhatsApp] Enviado para ${phoneNumber}: ${chunk.substring(0, 50)}...`
        );
      }
    } catch (error) {
      logger.error("[WhatsApp] Erro ao enviar resposta:", error);
      throw error;
    }
  }

  /**
   * Envia mensagem simples via WhatsApp
   * @param {string} phoneNumber - Número do WhatsApp
   * @param {string} message - Mensagem a enviar
   */
  async sendMessage(phoneNumber, message) {
    try {
      // Usar W-API se configurado
      if (this.useWApi) {
        try {
          await wApiService.sendTextMessage(
            this.instanceId,
            phoneNumber,
            message,
            { delayMessage: 1 } // Delay mínimo para resposta rápida
          );
          return true;
        } catch (wApiError) {
          logger.error(
            "[WhatsApp] Erro ao enviar via W-API, tentando fallback:",
            wApiError.message
          );
          // Fallback para cliente direto se disponível
        }
      }

      // Fallback: usar cliente direto (Baileys/Evolution)
      if (this.whatsappClient) {
        // Formatar número
        const jid = this._formatPhoneNumber(phoneNumber);

        // Enviar via cliente
        if (this.whatsappClient.sendMessage) {
          await this.whatsappClient.sendMessage(jid, { text: message });
          return true;
        } else {
          logger.error(
            "[WhatsApp] Método sendMessage não disponível no cliente"
          );
          return false;
        }
      } else {
        logger.error(
          "[WhatsApp] Nenhum método de envio disponível (W-API ou cliente direto)"
        );
        return false;
      }
    } catch (error) {
      logger.error(
        `[WhatsApp] Erro ao enviar mensagem para ${phoneNumber}:`,
        error
      );
      return false;
    }
  }

  /**
   * Extrai dados da mensagem do WhatsApp
   */
  _extractMessageData(messageData) {
    // Suporta diferentes formatos (Baileys, Evolution, W-API, etc)

    // Formato W-API (prioridade - mais comum agora)
    if (messageData.sender || messageData.msgContent) {
      const from =
        messageData.sender?.id || messageData.chat?.id || messageData.from;

      let body = "";
      let mediaType = null;
      let mediaUrl = null;
      let mimeType = null;

      // Detectar tipo de mídia
      if (messageData.msgContent) {
        // Áudio
        if (messageData.msgContent.audioMessage) {
          mediaType = "audio";
          mediaUrl =
            messageData.msgContent.audioMessage.url ||
            messageData.msgContent.audioMessage.directPath;
          mimeType =
            messageData.msgContent.audioMessage.mimetype || "audio/ogg";
          body = messageData.msgContent.audioMessage.caption || "";
        }
        // Imagem
        else if (messageData.msgContent.imageMessage) {
          mediaType = "image";
          mediaUrl =
            messageData.msgContent.imageMessage.url ||
            messageData.msgContent.imageMessage.directPath;
          mimeType =
            messageData.msgContent.imageMessage.mimetype || "image/jpeg";
          body = messageData.msgContent.imageMessage.caption || "";
        }
        // Vídeo (tratar como mídia, mas não processar por enquanto)
        else if (messageData.msgContent.videoMessage) {
          mediaType = "video";
          mediaUrl =
            messageData.msgContent.videoMessage.url ||
            messageData.msgContent.videoMessage.directPath;
          mimeType =
            messageData.msgContent.videoMessage.mimetype || "video/mp4";
          body = messageData.msgContent.videoMessage.caption || "";
        }
        // Documento
        else if (messageData.msgContent.documentMessage) {
          mediaType = "document";
          mediaUrl =
            messageData.msgContent.documentMessage.url ||
            messageData.msgContent.documentMessage.directPath;
          mimeType =
            messageData.msgContent.documentMessage.mimetype ||
            "application/pdf";
          body = messageData.msgContent.documentMessage.caption || "";
        }
        // Texto
        else if (messageData.msgContent.extendedTextMessage?.text) {
          body = messageData.msgContent.extendedTextMessage.text;
        } else if (messageData.msgContent.conversation) {
          body = messageData.msgContent.conversation;
        }
      }

      // Fallback para texto simples
      if (!body && !mediaType) {
        if (messageData.text) {
          body = messageData.text;
        } else if (messageData.body) {
          body = messageData.body;
        }
      }

      const messageId = messageData.messageId || messageData.id;
      const timestamp =
        messageData.moment || messageData.timestamp || Date.now();

      return {
        from,
        body,
        messageId,
        timestamp,
        mediaType,
        mediaUrl,
        mimeType,
      };
    }

    // Formato Baileys
    if (messageData.key && messageData.message) {
      const from = messageData.key.remoteJid?.replace("@s.whatsapp.net", "");
      const body =
        messageData.message.conversation ||
        messageData.message.extendedTextMessage?.text ||
        messageData.message.imageMessage?.caption ||
        "";
      const messageId = messageData.key.id;
      const timestamp = messageData.messageTimestamp;

      return { from, body, messageId, timestamp };
    }

    // Formato Evolution
    if (messageData.data) {
      const data = messageData.data;
      const from =
        data.key?.remoteJid?.replace("@s.whatsapp.net", "") || data.from;
      const body = data.body || data.message?.conversation || "";
      const messageId = data.key?.id || data.id;
      const timestamp = data.timestamp || Date.now();

      return { from, body, messageId, timestamp };
    }

    // Formato genérico (quando já extraído)
    return {
      from: messageData.from || messageData.phone,
      body: messageData.body || messageData.message || messageData.text || "",
      messageId: messageData.id || messageData.messageId,
      timestamp: messageData.timestamp || messageData.moment || Date.now(),
    };
  }

  /**
   * Converte telefone para userId
   */
  _phoneToUserId(phone) {
    // Remove caracteres não numéricos
    return phone.replace(/[^\d]/g, "");
  }

  /**
   * Formata número para JID do WhatsApp
   */
  _formatPhoneNumber(phone) {
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/[^\d]/g, "");

    // Se já tem @s.whatsapp.net, retorna como está
    if (phone.includes("@s.whatsapp.net")) {
      return phone;
    }

    // Adiciona sufixo
    return `${cleanPhone}@s.whatsapp.net`;
  }

  /**
   * Delay helper
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Configura cliente WhatsApp
   */
  setWhatsAppClient(client) {
    this.whatsappClient = client;
    logger.info("[WhatsApp] Cliente configurado");
  }

  /**
   * Verifica se o canal está conectado
   */
  async isConnected() {
    if (this.useWApi) {
      try {
        const status = await wApiService.checkInstanceStatus(this.instanceId);
        return (
          status.status === "connected" ||
          status.state === "open" ||
          status.connectedPhone
        );
      } catch (error) {
        logger.warn(
          "[WhatsApp] Erro ao verificar status W-API:",
          error.message
        );
        return false;
      }
    }

    // Fallback para cliente direto
    return this.whatsappClient && this.whatsappClient.readyState === "open";
  }
}

module.exports = WhatsAppChannel;
