require("dotenv").config();

// Configurações do ambiente
const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Banco de dados
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "fibromialgia",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    url: process.env.DATABASE_URL,
  },

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },

  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORGANIZATION,
    modelVersion: process.env.OPENAI_MODEL_VERSION || "gpt-4",
  },

  // Claude (Anthropic)
  claude: {
    apiKey: process.env.CLAUDE_API_KEY,
    modelVersion: process.env.CLAUDE_MODEL_VERSION || "claude-3-opus",
  },

  // WhatsApp
  whatsapp: {
    apiKey: process.env.WHATSAPP_API_KEY,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    baseUrl: process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0",
  },

  // Evolution API / WhatsApp Self-Hosted
  whatsappApi: {
    url: process.env.WHATSAPP_API_URL || "http://localhost:8080",
    key: process.env.WHATSAPP_API_KEY || "chave_api_whatsapp",
  },

  // W-API Configuration
  wApi: {
    url: process.env.W_API_URL || "https://api.w-api.app/v1",
    token: process.env.W_API_TOKEN || process.env.WHATSAPP_API_KEY,
    instanceId:
      process.env.W_API_INSTANCE_ID ||
      process.env.DEFAULT_WHATSAPP_INSTANCE ||
      "fibromialgia",
    useWApi: process.env.USE_W_API !== "false", // Por padrão usa W-API se token estiver configurado
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || "seu_segredo_jwt_super_secreto",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  // Configurações do assistente
  assistant: {
    defaultLanguage: process.env.DEFAULT_LANGUAGE || "pt-BR",
    maxHistoryLength: parseInt(process.env.MAX_HISTORY_LENGTH) || 10,
    defaultTemperature: parseFloat(process.env.DEFAULT_TEMPERATURE) || 0.7,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 1000,
    phoneNumber: process.env.ASSISTANT_PHONE_NUMBER || "(11) 93618-8540",
    phoneNumberRaw: process.env.ASSISTANT_PHONE_NUMBER_RAW || "5511936188540",
  },
};

// Constantes gerais da aplicação
const constants = {
  USER_TYPES: {
    PATIENT: "patient",
    DOCTOR: "doctor",
    ADMIN: "admin",
  },

  SEVERITY_LEVELS: {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  },

  MESSAGE_TYPES: {
    TEXT: "text",
    IMAGE: "image",
    AUDIO: "audio",
    VIDEO: "video",
    DOCUMENT: "document",
    LOCATION: "location",
  },

  ALERT_STATUS: {
    ACTIVE: "active",
    RESOLVED: "resolved",
    IGNORED: "ignored",
  },

  WHATSAPP_STATUS: {
    DISCONNECTED: "disconnected",
    CONNECTED: "connected",
    QR_CODE: "qr_code",
    CONNECTING: "connecting",
  },
};

module.exports = { config, constants };
