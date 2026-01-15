/**
 * =========================================
 * CLAUDE PROVIDER - ANTHROPIC API
 * =========================================
 */

const BaseProvider = require("./BaseProvider");
const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../../utils/logger");

class ClaudeProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: "Claude",
      apiKey: config.apiKey || process.env.CLAUDE_API_KEY,
      model: config.model || process.env.CLAUDE_MODEL || "claude-3-sonnet-20240229",
      ...config,
    });

    // Só inicializar cliente se tiver API key
    if (this.apiKey) {
      this.client = new Anthropic({
        apiKey: this.apiKey,
      });
    } else {
      this.client = null;
      logger.warn("[Claude] API key não configurada. Provider desabilitado.");
    }
  }

  /**
   * Prepara mensagens para formato Claude
   */
  prepareMessages(systemPrompt, messages) {
    // Claude usa array de mensagens
    const formattedMessages = [];

    // Converter mensagens do histórico
    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    });

    return {
      system: systemPrompt,
      messages: formattedMessages,
    };
  }

  /**
   * Gera resposta usando Claude
   */
  async generate(systemPrompt, messages, options = {}) {
    try {
      // Verificar se cliente está inicializado
      if (!this.client || !this.client.messages) {
        throw new Error("Claude API key não configurada ou cliente não inicializado");
      }

      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
      } = options;

      // Preparar mensagens
      const { system, messages: formattedMessages } = this.prepareMessages(
        systemPrompt,
        messages
      );

      // Chamar API
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        top_p: topP,
        system,
        messages: formattedMessages,
      });

      // Claude retorna array de content blocks
      const text = message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");

      return {
        text: text.trim(),
        provider: "claude",
        model: this.model,
        usage: {
          inputTokens: message.usage?.input_tokens || 0,
          outputTokens: message.usage?.output_tokens || 0,
          totalTokens:
            (message.usage?.input_tokens || 0) +
            (message.usage?.output_tokens || 0),
        },
        raw: message,
      };
    } catch (error) {
      logger.error("[Claude] Erro ao gerar resposta:", error);
      throw error;
    }
  }

  /**
   * Obtém informações do provider
   */
  getInfo() {
    return {
      ...super.getInfo(),
      provider: "claude",
      api: "Anthropic API",
    };
  }
}

module.exports = ClaudeProvider;
