/**
 * =========================================
 * PROCESSADOR DE MÍDIA MULTIMODAL
 * =========================================
 *
 * Processa diferentes tipos de mídia:
 * - Áudio: transcreve para texto
 * - Imagem: analisa contexto e extrai informações
 * - Documento: lê e resume conteúdo
 */

const axios = require("axios");
const FormData = require("form-data");
const logger = require("../utils/logger");
const { supabase } = require("../config/supabase");

class MediaProcessor {
  constructor() {
    // Configurações de APIs
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.googleApiKey = process.env.GOOGLE_AI_API_KEY;
  }

  /**
   * Processa áudio: transcreve para texto
   * @param {string} audioUrl - URL do áudio
   * @param {string} mimeType - Tipo MIME do áudio (ex: audio/ogg, audio/mp4)
   * @returns {Promise<Object>} { text: string, language: string }
   */
  async processAudio(audioUrl, mimeType = "audio/ogg") {
    try {
      logger.info(
        `[MediaProcessor] Processando áudio: ${audioUrl}, tipo: ${mimeType}`
      );

      if (!audioUrl) {
        throw new Error("URL do áudio não fornecida");
      }

      // Baixar áudio
      logger.info(`[MediaProcessor] Baixando áudio de: ${audioUrl}`);
      const audioResponse = await axios.get(audioUrl, {
        responseType: "arraybuffer",
        timeout: 60000, // Aumentar timeout para áudios maiores
        maxContentLength: 50 * 1024 * 1024, // 50MB máximo
      });

      const audioBuffer = Buffer.from(audioResponse.data);
      logger.info(
        `[MediaProcessor] Áudio baixado: ${audioBuffer.length} bytes`
      );

      // Usar OpenAI Whisper para transcrição (melhor qualidade)
      if (this.openaiApiKey) {
        try {
          const formData = new FormData();
          formData.append("file", audioBuffer, {
            filename: "audio.ogg",
            contentType: mimeType,
          });
          formData.append("model", "whisper-1");
          formData.append("language", "pt"); // Português

          logger.info(
            `[MediaProcessor] Enviando áudio para OpenAI Whisper (${audioBuffer.length} bytes)`
          );

          const response = await axios.post(
            "https://api.openai.com/v1/audio/transcriptions",
            formData,
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                ...formData.getHeaders(),
              },
              timeout: 120000, // 2 minutos para áudios maiores
              maxContentLength: 50 * 1024 * 1024,
            }
          );

          const transcription = response.data.text || "";
          logger.info(
            `[MediaProcessor] Transcrição concluída: ${transcription.substring(
              0,
              100
            )}...`
          );

          return {
            text: transcription,
            language: response.data.language || "pt",
            provider: "openai",
          };
        } catch (openaiError) {
          logger.warn(
            "[MediaProcessor] Erro ao transcrever com OpenAI, tentando Google:",
            openaiError.message
          );
        }
      }

      // Fallback: Google Speech-to-Text
      if (this.googleApiKey) {
        // Implementar Google Speech-to-Text se necessário
        // Por enquanto, retornar erro se OpenAI falhar
        throw new Error("Google Speech-to-Text não implementado ainda");
      }

