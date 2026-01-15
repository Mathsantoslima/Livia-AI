const { OpenAI } = require("openai");
const { config } = require("../config");
const logger = require("../utils/logger");

// Verificar as configurações da OpenAI
if (!config.openai.apiKey) {
  logger.error(
    "Chave da API OpenAI não configurada! Verifique as variáveis de ambiente."
  );
}

// Configurar o cliente da API OpenAI
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  organization: config.openai.organization || undefined,
});

/**
 * Utilitário para interações com a API da OpenAI
 */
class OpenAIService {
  /**
   * Gera uma resposta do modelo da OpenAI
   * @param {Array} messages - Mensagens no formato de conversação da OpenAI
   * @param {Object} options - Opções para a geração de texto
   * @returns {Promise<Object>} - Resposta gerada
   */
  static async generateChatCompletion(messages, options = {}) {
    try {
      const {
        model = config.openai.modelVersion || "gpt-4-turbo",
        temperature = config.assistant.defaultTemperature,
        maxTokens = null,
        topP = null,
        frequencyPenalty = null,
        presencePenalty = null,
        tools = null,
        systemMessage = null,
      } = options;

      // Adicionar mensagem do sistema, se fornecida
      if (systemMessage && !messages.some((msg) => msg.role === "system")) {
        messages.unshift({ role: "system", content: systemMessage });
      }

      // Configuração da requisição
      const requestOptions = {
        model,
        messages,
        temperature,
      };

      // Adicionar opções adicionais, se fornecidas
      if (maxTokens) requestOptions.max_tokens = maxTokens;
      if (topP) requestOptions.top_p = topP;
      if (frequencyPenalty) requestOptions.frequency_penalty = frequencyPenalty;
      if (presencePenalty) requestOptions.presence_penalty = presencePenalty;
      if (tools) requestOptions.tools = tools;

      // Fazer a chamada à API
      const response = await openai.chat.completions.create(requestOptions);

      return {
        text: response.choices[0].message.content,
        usage: response.usage,
        message: response.choices[0].message,
      };
    } catch (error) {
      logger.error("Erro ao gerar completions com OpenAI:", error);
      throw error;
    }
  }

  /**
   * Analisa o sentimento de um texto
   * @param {string} text - Texto a ser analisado
   * @returns {Promise<Object>} - Análise de sentimento
   */
  static async analyzeSentiment(text) {
    try {
      const messages = [
        {
          role: "system",
          content:
            "Analise o sentimento do texto a seguir, fornecendo uma classificação (positivo, negativo ou neutro) e um score de -1 a 1, onde -1 é extremamente negativo, 0 é neutro e 1 é extremamente positivo. Forneça também as principais emoções detectadas. Responda em formato JSON.",
        },
        { role: "user", content: text },
      ];

      const { message } = await this.generateChatCompletion(messages, {
        temperature: 0.3,
      });

      // Tentar extrair objeto JSON da resposta
      try {
        let jsonResponse;
        const content = message.content;

        // Verificar se a resposta é um JSON válido ou se precisa de extração
        if (content.includes("{") && content.includes("}")) {
          const jsonStr = content.substring(
            content.indexOf("{"),
            content.lastIndexOf("}") + 1
          );
          jsonResponse = JSON.parse(jsonStr);
        } else {
          jsonResponse = {
            error: "Formato de resposta inválido",
            raw: content,
          };
        }

        return jsonResponse;
      } catch (parseError) {
        logger.error("Erro ao analisar resposta JSON:", parseError);
        return {
          error: "Erro ao analisar resposta",
          classification: "neutro",
          score: 0,
          emotions: [],
        };
      }
    } catch (error) {
      logger.error("Erro ao analisar sentimento:", error);
      throw error;
    }
  }

  /**
   * Classifica o texto em categorias relacionadas à fibromialgia
   * @param {string} text - Texto a ser classificado
   * @returns {Promise<Object>} - Classificação do texto
   */
  static async classifyContent(text) {
    try {
      const messages = [
        {
          role: "system",
          content: `
            Classifique o texto do usuário nas seguintes categorias relacionadas à fibromialgia:
            1. Relato de Sintomas
            2. Pedido de Informação
            3. Feedback de Tratamento
            4. Busca de Suporte Emocional
            5. Pergunta sobre Medicação
            6. Consulta de Estilo de Vida
            7. Outro (especificar)
            
            Também indique o nível de urgência (baixo, médio, alto) com base no conteúdo.
            Responda em formato JSON com as propriedades: "categoria", "urgencia", "justificativa".
          `,
        },
        { role: "user", content: text },
      ];

      const { message } = await this.generateChatCompletion(messages, {
        temperature: 0.2,
      });

      // Tentar extrair objeto JSON da resposta
      try {
        let jsonResponse;
        const content = message.content;

        // Verificar se a resposta é um JSON válido ou se precisa de extração
        if (content.includes("{") && content.includes("}")) {
          const jsonStr = content.substring(
            content.indexOf("{"),
            content.lastIndexOf("}") + 1
          );
          jsonResponse = JSON.parse(jsonStr);
        } else {
          jsonResponse = {
            error: "Formato de resposta inválido",
            raw: content,
          };
        }

        return jsonResponse;
      } catch (parseError) {
        logger.error("Erro ao analisar resposta JSON:", parseError);
        return {
          categoria: "Outro",
          urgencia: "baixo",
          justificativa: "Não foi possível classificar adequadamente o texto.",
        };
      }
    } catch (error) {
      logger.error("Erro ao classificar conteúdo:", error);
      throw error;
    }
  }

