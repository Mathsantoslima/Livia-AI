const logger = require("./logger");

/**
 * Códigos de erro customizados para o assistente
 */
const ErrorCodes = {
  // Erros gerais (1xxx)
  UNKNOWN_ERROR: 1000,
  VALIDATION_ERROR: 1001,
  NOT_FOUND: 1002,
  UNAUTHORIZED: 1003,
  FORBIDDEN: 1004,
  RATE_LIMITED: 1005,

  // Erros de IA (2xxx)
  AI_SERVICE_ERROR: 2000,
  OPENAI_ERROR: 2001,
  CLAUDE_ERROR: 2002,
  CONTEXT_TOO_LARGE: 2003,
  MODEL_UNAVAILABLE: 2004,
  CONTENT_FILTERED: 2005,

  // Erros de banco de dados (3xxx)
  DB_ERROR: 3000,
  SUPABASE_ERROR: 3001,
  DATA_INTEGRITY_ERROR: 3002,
  QUERY_ERROR: 3003,

  // Erros de WhatsApp (4xxx)
  WHATSAPP_ERROR: 4000,
  MESSAGE_SEND_FAILED: 4001,
  WEBHOOK_ERROR: 4002,
  MEDIA_ERROR: 4003,

  // Erros de usuário (5xxx)
  USER_ERROR: 5000,
  USER_NOT_FOUND: 5001,
  INVALID_INPUT: 5002,
  SESSION_EXPIRED: 5003,
};

/**
 * Classe de erro customizada para o assistente
 */
class AssistantError extends Error {
  /**
   * Cria uma nova instância de AssistantError
   * @param {string} message - Mensagem de erro
   * @param {number} code - Código de erro (de ErrorCodes)
   * @param {Object} details - Detalhes adicionais do erro
   * @param {Error} originalError - Erro original, se houver
   */
  constructor(
    message,
    code = ErrorCodes.UNKNOWN_ERROR,
    details = null,
    originalError = null
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Capturar stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converte o erro para um objeto amigável para log
   * @returns {Object} - Objeto com informações do erro
   */
  toLogObject() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError
        ? {
            name: this.originalError.name,
            message: this.originalError.message,
            stack: this.originalError.stack,
          }
        : null,
    };
  }

  /**
   * Converte o erro para resposta de API
   * @returns {Object} - Objeto para resposta HTTP
   */
  toApiResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        timestamp: this.timestamp,
      },
    };
  }
}

/**
 * Gerenciador de erros para o assistente
 */
class ErrorHandler {
  /**
   * Gerencia um erro, realizando log e formatando para resposta
   * @param {Error|AssistantError} error - Erro a ser gerenciado
   * @param {boolean} logError - Indica se o erro deve ser logado
   * @returns {AssistantError} - Erro formatado como AssistantError
   */
  static handleError(error, logError = true) {
    let assistantError;

    // Converter para AssistantError se necessário
    if (error instanceof AssistantError) {
      assistantError = error;
    } else {
      // Determinar código de erro com base no tipo
      let code = ErrorCodes.UNKNOWN_ERROR;

      if (error.name === "ValidationError") {
        code = ErrorCodes.VALIDATION_ERROR;
      } else if (error.name === "NotFoundError") {
        code = ErrorCodes.NOT_FOUND;
      } else if (error.name === "UnauthorizedError") {
        code = ErrorCodes.UNAUTHORIZED;
      } else if (
        error.message.includes("supabase") ||
        error.message.includes("database")
      ) {
        code = ErrorCodes.DB_ERROR;
      } else if (error.message.includes("openai")) {
        code = ErrorCodes.OPENAI_ERROR;
      } else if (
        error.message.includes("claude") ||
        error.message.includes("anthropic")
      ) {
        code = ErrorCodes.CLAUDE_ERROR;
      } else if (error.message.includes("whatsapp")) {
        code = ErrorCodes.WHATSAPP_ERROR;
      }

      assistantError = new AssistantError(
        error.message || "Erro desconhecido",
        code,
        null,
        error
      );
    }

    // Logar o erro se necessário
    if (logError) {
      if (assistantError.code >= 5000) {
        // Erros de usuário - log de nível info
        logger.info("Erro de usuário:", assistantError.toLogObject());
      } else if (assistantError.code >= 4000) {
        // Erros de WhatsApp - log de nível warning
        logger.warn("Erro de WhatsApp:", assistantError.toLogObject());
      } else if (assistantError.code >= 3000) {
        // Erros de banco de dados - log de nível error
        logger.error("Erro de banco de dados:", assistantError.toLogObject());
      } else if (assistantError.code >= 2000) {
        // Erros de IA - log de nível error
        logger.error("Erro de serviço de IA:", assistantError.toLogObject());
      } else {
        // Outros erros - log de nível error
        logger.error("Erro do sistema:", assistantError.toLogObject());
      }
    }

    return assistantError;
  }