      throw new Error("Nenhum serviço de transcrição disponível");
    } catch (error) {
      logger.error("[MediaProcessor] Erro ao processar áudio:", error);
      throw error;
    }
  }

  /**
   * Processa imagem: analisa contexto e extrai informações
   * @param {string} imageUrl - URL da imagem
   * @param {string} caption - Legenda da imagem (se houver)
   * @returns {Promise<Object>} { description: string, context: string, relevantInfo: string[] }
   */
  async processImage(imageUrl, caption = "") {
    try {
      logger.info(`[MediaProcessor] Processando imagem: ${imageUrl}`);

      // Baixar imagem
      const imageResponse = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const imageBuffer = Buffer.from(imageResponse.data);
      const imageBase64 = imageBuffer.toString("base64");

      // Usar Google Gemini Vision (melhor para análise de imagens)
      if (this.googleApiKey) {
        try {
          const { GoogleGenerativeAI } = require("@google/generative-ai");
          const genAI = new GoogleGenerativeAI(this.googleApiKey);
          const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
          });

          const prompt = `Analise esta imagem e forneça:
1. Descrição detalhada do que você vê
2. Contexto relevante (se for exame médico, foto do dia a dia, etc)
3. Informações importantes para uma pessoa com fibromialgia
4. Perguntas ou observações relevantes

${caption ? `Legenda fornecida: "${caption}"` : ""}

Seja específico e empático.`;

          const result = await model.generateContent([
            {
              inlineData: {
                data: imageBase64,
                mimeType: imageResponse.headers["content-type"] || "image/jpeg",
              },
            },
            { text: prompt },
          ]);

          const response = await result.response;
          const analysis = response.text();

          // Extrair informações estruturadas
          const description = this._extractFromAnalysis(analysis, "descrição");
          const context = this._extractFromAnalysis(analysis, "contexto");
          const relevantInfo = this._extractListFromAnalysis(analysis);

          return {
            description: description || analysis,
            context: context || "",
            relevantInfo: relevantInfo || [],
            fullAnalysis: analysis,
            provider: "gemini",
          };
        } catch (geminiError) {
          logger.warn(
            "[MediaProcessor] Erro ao processar imagem com Gemini:",
            geminiError.message
          );
        }
      }

      // Fallback: OpenAI Vision
      if (this.openaiApiKey) {
        try {
          const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: `Analise esta imagem e forneça descrição, contexto e informações relevantes para uma pessoa com fibromialgia. ${
                        caption ? `Legenda: "${caption}"` : ""
                      }`,
                    },
                    {
                      type: "image_url",
                      image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`,
                      },
                    },
                  ],
                },
              ],
              max_tokens: 500,
            },
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                "Content-Type": "application/json",
              },
              timeout: 60000,
            }
          );

          const analysis = response.data.choices[0].message.content;

          return {
            description: analysis,
            context: "",
            relevantInfo: [],
            fullAnalysis: analysis,
            provider: "openai",
          };
        } catch (openaiError) {
          logger.error(
            "[MediaProcessor] Erro ao processar imagem com OpenAI:",
            openaiError.message
          );
        }
      }

      throw new Error("Nenhum serviço de análise de imagem disponível");
    } catch (error) {
      logger.error("[MediaProcessor] Erro ao processar imagem:", error);
      throw error;
    }
  }

  /**
   * Processa documento: lê e resume conteúdo
   * @param {string} documentUrl - URL do documento
   * @param {string} mimeType - Tipo MIME (ex: application/pdf, text/plain)
   * @returns {Promise<Object>} { text: string, summary: string, relevantInfo: string[] }
   */
  async processDocument(documentUrl, mimeType = "application/pdf") {
    try {
      logger.info(`[MediaProcessor] Processando documento: ${documentUrl}`);

      // Baixar documento
      const docResponse = await axios.get(documentUrl, {
        responseType: "arraybuffer",
        timeout: 60000,
      });

      const docBuffer = Buffer.from(docResponse.data);

      // Para PDF, usar biblioteca de leitura de PDF
      if (mimeType === "application/pdf") {
        // Por enquanto, usar OpenAI com arquivo
        if (this.openaiApiKey) {
          try {
            // Converter PDF para texto (simplificado - em produção usar pdf-parse)
            // Por enquanto, retornar que precisa de biblioteca específica
            logger.warn(
              "[MediaProcessor] Processamento de PDF requer biblioteca pdf-parse"
            );

            // Fallback: tentar extrair texto básico
            const text = this._extractTextFromPDF(docBuffer);

            if (text) {
              return await this._summarizeText(text);
            }
          } catch (error) {
            logger.error("[MediaProcessor] Erro ao processar PDF:", error);
          }
        }
      }

      // Para texto simples
      if (mimeType.startsWith("text/")) {
        const text = docBuffer.toString("utf-8");
        return await this._summarizeText(text);
      }

      throw new Error(`Tipo de documento não suportado: ${mimeType}`);
    } catch (error) {
      logger.error("[MediaProcessor] Erro ao processar documento:", error);
      throw error;
    }
  }

  /**
   * Resume texto usando IA
   */
  async _summarizeText(text) {
    try {
      if (this.googleApiKey) {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(this.googleApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash-latest",
        });

        const prompt = `Resuma este documento focando em informações relevantes para uma pessoa com fibromialgia.
Extraia pontos-chave e informações importantes.

Documento:
${text.substring(0, 10000)}`; // Limitar tamanho

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        return {
          text: text.substring(0, 5000), // Texto completo (limitado)
          summary: summary,
          relevantInfo: this._extractKeyPoints(summary),
          provider: "gemini",
        };
      }

      // Fallback básico
      return {
        text: text.substring(0, 5000),
        summary: text.substring(0, 500),
        relevantInfo: [],
        provider: "fallback",
      };
    } catch (error) {
      logger.error("[MediaProcessor] Erro ao resumir texto:", error);
      throw error;
    }
  }

  /**
   * Extrai texto de PDF (simplificado)
   */
  _extractTextFromPDF(buffer) {
    // Em produção, usar biblioteca pdf-parse
    // Por enquanto, retornar null
    logger.warn(
      "[MediaProcessor] Extração de PDF não implementada completamente"
    );
    return null;
  }

  /**
   * Extrai informações de análise
   */
  _extractFromAnalysis(analysis, keyword) {
    const regex = new RegExp(`${keyword}[^:]*:([^\\n]+)`, "i");
    const match = analysis.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extrai lista de análise
   */
  _extractListFromAnalysis(analysis) {
    const lines = analysis.split("\n");
    return lines
      .filter((line) => line.trim().match(/^[-•*]\s/))
      .map((line) => line.replace(/^[-•*]\s/, "").trim());
  }

  /**
   * Extrai pontos-chave
   */
  _extractKeyPoints(text) {
    const lines = text.split("\n");
    return lines
      .filter((line) => line.trim().length > 10)
      .slice(0, 5)
      .map((line) => line.trim());
  }

  /**
   * Gera áudio a partir de texto (Text-to-Speech)
   * @param {string} text - Texto para converter em áudio
   * @param {string} language - Idioma (padrão: pt-BR)
   * @returns {Promise<Object>} { audioUrl: string, duration: number }
   */
  async generateAudioFromText(text, language = "pt-BR") {
    try {
      logger.info(
        `[MediaProcessor] Gerando áudio de ${text.length} caracteres`
      );

      // Usar OpenAI TTS (melhor qualidade)
      if (this.openaiApiKey) {
        try {
          const response = await axios.post(
            "https://api.openai.com/v1/audio/speech",
            {
              model: "tts-1",
              input: text,
              voice: "nova", // Voz feminina natural
              language: "pt", // Português
            },
            {
              headers: {
                Authorization: `Bearer ${this.openaiApiKey}`,
                "Content-Type": "application/json",
              },
              responseType: "arraybuffer",
              timeout: 60000,
            }
          );

          // Converter buffer para base64 ou salvar temporariamente
          // Por enquanto, vamos retornar o buffer e o caller deve fazer upload
          const audioBuffer = Buffer.from(response.data);

          // Upload para um serviço temporário ou retornar base64
          // Por simplicidade, vamos usar um serviço de upload temporário
          // Ou podemos salvar no Supabase Storage
          const base64Audio = audioBuffer.toString("base64");
          const dataUrl = `data:audio/mpeg;base64,${base64Audio}`;

          logger.info(
            `[MediaProcessor] Áudio gerado com sucesso (${audioBuffer.length} bytes)`
          );

          return {
            audioBuffer: audioBuffer,
            mimeType: "audio/mpeg",
            duration: Math.ceil(text.length / 10), // Estimativa: ~10 chars por segundo
            provider: "openai",
            dataUrl: dataUrl,
          };
        } catch (openaiError) {
          logger.warn(
            "[MediaProcessor] Erro ao gerar áudio com OpenAI:",
            openaiError.message
          );
          throw openaiError;
        }
      }

      throw new Error("Nenhum serviço de TTS disponível");
    } catch (error) {
      logger.error("[MediaProcessor] Erro ao gerar áudio:", error);
      throw error;
    }
  }
}

module.exports = new MediaProcessor();
