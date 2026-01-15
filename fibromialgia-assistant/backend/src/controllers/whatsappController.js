const axios = require("axios");
const config = require("../config");
const wApiService = require("../services/wApiService");
const logger = require("../utils/logger");

/**
 * Controlador para gerenciar operações do WhatsApp
 * Suporta W-API e Baileys/Evolution API
 */
class WhatsAppController {
  /**
   * Verifica se deve usar W-API
   */
  _shouldUseWApi() {
    return config.wApi.useWApi && config.wApi.token;
  }

  /**
   * Gera e retorna um QR code para pareamento do WhatsApp
   */
  async getQRCode(req, res) {
    try {
      // Usar W-API se configurado
      if (this._shouldUseWApi()) {
        try {
          const qrCodeData = await wApiService.getQrCode(
            config.wApi.instanceId,
            {
              image: "enable",
              syncContacts: "disable",
            }
          );

          return res.status(200).json({
            status: "success",
            qrcode: qrCodeData.qrcode || qrCodeData,
            instanceId: config.wApi.instanceId,
            message: "QR Code gerado com sucesso. Escaneie com seu WhatsApp.",
          });
        } catch (wApiError) {
          logger.error("Erro ao obter QR Code da W-API:", wApiError);
          // Fallback para método antigo
        }
      }

      // Fallback: método antigo (Baileys/Evolution)
      const response = await axios.get(`${config.whatsappApi.url}/qrcode`, {
        headers: {
          "x-api-key": config.whatsappApi.key,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Erro ao gerar QR code:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao gerar QR code",
        error: error.message,
      });
    }
  }

  /**
   * Verifica o status da conexão com o WhatsApp
   */
  async getStatus(req, res) {
    try {
      // Usar W-API se configurado
      if (this._shouldUseWApi()) {
        try {
          const status = await wApiService.checkInstanceStatus(
            config.wApi.instanceId
          );

          return res.status(200).json({
            status: "success",
            data: {
              connection:
                status.status === "connected" || status.state === "open"
                  ? "connected"
                  : "disconnected",
              phone: status.connectedPhone || null,
              state: status.status || status.state || "unknown",
              instanceId: config.wApi.instanceId,
              platform: status.platform,
              name: status.name,
            },
            timestamp: new Date().toISOString(),
          });
        } catch (wApiError) {
          logger.error("Erro ao verificar status da W-API:", wApiError);
          // Fallback para método antigo
        }
      }

      // Fallback: método antigo (Baileys/Evolution)
      const response = await axios.get(`${config.whatsappApi.url}/status`, {
        headers: {
          "x-api-key": config.whatsappApi.key,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Erro ao verificar status do WhatsApp:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao verificar status do WhatsApp",
        error: error.message,
      });
    }
  }

  /**
   * Desconecta a sessão do WhatsApp
   */
  async disconnect(req, res) {
    try {
      // Usar W-API se configurado
      if (this._shouldUseWApi()) {
        try {
          const result = await wApiService.disconnectInstance(
            config.wApi.instanceId
          );

          return res.status(200).json({
            status: "success",
            message: "WhatsApp desconectado com sucesso",
            instanceId: config.wApi.instanceId,
            data: result,
          });
        } catch (wApiError) {
          logger.error("Erro ao desconectar W-API:", wApiError);
          // Fallback para método antigo
        }
      }

      // Fallback: método antigo (Baileys/Evolution)
      const response = await axios.post(
        `${config.whatsappApi.url}/logout`,
        {},
        {
          headers: {
            "x-api-key": config.whatsappApi.key,
          },
        }
      );

      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Erro ao desconectar WhatsApp:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao desconectar WhatsApp",
        error: error.message,
      });
    }
  }

  /**
   * Envia uma mensagem via WhatsApp
   */
  async sendMessage(req, res) {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({
          status: "error",
          message: 'Parâmetros "to" e "message" são obrigatórios',
        });
      }

      // Usar W-API se configurado
      if (this._shouldUseWApi()) {
        try {
          const result = await wApiService.sendTextMessage(
            config.wApi.instanceId,
            to,
            message
          );

          return res.status(200).json({
            status: "success",
            data: {
              messageId: result.messageId,
              to: to,
              message: message,
              instanceId: config.wApi.instanceId,
            },
          });
        } catch (wApiError) {
          logger.error("Erro ao enviar mensagem via W-API:", wApiError);
          // Fallback para método antigo
        }
      }

      // Fallback: método antigo (Baileys/Evolution)
      const response = await axios.post(
        `${config.whatsappApi.url}/send`,
        { to, message },
        {
          headers: {
            "x-api-key": config.whatsappApi.key,
          },
        }
      );

      return res.status(200).json(response.data);
    } catch (error) {
      logger.error("Erro ao enviar mensagem:", error);
      return res.status(500).json({
        status: "error",
        message: "Erro ao enviar mensagem",
        error: error.message,
      });
    }
  }
}

module.exports = new WhatsAppController();
