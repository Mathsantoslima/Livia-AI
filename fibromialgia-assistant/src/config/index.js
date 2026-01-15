/**
 * Configurações para o projeto FibroIA
 */

require("dotenv").config();

module.exports = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  // Configurações do Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // Configurações do WhatsApp
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL || "http://localhost:8080",
    apiKey: process.env.WHATSAPP_API_KEY,
    instances: {
      primary: "primary",
    },
    webhook: {
      enabled: process.env.WEBHOOK_ENABLED === "true",
      url: process.env.WEBHOOK_URL,
    },
  },

  // Configurações do assistente
  assistant: {
    // Frequência (em ms) para verificar alertas e enviar notificações
    checkInterval: parseInt(process.env.ASSISTANT_CHECK_INTERVAL || 3600000),
    // Tempo máximo (em ms) para considerar uma conversa como inativa
    conversationTimeout: parseInt(process.env.CONVERSATION_TIMEOUT || 1800000),
  },
};
