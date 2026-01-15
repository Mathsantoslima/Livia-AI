const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Obtém o valor de uma configuração
 * @param {string} key - Chave da configuração
 * @returns {Promise<any>} Valor da configuração
 */
async function getConfig(key) {
  try {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .eq("key", key)
      .single();

    if (error) throw error;
    return data?.value;
  } catch (error) {
    logger.error(`Erro ao obter configuração ${key}:`, error);
    throw error;
  }
}

/**
 * Define o valor de uma configuração
 * @param {string} key - Chave da configuração
 * @param {any} value - Valor da configuração
 * @param {string} description - Descrição da configuração
 * @returns {Promise<void>}
 */
async function setConfig(key, value, description) {
  try {
    const { error } = await supabase.from("configs").upsert({
      key,
      value,
      description,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  } catch (error) {
    logger.error(`Erro ao definir configuração ${key}:`, error);
    throw error;
  }
}

/**
 * Remove uma configuração
 * @param {string} key - Chave da configuração
 * @returns {Promise<void>}
 */
async function removeConfig(key) {
  try {
    const { error } = await supabase.from("configs").delete().eq("key", key);

    if (error) throw error;
  } catch (error) {
    logger.error(`Erro ao remover configuração ${key}:`, error);
    throw error;
  }
}

/**
 * Lista todas as configurações
 * @returns {Promise<Array>} Lista de configurações
 */
async function listConfigs() {
  try {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .order("key");

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao listar configurações:", error);
    throw error;
  }
}

/**
 * Obtém configurações do sistema
 * @returns {Promise<Object>} Configurações do sistema
 */
async function getSystemConfigs() {
  try {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .like("key", "system.%");

    if (error) throw error;

    const configs = {};
    data.forEach((config) => {
      const key = config.key.replace("system.", "");
      configs[key] = config.value;
    });

    return configs;
  } catch (error) {
    logger.error("Erro ao obter configurações do sistema:", error);
    throw error;
  }
}

/**
 * Atualiza configurações do sistema
 * @param {Object} configs - Configurações do sistema
 * @returns {Promise<void>}
 */
async function setSystemConfigs(configs) {
  try {
    const updates = Object.entries(configs).map(([key, value]) => ({
      key: `system.${key}`,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("configs").upsert(updates);

    if (error) throw error;
  } catch (error) {
    logger.error("Erro ao atualizar configurações do sistema:", error);
    throw error;
  }
}

/**
 * Obtém configurações de notificações
 * @returns {Promise<Object>} Configurações de notificações
 */
async function getNotificationConfigs() {
  try {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .like("key", "notification.%");

    if (error) throw error;

    const configs = {};
    data.forEach((config) => {
      const key = config.key.replace("notification.", "");
      configs[key] = config.value;
    });

    return configs;
  } catch (error) {
    logger.error("Erro ao obter configurações de notificações:", error);
    throw error;
  }
}

/**
 * Atualiza configurações de notificações
 * @param {Object} configs - Configurações de notificações
 * @returns {Promise<void>}
 */
async function setNotificationConfigs(configs) {
  try {
    const updates = Object.entries(configs).map(([key, value]) => ({
      key: `notification.${key}`,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("configs").upsert(updates);

    if (error) throw error;
  } catch (error) {
    logger.error("Erro ao atualizar configurações de notificações:", error);
    throw error;
  }
}

/**
 * Obtém configurações do modelo
 * @returns {Promise<Object>} Configurações do modelo
 */
async function getModelConfigs() {
  try {
    const { data, error } = await supabase
      .from("configs")
      .select("*")
      .like("key", "model.%");

    if (error) throw error;

    const configs = {};
    data.forEach((config) => {
      const key = config.key.replace("model.", "");
      configs[key] = config.value;
    });

    return configs;
  } catch (error) {
    logger.error("Erro ao obter configurações do modelo:", error);
    throw error;
  }
}

/**
 * Atualiza configurações do modelo
 * @param {Object} configs - Configurações do modelo
 * @returns {Promise<void>}
 */
async function setModelConfigs(configs) {
  try {
    const updates = Object.entries(configs).map(([key, value]) => ({
      key: `model.${key}`,
      value,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("configs").upsert(updates);

    if (error) throw error;
  } catch (error) {
    logger.error("Erro ao atualizar configurações do modelo:", error);
    throw error;
  }
}

module.exports = {
  getConfig,
  setConfig,
  removeConfig,
  listConfigs,
  getSystemConfigs,
  setSystemConfigs,
  getNotificationConfigs,
  setNotificationConfigs,
  getModelConfigs,
  setModelConfigs,
};