  /**
   * Trata erros específicos da OpenAI
   * @param {Error} error - Erro da OpenAI
   * @returns {AssistantError} - Erro formatado
   */
  static handleOpenAIError(error) {
    let code = ErrorCodes.OPENAI_ERROR;
    let message = "Erro no serviço OpenAI";

    // Tentar extrair informações específicas do erro
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Determinar código e mensagem com base no status HTTP
      if (status === 400) {
        code = ErrorCodes.VALIDATION_ERROR;
        message = "Requisição inválida para a OpenAI";
      } else if (status === 401) {
        code = ErrorCodes.UNAUTHORIZED;
        message = "Autenticação falhou com a OpenAI";
      } else if (status === 429) {
        code = ErrorCodes.RATE_LIMITED;
        message = "Limite de requisições atingido na OpenAI";
      } else if (status === 500) {
        code = ErrorCodes.MODEL_UNAVAILABLE;
        message = "Serviço OpenAI indisponível";
      }

      // Adicionar detalhes do erro se disponíveis
      if (errorData && errorData.error) {
        if (errorData.error.message) {
          message += `: ${errorData.error.message}`;
        }

        if (
          errorData.error.type === "tokens" ||
          errorData.error.code === "context_length_exceeded"
        ) {
          code = ErrorCodes.CONTEXT_TOO_LARGE;
          message = "O contexto da conversa é muito longo para processamento";
        } else if (
          errorData.error.type === "moderation" ||
          errorData.error.code === "content_filter"
        ) {
          code = ErrorCodes.CONTENT_FILTERED;
          message = "O conteúdo foi filtrado pelo sistema de moderação";
        }
      }
    }

