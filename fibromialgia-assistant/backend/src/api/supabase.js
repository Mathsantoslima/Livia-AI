const { createClient } = require("@supabase/supabase-js");
const { config } = require("../config");
const logger = require("../utils/logger");

// Verificação da configuração do Supabase
if (!config.supabase.url || !config.supabase.key) {
  logger.error(
    "Configuração do Supabase incompleta! Verifique as variáveis de ambiente."
  );
}

// Criar cliente do Supabase com chave padrão
const supabase = createClient(
  config.supabase.url || "http://localhost:8000",
  config.supabase.key || "seu-supabase-key-local"
);

// Criar cliente com chave de serviço para operações administrativas
const supabaseAdmin = config.supabase.serviceKey
  ? createClient(config.supabase.url, config.supabase.serviceKey)
  : supabase;

/**
 * Classe de helper para operações no Supabase
 */
class SupabaseClient {
  /**
   * Busca registros em uma tabela com filtros
   * @param {string} table - Nome da tabela
   * @param {Object} queryParams - Parâmetros de consulta e filtros
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado da consulta
   */
  static async select(table, queryParams = {}, options = {}) {
    try {
      const {
        select = "*",
        filters = [],
        order = null,
        ascending = false,
        limit = null,
        offset = null,
        page = null,
        perPage = null,
      } = queryParams;

      // Iniciar consulta
      let query = supabase.from(table).select(select);

      // Aplicar filtros
      if (Array.isArray(filters) && filters.length > 0) {
        filters.forEach((filter) => {
          const { column, operator, value } = filter;
          if (column && operator && value !== undefined) {
            query = query.filter(column, operator, value);
          }
        });
      }

      // Aplicar ordenação
      if (order) {
        query = query.order(order, { ascending });
      }

      // Aplicar paginação
      if (page !== null && perPage !== null) {
        const calculatedOffset = (page - 1) * perPage;
        query = query.range(calculatedOffset, calculatedOffset + perPage - 1);
      } else {
        // Aplicar limite e offset se fornecidos diretamente
        if (limit !== null) {
          query = query.limit(limit);
        }
        if (offset !== null) {
          query = query.offset(offset);
        }
      }

      // Executar consulta
      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return { data, count };
    } catch (error) {
      logger.error(`Erro ao selecionar dados da tabela ${table}:`, error);
      throw error;
    }
  }

  /**
   * Insere registros em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object|Array} records - Registro ou array de registros para inserir
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado da inserção
   */
  static async insert(table, records, options = {}) {
    try {
      const { returning = "representation" } = options;

      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select(returning);

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error(`Erro ao inserir dados na tabela ${table}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza registros em uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} updates - Campos a serem atualizados
   * @param {Object} conditions - Condições para a atualização
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado da atualização
   */
  static async update(table, updates, conditions, options = {}) {
    try {
      const { returning = "representation" } = options;

      let query = supabase.from(table).update(updates);

      // Aplicar condições
      if (typeof conditions === "object") {
        Object.entries(conditions).forEach(([column, value]) => {
          query = query.eq(column, value);
        });
      }

      const { data, error } = await query.select(returning);

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error(`Erro ao atualizar dados na tabela ${table}:`, error);
      throw error;
    }
  }

  /**
   * Remove registros de uma tabela
   * @param {string} table - Nome da tabela
   * @param {Object} conditions - Condições para a remoção
   * @param {Object} options - Opções adicionais
   * @returns {Promise<Object>} - Resultado da remoção
   */
  static async delete(table, conditions, options = {}) {
    try {
      const { returning = "representation" } = options;

      let query = supabase.from(table).delete();

      // Aplicar condições
      if (typeof conditions === "object") {
        Object.entries(conditions).forEach(([column, value]) => {
          query = query.eq(column, value);
        });
      }

      const { data, error } = await query.select(returning);

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error(`Erro ao remover dados da tabela ${table}:`, error);
      throw error;
    }
  }

  /**
   * Realiza uma consulta SQL personalizada (apenas com supabaseAdmin)
   * @param {string} sql - Consulta SQL
   * @param {Array} params - Parâmetros para a consulta
   * @returns {Promise<Object>} - Resultado da consulta
   */
  static async query(sql, params = []) {
    try {
      const { data, error } = await supabaseAdmin.rpc("exec_sql", {
        sql_query: sql,
        params,
      });

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error("Erro ao executar consulta SQL:", error);
      throw error;
    }
  }

  /**
   * Upload de arquivo para o storage do Supabase
   * @param {string} bucket - Nome do bucket
   * @param {string} path - Caminho do arquivo no bucket
   * @param {File|Blob|Buffer} file - Arquivo a ser enviado
   * @param {Object} options - Opções de upload
   * @returns {Promise<Object>} - Resultado do upload
   */
  static async uploadFile(bucket, path, file, options = {}) {
    try {
      const { contentType = null } = options;

      const uploadOptions = {};
      if (contentType) {
        uploadOptions.contentType = contentType;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, uploadOptions);

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error(`Erro ao fazer upload para ${bucket}/${path}:`, error);
      throw error;
    }
  }

  /**
   * Download de arquivo do storage do Supabase
   * @param {string} bucket - Nome do bucket
   * @param {string} path - Caminho do arquivo no bucket
   * @returns {Promise<Object>} - Resultado do download
   */
  static async downloadFile(bucket, path) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        throw error;
      }

      return { data };
    } catch (error) {
      logger.error(`Erro ao fazer download de ${bucket}/${path}:`, error);
      throw error;
    }
  }
}

module.exports = { supabase, supabaseAdmin, SupabaseClient };
