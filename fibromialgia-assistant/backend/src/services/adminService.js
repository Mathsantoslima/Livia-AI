const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Busca estatísticas gerais
 * @returns {Promise<Object>} Estatísticas
 */
async function getGeneralStats() {
  try {
    // Total de usuários
    const { count: totalUsers, error: usersError } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      throw usersError;
    }

    // Usuários ativos (últimos 30 dias)
    const { count: activeUsers, error: activeError } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true })
      .gte(
        "last_interaction",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (activeError) {
      throw activeError;
    }

    // Total de interações
    const { count: totalInteractions, error: interactionsError } =
      await supabase
        .from("interactions")
        .select("*", { count: "exact", head: true });

    if (interactionsError) {
      throw interactionsError;
    }

    // Total de previsões
    const { count: totalPredictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true });

    if (predictionsError) {
      throw predictionsError;
    }

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_interactions: totalInteractions,
      total_predictions: totalPredictions,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Erro ao buscar estatísticas:", error);
    throw error;
  }
}

/**
 * Busca usuários com filtros
 * @param {Object} filters - Filtros de busca
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @returns {Promise<Object>} Lista de usuários e metadados
 */
async function getUsers(filters = {}, page = 1, limit = 10) {
  try {
    let query = supabase.from("users_livia").select("*", { count: "exact" });

    // Aplica filtros
    if (filters.subscription_status) {
      query = query.eq("subscription_status", filters.subscription_status);
    }

    if (filters.onboarding_completed !== undefined) {
      query = query.eq("onboarding_completed", filters.onboarding_completed);
    }

    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`
      );
    }

    // Aplica paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      users: data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  } catch (error) {
    logger.error("Erro ao buscar usuários:", error);
    throw error;
  }
}

/**
 * Busca interações com filtros
 * @param {Object} filters - Filtros de busca
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @returns {Promise<Object>} Lista de interações e metadados
 */
async function getInteractions(filters = {}, page = 1, limit = 10) {
  try {
    let query = supabase.from("interactions").select(
      `
        *,
        users (
          id,
          name,
          phone
        )
      `,
      { count: "exact" }
    );

    // Aplica filtros
    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.intent) {
      query = query.eq("intent", filters.intent);
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    // Aplica paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      interactions: data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  } catch (error) {
    logger.error("Erro ao buscar interações:", error);
    throw error;
  }
}

/**
 * Busca previsões com filtros
 * @param {Object} filters - Filtros de busca
 * @param {number} page - Página atual
 * @param {number} limit - Itens por página
 * @returns {Promise<Object>} Lista de previsões e metadados
 */
async function getPredictions(filters = {}, page = 1, limit = 10) {
  try {
    let query = supabase.from("predictions").select(
      `
        *,
        users (
          id,
          name,
          phone
        )
      `,
      { count: "exact" }
    );

    // Aplica filtros
    if (filters.user_id) {
      query = query.eq("user_id", filters.user_id);
    }

    if (filters.date_from) {
      query = query.gte("created_at", filters.date_from);
    }

    if (filters.date_to) {
      query = query.lte("created_at", filters.date_to);
    }

    // Aplica paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      throw error;
    }

    return {
      predictions: data,
      total: count,
      page,
      limit,
      total_pages: Math.ceil(count / limit),
    };
  } catch (error) {
    logger.error("Erro ao buscar previsões:", error);
    throw error;
  }
}

/**
 * Atualiza status de assinatura do usuário
 * @param {string} userId - ID do usuário
 * @param {string} status - Novo status
 * @returns {Promise<Object>} Usuário atualizado
 */
async function updateSubscriptionStatus(userId, status) {
  try {
    const { data, error } = await supabase
      .from("users_livia")
      .update({
        subscription_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error("Erro ao atualizar status de assinatura:", error);
    throw error;
  }
}

module.exports = {
  getGeneralStats,
  getUsers,
  getInteractions,
  getPredictions,
  updateSubscriptionStatus,
};
