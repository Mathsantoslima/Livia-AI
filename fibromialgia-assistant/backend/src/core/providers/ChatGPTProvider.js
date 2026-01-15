/**
 * =========================================
 * CHATGPT PROVIDER - OPENAI API
 * =========================================
 */

const BaseProvider = require("./BaseProvider");
const OpenAI = require("openai");
const logger = require("../../utils/logger");

class ChatGPTProvider extends BaseProvider {
  constructor(config = {}) {
    super({
      name: "ChatGPT",
      apiKey: config.apiKey || process.env.OPENAI_API_KEY,
      model: config.model || process.env.OPENAI_MODEL || "gpt-4o-mini",
      ...config,
    });

    this.client = new OpenAI({
      apiKey: this.apiKey,
    });
  }

  /**
   * Prepara mensagens para formato OpenAI
   */
  prepareMessages(systemPrompt, messages) {
    // OpenAI usa array de mensagens com role e content
    const formattedMessages = [];

    // Adicionar system message
    if (systemPrompt) {
      formattedMessages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    // Converter mensagens do histórico
    messages.forEach((msg) => {
      formattedMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    });

    return formattedMessages;
  }

  /**
   * Gera resposta usando ChatGPT
   */
  async generate(systemPrompt, messages, options = {}) {
    try {
      const {
        temperature = 0.7,
        maxTokens = 1000,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
      } = options;

      // Preparar mensagens
      const formattedMessages = this.prepareMessages(systemPrompt, messages);

      // Chamar API
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: formattedMessages,
        temperature,
        max_tokens: maxTokens,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
      });

      const choice = completion.choices[0];
      const text = choice.message.content;

      return {
        text: text.trim(),
        provider: "chatgpt",
        model: this.model,
        usage: {
          promptTokens: completion.usage?.prompt_tokens || 0,
          completionTokens: completion.usage?.completion_tokens || 0,
          totalTokens: completion.usage?.total_tokens || 0,
        },
        raw: completion,
      };
    } catch (error) {
      logger.error("[ChatGPT] Erro ao gerar resposta:", error);
      throw error;
    }
  }

  /**
   * Obtém informações do provider
   */
  getInfo() {
    return {
      ...super.getInfo(),
      provider: "chatgpt",
      api: "OpenAI API",
    };
  }
}

module.exports = ChatGPTProvider;