    return new AssistantError(message, code, null, error);
  }

  /**
   * Trata erros específicos do Claude (Anthropic)
   * @param {Error} error - Erro do Claude
   * @returns {AssistantError} - Erro formatado
   */
  static handleClaudeError(error) {
    let code = ErrorCodes.CLAUDE_ERROR;
    let message = "Erro no serviço Claude (Anthropic)";

    // Tentar extrair informações específicas do erro
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Determinar código e mensagem com base no status HTTP
      if (status === 400) {
        code = ErrorCodes.VALIDATION_ERROR;
        message = "Requisição inválida para o Claude";
      } else if (status === 401) {
        code = ErrorCodes.UNAUTHORIZED;
        message = "Autenticação falhou com o Claude";
      } else if (status === 429) {
        code = ErrorCodes.RATE_LIMITED;
        message = "Limite de requisições atingido no Claude";
      } else if (status === 500) {
        code = ErrorCodes.MODEL_UNAVAILABLE;
        message = "Serviço Claude indisponível";
      }

      // Adicionar detalhes do erro se disponíveis
      if (errorData && errorData.error) {
        if (errorData.error.message) {
          message += `: ${errorData.error.message}`;
        }

        if (
          errorData.error.type === "context_too_long" ||
          errorData.error.type === "invalid_prompt"
        ) {
          code = ErrorCodes.CONTEXT_TOO_LARGE;
          message = "O contexto da conversa é muito longo para processamento";
        } else if (errorData.error.type === "content_moderation") {
          code = ErrorCodes.CONTENT_FILTERED;
          message = "O conteúdo foi filtrado pelo sistema de moderação";
        }
      }
    }

    return new AssistantError(message, code, null, error);
  }

  /**
   * Trata erros específicos do Supabase
   * @param {Error} error - Erro do Supabase
   * @returns {AssistantError} - Erro formatado
   */
  static handleSupabaseError(error) {
    let code = ErrorCodes.SUPABASE_ERROR;
    let message = "Erro no serviço Supabase";

    // Tentar extrair informações específicas do erro
    if (error.error_description) {
      message = `Erro Supabase: ${error.error_description}`;
    } else if (error.message) {
      message = `Erro Supabase: ${error.message}`;
    } else if (error.details) {
      message = `Erro Supabase: ${error.details}`;
    }

    // Determinar código com base no tipo de erro
    if (error.code === "42P01" || error.code === "42703") {
      // Erros de tabela ou coluna não existente
      code = ErrorCodes.QUERY_ERROR;
    } else if (error.code === "23505") {
      // Violação de unicidade
      code = ErrorCodes.DATA_INTEGRITY_ERROR;
      message = "Registro duplicado detectado";
    } else if (error.code === "23503") {
      // Violação de chave estrangeira
      code = ErrorCodes.DATA_INTEGRITY_ERROR;
      message = "Referência inválida a outro registro";
    } else if (error.code === "57014") {
      // Query cancelada
      code = ErrorCodes.QUERY_ERROR;
      message = "Consulta foi cancelada por tempo limite";
    } else if (error.status === 401 || error.statusCode === 401) {
      code = ErrorCodes.UNAUTHORIZED;
      message = "Autenticação falhou com o Supabase";
    } else if (error.status === 403 || error.statusCode === 403) {
      code = ErrorCodes.FORBIDDEN;
      message = "Acesso negado ao recurso solicitado";
    } else if (error.status === 404 || error.statusCode === 404) {
      code = ErrorCodes.NOT_FOUND;
      message = "Recurso não encontrado no Supabase";
    }

    return new AssistantError(message, code, null, error);
  }

  /**
   * Trata erros específicos do WhatsApp
   * @param {Error} error - Erro do WhatsApp
   * @returns {AssistantError} - Erro formatado
   */
  static handleWhatsAppError(error) {
    let code = ErrorCodes.WHATSAPP_ERROR;
    let message = "Erro no serviço WhatsApp";

    // Extrair dados do erro se disponíveis
    const responseData = error.response?.data;

    if (responseData && responseData.error) {
      const waError = responseData.error;

      // Definir mensagem com base no erro do WhatsApp
      message = `Erro WhatsApp: ${
        waError.message || waError.error_data?.details || "Erro desconhecido"
      }`;

      // Determinar código com base no tipo de erro
      if (waError.code === 100 || waError.code === 3) {
        // Erro de parâmetro ou formato inválido
        code = ErrorCodes.INVALID_INPUT;
      } else if (waError.code === 131047 || waError.code === 131021) {
        // Erro de template/mensagem rejeitada
        code = ErrorCodes.MESSAGE_SEND_FAILED;
      } else if (waError.code === 132000 || waError.code === 132001) {
        // Erro de mídia
        code = ErrorCodes.MEDIA_ERROR;
      } else if (waError.code === 133 || waError.code === 200) {
        // Permissões ou autenticação
        code = ErrorCodes.UNAUTHORIZED;
      } else if (waError.code === 429) {
        // Rate limiting
        code = ErrorCodes.RATE_LIMITED;
      } else if (waError.code === 500) {
        // Erro interno do servidor WhatsApp
        code = ErrorCodes.WHATSAPP_ERROR;
      }
    } else if (error.message) {
      // Usar mensagem do erro diretamente
      message = `Erro WhatsApp: ${error.message}`;

      // Determinar código com base na mensagem
      if (error.message.includes("status code 401")) {
        code = ErrorCodes.UNAUTHORIZED;
      } else if (error.message.includes("status code 429")) {
        code = ErrorCodes.RATE_LIMITED;
      } else if (
        error.message.includes("media") ||
        error.message.includes("file")
      ) {
        code = ErrorCodes.MEDIA_ERROR;
      } else if (
        error.message.includes("send") ||
        error.message.includes("message")
      ) {
        code = ErrorCodes.MESSAGE_SEND_FAILED;
      } else if (error.message.includes("webhook")) {
        code = ErrorCodes.WEBHOOK_ERROR;
      }
    }

    return new AssistantError(message, code, null, error);
  }

  /**
   * Middleware para Express para tratamento de erros
   * @param {Error} err - Erro capturado
   * @param {Object} req - Objeto de requisição do Express
   * @param {Object} res - Objeto de resposta do Express
   * @param {Function} next - Função next do Express
   */
  static expressErrorHandler(err, req, res, next) {
    const assistantError = ErrorHandler.handleError(err);

    // Mapear código de erro para status HTTP
    let httpStatus;

    if (
      assistantError.code === ErrorCodes.VALIDATION_ERROR ||
      assistantError.code === ErrorCodes.INVALID_INPUT
    ) {
      httpStatus = 400; // Bad Request
    } else if (assistantError.code === ErrorCodes.UNAUTHORIZED) {
      httpStatus = 401; // Unauthorized
    } else if (assistantError.code === ErrorCodes.FORBIDDEN) {
      httpStatus = 403; // Forbidden
    } else if (
      assistantError.code === ErrorCodes.NOT_FOUND ||
      assistantError.code === ErrorCodes.USER_NOT_FOUND
    ) {
      httpStatus = 404; // Not Found
    } else if (assistantError.code === ErrorCodes.RATE_LIMITED) {
      httpStatus = 429; // Too Many Requests
    } else {
      httpStatus = 500; // Internal Server Error
    }

    // Enviar resposta com o erro
    res.status(httpStatus).json(assistantError.toApiResponse());
  }
}

module.exports = {
  ErrorCodes,
  AssistantError,
  ErrorHandler,
};
