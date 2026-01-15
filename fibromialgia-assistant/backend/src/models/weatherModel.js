const supabase = require("../utils/supabase");
const logger = require("../utils/logger");

/**
 * Registra dados climáticos
 * @param {Object} weatherData - Dados climáticos
 * @returns {Promise<Object>} Dados climáticos registrados
 */
async function recordWeather(weatherData) {
  try {
    const { data, error } = await supabase
      .from("weather")
      .insert([
        {
          user_id: weatherData.user_id,
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure,
          conditions: weatherData.conditions,
          location: weatherData.location,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao registrar dados climáticos:", error);
    throw error;
  }
}

/**
 * Obtém dados climáticos de um usuário
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros adicionais
 * @returns {Promise<Array>} Lista de dados climáticos
 */
async function getUserWeather(userId, filters = {}) {
  try {
    let query = supabase.from("weather").select("*").eq("user_id", userId);

    // Aplicar filtros adicionais
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.location) {
      query = query.eq("location", filters.location);
    }
    if (filters.conditions) {
      query = query.eq("conditions", filters.conditions);
    }

    // Ordenação
    query = query.order("created_at", { ascending: false });

    // Paginação
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      query = query.range(start, start + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error("Erro ao obter dados climáticos do usuário:", error);
    throw error;
  }
}

/**
 * Obtém estatísticas climáticas
 * @param {string} userId - ID do usuário
 * @param {Object} filters - Filtros para as estatísticas
 * @returns {Promise<Object>} Estatísticas climáticas
 */
async function getWeatherStats(userId, filters = {}) {
  try {
    const stats = {
      averageTemperature: 0,
      averageHumidity: 0,
      averagePressure: 0,
      byConditions: {},
      byLocation: {},
      byDay: {},
    };

    // Obter dados climáticos
    const { data, error } = await supabase
      .from("weather")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    if (data.length === 0) return stats;

    // Calcular médias
    const totals = data.reduce(
      (acc, item) => ({
        temperature: acc.temperature + item.temperature,
        humidity: acc.humidity + item.humidity,
        pressure: acc.pressure + item.pressure,
      }),
      { temperature: 0, humidity: 0, pressure: 0 }
    );

    stats.averageTemperature = totals.temperature / data.length;
    stats.averageHumidity = totals.humidity / data.length;
    stats.averagePressure = totals.pressure / data.length;

    // Distribuição por condições
    data.forEach((item) => {
      stats.byConditions[item.conditions] =
        (stats.byConditions[item.conditions] || 0) + 1;
    });

    // Distribuição por localização
    data.forEach((item) => {
      if (!stats.byLocation[item.location]) {
        stats.byLocation[item.location] = {
          count: 0,
          temperature: 0,
          humidity: 0,
          pressure: 0,
        };
      }
      stats.byLocation[item.location].count++;
      stats.byLocation[item.location].temperature += item.temperature;
      stats.byLocation[item.location].humidity += item.humidity;
      stats.byLocation[item.location].pressure += item.pressure;
    });

    // Calcular médias por localização
    Object.keys(stats.byLocation).forEach((location) => {
      const loc = stats.byLocation[location];
      loc.temperature /= loc.count;
      loc.humidity /= loc.count;
      loc.pressure /= loc.count;
    });

    // Distribuição por dia
    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      if (!stats.byDay[date]) {
        stats.byDay[date] = {
          temperature: 0,
          humidity: 0,
          pressure: 0,
          count: 0,
        };
      }
      stats.byDay[date].temperature += item.temperature;
      stats.byDay[date].humidity += item.humidity;
      stats.byDay[date].pressure += item.pressure;
      stats.byDay[date].count++;
    });

    // Calcular médias diárias
    Object.keys(stats.byDay).forEach((date) => {
      const day = stats.byDay[date];
      day.temperature /= day.count;
      day.humidity /= day.count;
      day.pressure /= day.count;
    });

    return stats;
  } catch (error) {
    logger.error("Erro ao obter estatísticas climáticas:", error);
    throw error;
  }
}

/**
 * Obtém tendências climáticas
 * @param {string} userId - ID do usuário
 * @param {number} days - Número de dias para análise
 * @returns {Promise<Object>} Tendências climáticas
 */
async function getWeatherTrends(userId, days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("weather")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    const trends = {
      temperature: [],
      humidity: [],
      pressure: [],
    };

    data.forEach((item) => {
      const date = new Date(item.created_at).toISOString().split("T")[0];
      trends.temperature.push({ date, value: item.temperature });
      trends.humidity.push({ date, value: item.humidity });
      trends.pressure.push({ date, value: item.pressure });
    });

    return trends;
  } catch (error) {
    logger.error("Erro ao obter tendências climáticas:", error);
    throw error;
  }
}

module.exports = {
  recordWeather,
  getUserWeather,
  getWeatherStats,
  getWeatherTrends,
};
