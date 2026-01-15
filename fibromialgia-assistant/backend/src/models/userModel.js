const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Cria um novo usuário
 * @param {Object} userData - Dados do usuário
 * @returns {Promise<Object>} Usuário criado
 */
async function createUser(userData) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .insert([
        {
          phone: userData.phone,
          name: userData.name,
          subscription_status: userData.subscription_status || "trial",
          subscription_expiry: userData.subscription_expiry,
          onboarding_completed: userData.onboarding_completed || false,
          subtype: userData.subtype,
          last_interaction: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao criar usuário:", error);
    throw error;
  }
}

/**
 * Obtém um usuário pelo ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Usuário encontrado
 */
async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter usuário:", error);
    throw error;
  }
}

/**
 * Obtém um usuário pelo telefone
 * @param {string} phone - Número de telefone
 * @returns {Promise<Object>} Usuário encontrado
 */
async function getUserByPhone(phone) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("phone", phone)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter usuário por telefone:", error);
    throw error;
  }
}

/**
 * Atualiza um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} userData - Dados para atualização
 * @returns {Promise<Object>} Usuário atualizado
 */
async function updateUser(userId, userData) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .update(userData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

/**
 * Lista usuários com filtros
 * @param {Object} filters - Filtros para busca
 * @returns {Promise<Object>} Lista de usuários e total
 */
async function listUsers(filters = {}) {
  try {
    let query = supabase.from("users_livia").select("*", { count: "exact" });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.subscription_status) {
      query = query.eq("subscription_status", filters.subscription_status);
    }
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    // Ordenação
    const sortBy = filters.sort_by || "created_at";
    const sortOrder = filters.sort_order || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Paginação
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const start = (page - 1) * limit;
    query = query.range(start, start + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  } catch (error) {
    logger.error("Erro ao listar usuários:", error);
    throw error;
  }
}

/**
 * Obtém usuários ativos
 * @returns {Promise<Array>} Lista de usuários ativos
 */
async function getActiveUsers() {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .select("*")
      .eq("subscription_status", "active")
      .gte("subscription_expiry", new Date().toISOString());

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter usuários ativos:", error);
    throw error;
  }
}

/**
 * Atualiza a última interação do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<void>}
 */
async function updateLastInteraction(userId) {
  try {
    const { error } = await supabase
      .from("users_livia")
      .update({ last_interaction: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    logger.error("Erro ao atualizar última interação:", error);
    throw error;
  }
}

/**
 * Marca o onboarding como concluído
 * @param {string} userId - ID do usuário
 * @returns {Promise<void>}
 */
async function completeOnboarding(userId) {
  try {
    const { error } = await supabase
      .from("users_livia")
      .update({ onboarding_completed: true })
      .eq("id", userId);

    if (error) throw error;
  } catch (error) {
    logger.error("Erro ao marcar onboarding como concluído:", error);
    throw error;
  }
}

module.exports = {
  createUser,
  getUserById,
  getUserByPhone,
  updateUser,
  listUsers,
  getActiveUsers,
  updateLastInteraction,
  completeOnboarding,
};