  /**
   * Extrai informações relevantes sobre fibromialgia de um texto
   * @param {string} text - Texto a ser analisado
   * @returns {Promise<Object>} - Informações extraídas
   */
  static async extractFibromyalgiaInfo(text) {
    try {
      const messages = [
        {
          role: "system",
          content: `
            Extraia informações relacionadas à fibromialgia do texto do usuário. Identifique:
            - Sintomas mencionados
            - Nível de dor (se mencionado)
            - Fatores desencadeantes
            - Medicações mencionadas
            - Tratamentos mencionados
            - Estado emocional
            
            Responda em formato JSON.
          `,
        },
        { role: "user", content: text },
      ];

      const { message } = await this.generateChatCompletion(messages, {
        temperature: 0.2,
      });

      // Tentar extrair objeto JSON da resposta
      try {
        let jsonResponse;
        const content = message.content;

        // Verificar se a resposta é um JSON válido ou se precisa de extração
        if (content.includes("{") && content.includes("}")) {
          const jsonStr = content.substring(
            content.indexOf("{"),
            content.lastIndexOf("}") + 1
          );
          jsonResponse = JSON.parse(jsonStr);
        } else {
          jsonResponse = {
            error: "Formato de resposta inválido",
            raw: content,
          };
        }

        return jsonResponse;
      } catch (parseError) {
        logger.error("Erro ao analisar resposta JSON:", parseError);
        return {
          error: "Erro ao analisar resposta",
          sintomas: [],
          nivelDor: null,
          fatoresDesencadeantes: [],
          medicacoes: [],
          tratamentos: [],
          estadoEmocional: null,
        };
      }
    } catch (error) {
      logger.error("Erro ao extrair informações de fibromialgia:", error);
      throw error;
    }
  }

  /**
   * Gera uma recomendação para o usuário com base em seu histórico
   * @param {Object} userData - Dados do usuário e seu histórico
   * @returns {Promise<Object>} - Recomendação gerada
   */
  static async generateRecommendation(userData) {
    try {
      const {
        symptoms = [],
        painLevels = [],
        medications = [],
        activities = [],
        sleepQuality = [],
        recentConversations = [],
      } = userData;

      // Criar um resumo do histórico do usuário
      const userSummary = JSON.stringify({
        sintomas_recentes: symptoms,
        niveis_dor_recentes: painLevels,
        medicacoes: medications,
        atividades_recentes: activities,
        qualidade_sono: sleepQuality,
        conversas_recentes: recentConversations
          .slice(0, 5)
          .map((c) => c.content),
      });

      const messages = [
        {
          role: "system",
          content: `
            Você é um assistente especializado em fibromialgia. Com base no histórico do usuário,
            gere uma recomendação personalizada. Considere:
            
            1. Padrões de sintomas e fatores desencadeantes
            2. Eficácia de medicamentos e tratamentos anteriores
            3. Rotina de atividades e qualidade do sono
            4. Necessidades emocionais e de suporte
            
            Forneça recomendações práticas, baseadas em evidências e personalizadas.
            Estruture sua resposta em formato JSON com as seguintes seções:
            - "recomendacaoPrincipal": recomendação principal resumida
            - "justificativa": explicação da recomendação
            - "acoesSugeridas": lista de 2-3 ações específicas
            - "recursosAdicionais": opcional, recursos que possam ajudar
          `,
        },
        {
          role: "user",
          content: `Meu histórico de fibromialgia: ${userSummary}`,
        },
      ];

      const { message } = await this.generateChatCompletion(messages, {
        model: "gpt-4-turbo",
        temperature: 0.4,
      });

      // Tentar extrair objeto JSON da resposta
      try {
        let jsonResponse;
        const content = message.content;

        // Verificar se a resposta é um JSON válido ou se precisa de extração
        if (content.includes("{") && content.includes("}")) {
          const jsonStr = content.substring(
            content.indexOf("{"),
            content.lastIndexOf("}") + 1
          );
          jsonResponse = JSON.parse(jsonStr);
        } else {
          jsonResponse = {
            recomendacaoPrincipal: content.substring(0, 100) + "...",
            justificativa: "Gerada pelo assistente",
            acoesSugeridas: [
              "Consulte seu médico para recomendações específicas",
            ],
            recursosAdicionais: [],
          };
        }

        return jsonResponse;
      } catch (parseError) {
        logger.error("Erro ao analisar resposta JSON:", parseError);
        return {
          recomendacaoPrincipal:
            "Consulte seu médico para orientações personalizadas.",
          justificativa: "Baseado nos seus sintomas recentes.",
          acoesSugeridas: [
            "Consulte seu médico",
            "Mantenha um diário de sintomas",
            "Pratique técnicas de relaxamento",
          ],
          recursosAdicionais: [],
        };
      }
    } catch (error) {
      logger.error("Erro ao gerar recomendação:", error);
      throw error;
    }
  }
}

module.exports = { openai, OpenAIService };
