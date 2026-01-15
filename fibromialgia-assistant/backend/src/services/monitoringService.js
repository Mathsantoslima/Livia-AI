const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const os = require("os");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const configService = require("./configService");
const notificationService = require("./notificationService");
const { SupabaseClient } = require("../api/supabase");
const { OpenAIService } = require("../api/openai");
const whatsAppClient = require("../api/whatsapp");
const ContextManager = require("../utils/contextManager");
const {
  SYMPTOMS,
  PAIN_LEVELS,
  TRIGGER_FACTORS,
  SEVERITY_LEVELS,
} = require("../config/constants");
const { config } = require("../config");

/**
 * Obtém métricas do sistema
 * @returns {Promise<Object>} Métricas do sistema
 */
async function getSystemMetrics() {
  try {
    const metrics = {
      cpu: {
        usage: os.loadavg()[0],
        cores: os.cpus().length,
        model: os.cpus()[0].model,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname(),
    };

    // Calcular percentuais
    metrics.cpu.usage_percent = (metrics.cpu.usage / metrics.cpu.cores) * 100;
    metrics.memory.used_percent =
      (metrics.memory.used / metrics.memory.total) * 100;

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas do sistema:", error);
    throw error;
  }
}

/**
 * Obtém métricas do banco de dados
 * @returns {Promise<Object>} Métricas do banco de dados
 */
async function getDatabaseMetrics() {
  try {
    // Tamanho do banco de dados
    const { data: sizeData, error: sizeError } = await supabase.rpc(
      "get_database_size"
    );

    if (sizeError) throw sizeError;

    // Contagem de registros por tabela
    const { data: countData, error: countError } = await supabase.rpc(
      "get_table_counts"
    );

    if (countError) throw countError;

    // Estatísticas de consultas
    const { data: statsData, error: statsError } = await supabase.rpc(
      "get_query_stats"
    );

    if (statsError) throw statsError;

    return {
      size: sizeData,
      counts: countData,
      stats: statsData,
    };
  } catch (error) {
    logger.error("Erro ao obter métricas do banco de dados:", error);
    throw error;
  }
}

/**
 * Obtém métricas de uso da API
 * @returns {Promise<Object>} Métricas de uso da API
 */
async function getApiMetrics() {
  try {
    const { data, error } = await supabase
      .from("api_logs")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Processar logs
    const metrics = {
      total_requests: data.length,
      requests_by_endpoint: {},
      requests_by_method: {},
      requests_by_status: {},
      average_response_time: 0,
      errors: 0,
    };

    let totalResponseTime = 0;

    data.forEach((log) => {
      // Contagem por endpoint
      metrics.requests_by_endpoint[log.endpoint] =
        (metrics.requests_by_endpoint[log.endpoint] || 0) + 1;

      // Contagem por método
      metrics.requests_by_method[log.method] =
        (metrics.requests_by_method[log.method] || 0) + 1;

      // Contagem por status
      metrics.requests_by_status[log.status] =
        (metrics.requests_by_status[log.status] || 0) + 1;

      // Tempo de resposta
      totalResponseTime += log.response_time;

      // Erros
      if (log.status >= 400) {
        metrics.errors++;
      }
    });

    // Calcular média de tempo de resposta
    metrics.average_response_time = totalResponseTime / data.length;

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas da API:", error);
    throw error;
  }
}

/**
 * Obtém métricas de uso do WhatsApp
 * @returns {Promise<Object>} Métricas de uso do WhatsApp
 */
async function getWhatsAppMetrics() {
  try {
    const { data, error } = await supabase
      .from("whatsapp_logs")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Processar logs
    const metrics = {
      total_messages: data.length,
      messages_by_type: {},
      messages_by_status: {},
      average_delivery_time: 0,
      errors: 0,
    };

    let totalDeliveryTime = 0;

    data.forEach((log) => {
      // Contagem por tipo
      metrics.messages_by_type[log.type] =
        (metrics.messages_by_type[log.type] || 0) + 1;

      // Contagem por status
      metrics.messages_by_status[log.status] =
        (metrics.messages_by_status[log.status] || 0) + 1;

      // Tempo de entrega
      if (log.delivered_at) {
        const deliveryTime =
          new Date(log.delivered_at) - new Date(log.created_at);
        totalDeliveryTime += deliveryTime;
      }

      // Erros
      if (log.status === "error") {
        metrics.errors++;
      }
    });

    // Calcular média de tempo de entrega
    metrics.average_delivery_time = totalDeliveryTime / data.length;

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas do WhatsApp:", error);
    throw error;
  }
}

/**
 * Obtém métricas de uso do modelo
 * @returns {Promise<Object>} Métricas de uso do modelo
 */
async function getModelMetrics() {
  try {
    const { data, error } = await supabase
      .from("predictions")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Processar previsões
    const metrics = {
      total_predictions: data.length,
      predictions_by_symptom: {},
      average_accuracy: 0,
      accuracy_by_symptom: {},
      processing_time: {
        total: 0,
        average: 0,
      },
    };

    let totalAccuracy = 0;
    let totalProcessingTime = 0;

    data.forEach((prediction) => {
      // Contagem por sintoma
      prediction.symptoms.forEach((symptom) => {
        metrics.predictions_by_symptom[symptom.name] =
          (metrics.predictions_by_symptom[symptom.name] || 0) + 1;

        // Acurácia por sintoma
        if (!metrics.accuracy_by_symptom[symptom.name]) {
          metrics.accuracy_by_symptom[symptom.name] = {
            total: 0,
            count: 0,
          };
        }
        metrics.accuracy_by_symptom[symptom.name].total += symptom.accuracy;
        metrics.accuracy_by_symptom[symptom.name].count++;
      });

      // Acurácia geral
      totalAccuracy += prediction.accuracy;

      // Tempo de processamento
      if (prediction.processing_time) {
        totalProcessingTime += prediction.processing_time;
      }
    });

    // Calcular médias
    metrics.average_accuracy = totalAccuracy / data.length;
    metrics.processing_time.total = totalProcessingTime;
    metrics.processing_time.average = totalProcessingTime / data.length;

    // Calcular médias por sintoma
    Object.keys(metrics.accuracy_by_symptom).forEach((symptom) => {
      const data = metrics.accuracy_by_symptom[symptom];
      metrics.accuracy_by_symptom[symptom] = data.total / data.count;
    });

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas do modelo:", error);
    throw error;
  }
}

/**
 * Obtém métricas de uso do sistema
 * @returns {Promise<Object>} Métricas de uso do sistema
 */
async function getUsageMetrics() {
  try {
    const { data, error } = await supabase.from("users_livia").select("*");

    if (error) throw error;

    // Processar dados
    const metrics = {
      total_users: data.length,
      active_users: 0,
      users_by_subscription: {},
      users_by_status: {},
      new_users: {
        today: 0,
        week: 0,
        month: 0,
      },
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    data.forEach((user) => {
      // Usuários ativos
      if (user.subscription_status === "active") {
        metrics.active_users++;
      }

      // Contagem por assinatura
      metrics.users_by_subscription[user.subscription_type] =
        (metrics.users_by_subscription[user.subscription_type] || 0) + 1;

      // Contagem por status
      metrics.users_by_status[user.status] =
        (metrics.users_by_status[user.status] || 0) + 1;

      // Novos usuários
      const createdAt = new Date(user.created_at);
      if (createdAt >= today) {
        metrics.new_users.today++;
      }
      if (createdAt >= weekAgo) {
        metrics.new_users.week++;
      }
      if (createdAt >= monthAgo) {
        metrics.new_users.month++;
      }
    });

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas de uso:", error);
    throw error;
  }
}

/**
 * Obtém métricas de erros
 * @returns {Promise<Object>} Métricas de erros
 */
async function getErrorMetrics() {
  try {
    const { data, error } = await supabase
      .from("error_logs")
      .select("*")
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      );

    if (error) throw error;

    // Processar logs
    const metrics = {
      total_errors: data.length,
      errors_by_type: {},
      errors_by_service: {},
      errors_by_severity: {},
      average_resolution_time: 0,
    };

    let totalResolutionTime = 0;
    let resolvedErrors = 0;

    data.forEach((log) => {
      // Contagem por tipo
      metrics.errors_by_type[log.type] =
        (metrics.errors_by_type[log.type] || 0) + 1;

      // Contagem por serviço
      metrics.errors_by_service[log.service] =
        (metrics.errors_by_service[log.service] || 0) + 1;

      // Contagem por severidade
      metrics.errors_by_severity[log.severity] =
        (metrics.errors_by_severity[log.severity] || 0) + 1;

      // Tempo de resolução
      if (log.resolved_at) {
        const resolutionTime =
          new Date(log.resolved_at) - new Date(log.created_at);
        totalResolutionTime += resolutionTime;
        resolvedErrors++;
      }
    });

    // Calcular média de tempo de resolução
    if (resolvedErrors > 0) {
      metrics.average_resolution_time = totalResolutionTime / resolvedErrors;
    }

    return metrics;
  } catch (error) {
    logger.error("Erro ao obter métricas de erros:", error);
    throw error;
  }
}

/**
 * Obtém todas as métricas do sistema
 * @returns {Promise<Object>} Todas as métricas
 */
async function getAllMetrics() {
  try {
    const [
      systemMetrics,
      databaseMetrics,
      apiMetrics,
      whatsAppMetrics,
      modelMetrics,
      usageMetrics,
      errorMetrics,
    ] = await Promise.all([
      getSystemMetrics(),
      getDatabaseMetrics(),
      getApiMetrics(),
      getWhatsAppMetrics(),
      getModelMetrics(),
      getUsageMetrics(),
      getErrorMetrics(),
    ]);

    return {
      system: systemMetrics,
      database: databaseMetrics,
      api: apiMetrics,
      whatsapp: whatsAppMetrics,
      model: modelMetrics,
      usage: usageMetrics,
      errors: errorMetrics,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Erro ao obter todas as métricas:", error);
    throw error;
  }
}

/**
 * Monitora a saúde do sistema
 * @returns {Promise<Object>} Status do sistema
 */
async function checkSystemHealth() {
  try {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        storage: false,
        api: false,
        memory: false,
        cpu: false,
      },
      metrics: {
        responseTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        activeConnections: 0,
        errorRate: 0,
      },
    };

    // Verificar conexão com o banco
    try {
      const startTime = Date.now();
      await supabase
        .from("users_livia")
        .select("count", { count: "exact", head: true });
      health.checks.database = true;
      health.metrics.responseTime = Date.now() - startTime;
    } catch (error) {
      logger.error("Erro ao verificar banco de dados:", error);
      health.status = "degraded";
    }

    // Verificar storage
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      health.checks.storage = buckets.length > 0;
    } catch (error) {
      logger.error("Erro ao verificar storage:", error);
      health.status = "degraded";
    }

    // Verificar uso de memória
    const memoryUsage = process.memoryUsage();
    health.metrics.memoryUsage = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    health.checks.memory = memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9;

    // Verificar uso de CPU
    const cpuUsage = process.cpuUsage();
    health.metrics.cpuUsage = Math.round(
      (cpuUsage.user + cpuUsage.system) / 1000
    );
    health.checks.cpu = health.metrics.cpuUsage < 80;

    // Verificar taxa de erro
    const { data: errors } = await supabase
      .from("logs")
      .select("count", { count: "exact", head: true })
      .eq("level", "error")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    health.metrics.errorRate = errors || 0;
    if (health.metrics.errorRate > 10) {
      health.status = "degraded";
    }

    // Notificar se houver problemas
    if (health.status !== "healthy") {
      await notificationService.notifyAdmins({
        type: "system_health",
        title: "Problemas de Saúde do Sistema",
        message: `O sistema está com status ${health.status}. Verifique os logs para mais detalhes.`,
        data: health,
      });
    }

    return health;
  } catch (error) {
    logger.error("Erro ao verificar saúde do sistema:", error);
    throw error;
  }
}

/**
 * Monitora o desempenho do sistema
 * @returns {Promise<Object>} Métricas de desempenho
 */
async function checkPerformance() {
  try {
    const performance = {
      timestamp: new Date().toISOString(),
      metrics: {
        responseTime: {},
        throughput: {},
        errorRate: {},
        resourceUsage: {},
      },
    };

    // Verificar tempo de resposta das APIs
    const apis = [
      { name: "users", endpoint: "/api/users" },
      { name: "predictions", endpoint: "/api/predictions" },
      { name: "symptoms", endpoint: "/api/symptoms" },
    ];

    for (const api of apis) {
      const startTime = Date.now();
      try {
        await fetch(`${process.env.API_URL}${api.endpoint}`);
        performance.metrics.responseTime[api.name] = Date.now() - startTime;
      } catch (error) {
        performance.metrics.responseTime[api.name] = -1;
      }
    }

    // Verificar throughput (requisições por minuto)
    const { data: requests } = await supabase
      .from("logs")
      .select("created_at")
      .gte("created_at", new Date(Date.now() - 60000).toISOString());

    performance.metrics.throughput = requests.length;

    // Verificar taxa de erro
    const { data: errors } = await supabase
      .from("logs")
      .select("created_at")
      .eq("level", "error")
      .gte("created_at", new Date(Date.now() - 60000).toISOString());

    performance.metrics.errorRate = errors.length;

    // Verificar uso de recursos
    const memoryUsage = process.memoryUsage();
    performance.metrics.resourceUsage = {
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
      },
      cpu: process.cpuUsage(),
    };

    // Salvar métricas
    await supabase.from("performance_metrics").insert({
      metrics: performance.metrics,
      created_at: new Date().toISOString(),
    });

    return performance;
  } catch (error) {
    logger.error("Erro ao verificar desempenho:", error);
    throw error;
  }
}

/**
 * Monitora o uso do sistema
 * @returns {Promise<Object>} Métricas de uso
 */
async function checkUsage() {
  try {
    const usage = {
      timestamp: new Date().toISOString(),
      metrics: {
        activeUsers: 0,
        totalRequests: 0,
        storageUsed: 0,
        predictionsGenerated: 0,
      },
    };

    // Usuários ativos (últimos 15 minutos)
    const { count: activeUsers } = await supabase
      .from("users_livia")
      .select("*", { count: "exact", head: true })
      .gte("last_interaction", new Date(Date.now() - 900000).toISOString());

    usage.metrics.activeUsers = activeUsers;

    // Total de requisições (últimos 15 minutos)
    const { count: totalRequests } = await supabase
      .from("logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 900000).toISOString());

    usage.metrics.totalRequests = totalRequests;

    // Uso de storage
    const { data: buckets } = await supabase.storage.listBuckets();
    let totalSize = 0;

    for (const bucket of buckets) {
      const { data: files } = await supabase.storage.from(bucket.name).list();
      for (const file of files) {
        totalSize += file.metadata.size;
      }
    }

    usage.metrics.storageUsed = Math.round(totalSize / 1024 / 1024); // MB

    // Previsões geradas (últimos 15 minutos)
    const { count: predictionsGenerated } = await supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 900000).toISOString());

    usage.metrics.predictionsGenerated = predictionsGenerated;

    // Verificar limites
    const systemConfigs = await configService.getSystemConfigs();
    const maxConcurrentUsers = systemConfigs.max_concurrent_users || 1000;

    if (usage.metrics.activeUsers > maxConcurrentUsers * 0.9) {
      await notificationService.notifyAdmins({
        type: "usage_alert",
        title: "Alerta de Uso",
        message: `Número de usuários ativos (${usage.metrics.activeUsers}) está próximo do limite (${maxConcurrentUsers}).`,
        data: usage,
      });
    }

    return usage;
  } catch (error) {
    logger.error("Erro ao verificar uso:", error);
    throw error;
  }
}

/**
 * Monitora a segurança do sistema
 * @returns {Promise<Object>} Status de segurança
 */
async function checkSecurity() {
  try {
    const security = {
      timestamp: new Date().toISOString(),
      status: "secure",
      checks: {
        authentication: true,
        authorization: true,
        rateLimiting: true,
        dataEncryption: true,
      },
      alerts: [],
    };

    // Verificar tentativas de login suspeitas
    const { data: failedLogins } = await supabase
      .from("logs")
      .select("*")
      .eq("type", "auth")
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if (failedLogins.length > 10) {
      security.status = "warning";
      security.alerts.push({
        type: "suspicious_activity",
        message: "Múltiplas tentativas de login falhas detectadas",
        count: failedLogins.length,
      });
    }

    // Verificar acessos não autorizados
    const { data: unauthorizedAccess } = await supabase
      .from("logs")
      .select("*")
      .eq("type", "access")
      .eq("status", "unauthorized")
      .gte("created_at", new Date(Date.now() - 3600000).toISOString());

    if (unauthorizedAccess.length > 0) {
      security.status = "warning";
      security.alerts.push({
        type: "unauthorized_access",
        message: "Tentativas de acesso não autorizado detectadas",
        count: unauthorizedAccess.length,
      });
    }

    // Notificar se houver alertas
    if (security.alerts.length > 0) {
      await notificationService.notifyAdmins({
        type: "security_alert",
        title: "Alerta de Segurança",
        message: `${security.alerts.length} alertas de segurança detectados.`,
        data: security,
      });
    }

    return security;
  } catch (error) {
    logger.error("Erro ao verificar segurança:", error);
    throw error;
  }
}

/**
 * Serviço de monitoramento de sintomas de fibromialgia
 * Responsável por monitorar e analisar padrões de sintomas
 */
class MonitoringService {
  /**
   * Analisa os sintomas de um usuário e detecta padrões importantes
   * @param {string} userId - ID do usuário
   * @param {Object} symptomData - Dados do sintoma atual
   * @returns {Promise<Object>} - Resultado da análise
   */
  static async analyzeUserSymptoms(userId, symptomData) {
    try {
      // Obter histórico de sintomas do usuário
      const { data: previousSymptoms } = await SupabaseClient.select(
        "user_symptoms",
        {
          filters: [{ column: "user_id", operator: "eq", value: userId }],
          order: "recorded_at",
          ascending: false,
          limit: 20,
        }
      );

      // Detectar padrões nos sintomas
      const patterns = await this.detectSymptomPatterns(
        symptomData,
        previousSymptoms || []
      );

      // Se nenhum padrão importante for detectado, retornar análise básica
      if (!patterns || Object.keys(patterns).length === 0) {
        return {
          userId,
          analyzed: true,
          patterns: [],
          alert: false,
          recommendations: ["Continue monitorando seus sintomas regularmente"],
        };
      }

      // Verificar se algum padrão requer alerta
      const requiresAlert =
        patterns.painIncrease?.severity === "high" ||
        patterns.persistentSevere?.severity === "high" ||
        patterns.newSymptoms?.severity === "high";

      // Criar alerta se necessário
      if (requiresAlert) {
        const alertData = {
          userId,
          alertType: "symptom_pattern",
          severity: "high",
          description:
            patterns.description ||
            "Padrão importante detectado em seus sintomas",
          detectedPatterns: patterns,
          timestamp: new Date().toISOString(),
        };

        await this.createHealthAlert(userId, alertData);
        await this.notifyUserOfAlert(userId, alertData);
      }

      // Gerar recomendações baseadas nos padrões
      let recommendations = ["Continue monitorando seus sintomas regularmente"];

      if (patterns.painIncrease) {
        recommendations.push(
          "Consulte seu médico sobre o aumento na intensidade da dor"
        );
      }

      if (patterns.persistentSevere) {
        recommendations.push(
          "Considere técnicas de manejo de dor adicionais para sintomas persistentes"
        );
      }

      if (patterns.newSymptoms) {
        recommendations.push(
          "Relate os novos sintomas ao seu profissional de saúde"
        );
      }

      return {
        userId,
        analyzed: true,
        patterns,
        alert: requiresAlert,
        recommendations,
      };
    } catch (error) {
      logger.error(`Erro ao analisar sintomas do usuário ${userId}:`, error);
      return {
        userId,
        analyzed: false,
        error: error.message,
        alert: false,
        recommendations: [
          "Consulte seu médico para uma avaliação de seus sintomas",
        ],
      };
    }
  }

  /**
   * Detecta padrões em sintomas atuais comparados com histórico
   * @param {Object} currentSymptom - Sintoma atual
   * @param {Array} previousSymptoms - Histórico de sintomas
   * @returns {Promise<Object>} - Padrões detectados
   */
  static async detectSymptomPatterns(currentSymptom, previousSymptoms) {
    try {
      // Verificar se há dados suficientes para análise
      if (!currentSymptom || previousSymptoms.length === 0) {
        return {};
      }

      // Detectar padrões específicos
      const painIncreasePattern = this.checkPainIncreasePattern(
        currentSymptom,
        previousSymptoms
      );

      const persistentSeverePattern = this.checkPersistentSeverePattern(
        currentSymptom,
        previousSymptoms
      );

      const newSymptomsPattern = this.checkNewSymptomsPattern(
        currentSymptom,
        previousSymptoms
      );

      // Compilar todos os padrões detectados
      const patterns = {};
      let description = "Análise de padrões de sintomas: ";

      if (painIncreasePattern.detected) {
        patterns.painIncrease = painIncreasePattern;
        description += "Aumento de dor detectado. ";
      }

      if (persistentSeverePattern.detected) {
        patterns.persistentSevere = persistentSeverePattern;
        description += "Sintomas severos persistentes detectados. ";
      }

      if (newSymptomsPattern.detected) {
        patterns.newSymptoms = newSymptomsPattern;
        description += "Novos sintomas detectados. ";
      }

      if (Object.keys(patterns).length > 0) {
        patterns.description = description;
      }

      return patterns;
    } catch (error) {
      logger.error("Erro ao detectar padrões de sintomas:", error);
      return {};
    }
  }

  /**
   * Verifica se há padrão de aumento de dor
   * @param {Object} currentSymptom - Sintoma atual
   * @param {Array} previousSymptoms - Histórico de sintomas
   * @returns {Object} - Padrão detectado
   */
  static checkPainIncreasePattern(currentSymptom, previousSymptoms) {
    try {
      // Verificar se o sintoma atual tem intensidade
      if (!currentSymptom.intensity) {
        return { detected: false };
      }

      // Converter intensidade atual para número
      const currentIntensity =
        typeof currentSymptom.intensity === "number"
          ? currentSymptom.intensity
          : this.severityToNumber(currentSymptom.intensity);

      // Filtrar sintomas anteriores do mesmo tipo
      const sameSymptomsHistory = previousSymptoms.filter(
        (s) => s.symptom_name === currentSymptom.symptom_name
      );

      // Se não há histórico do mesmo sintoma, não há como comparar
      if (sameSymptomsHistory.length === 0) {
        return { detected: false };
      }

      // Calcular média de intensidade dos últimos registros
      const recentSymptoms = sameSymptomsHistory.slice(0, 5);
      const intensitySum = recentSymptoms.reduce((sum, s) => {
        const intensity =
          typeof s.intensity === "number"
            ? s.intensity
            : this.severityToNumber(s.intensity);
        return sum + intensity;
      }, 0);

      const averageIntensity = intensitySum / recentSymptoms.length;

      // Detectar aumento significativo de intensidade
      const increase = currentIntensity - averageIntensity;
      const percentageIncrease = (increase / averageIntensity) * 100;

      if (increase >= 2 || percentageIncrease >= 50) {
        return {
          detected: true,
          symptom: currentSymptom.symptom_name,
          currentIntensity,
          averageIntensity,
          increase,
          percentageIncrease,
          severity: increase >= 3 ? "high" : "medium",
        };
      }

      return { detected: false };
    } catch (error) {
      logger.error("Erro ao verificar padrão de aumento de dor:", error);
      return { detected: false };
    }
  }

  /**
   * Verifica se há padrão de sintomas severos persistentes
   * @param {Object} currentSymptom - Sintoma atual
   * @param {Array} previousSymptoms - Histórico de sintomas
   * @returns {Object} - Padrão detectado
   */
  static checkPersistentSeverePattern(currentSymptom, previousSymptoms) {
    try {
      // Verificar se o sintoma atual é severo
      if (!currentSymptom.intensity) {
        return { detected: false };
      }

      const currentIntensity =
        typeof currentSymptom.intensity === "number"
          ? currentSymptom.intensity
          : this.severityToNumber(currentSymptom.intensity);

      // Verificar se o sintoma atual é realmente severo
      if (currentIntensity < 4) {
        // Considerando escala de 0-5
        return { detected: false };
      }

      // Filtrar histórico do mesmo sintoma
      const sameSymptomsHistory = previousSymptoms.filter(
        (s) => s.symptom_name === currentSymptom.symptom_name
      );

      // Verificar quantos dias consecutivos o sintoma está severo
      let consecutiveDays = 1; // Iniciar com o dia atual
      const ONE_DAY = 24 * 60 * 60 * 1000; // em milissegundos

      const currentDate = new Date(currentSymptom.recorded_at || new Date());

      for (const symptom of sameSymptomsHistory) {
        const symptomDate = new Date(symptom.recorded_at);
        const daysDiff = Math.abs(currentDate - symptomDate) / ONE_DAY;

        // Se for aproximadamente um dia consecutivo
        if (daysDiff > 0.7 && daysDiff < 1.3) {
          const intensity =
            typeof symptom.intensity === "number"
              ? symptom.intensity
              : this.severityToNumber(symptom.intensity);

          if (intensity >= 4) {
            consecutiveDays++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break; // Interromper contagem se encontrar dia não severo
          }
        } else {
          break; // Interromper se não for dia consecutivo
        }
      }

      // Considerar persistente se for severo por 3 ou mais dias
      if (consecutiveDays >= 3) {
        return {
          detected: true,
          symptom: currentSymptom.symptom_name,
          currentIntensity,
          consecutiveDays,
          severity: consecutiveDays >= 5 ? "high" : "medium",
        };
      }

      return { detected: false };
    } catch (error) {
      logger.error("Erro ao verificar padrão de sintomas persistentes:", error);
      return { detected: false };
    }
  }

  /**
   * Verifica se há novos sintomas importantes
   * @param {Object} currentSymptom - Sintoma atual
   * @param {Array} previousSymptoms - Histórico de sintomas
   * @returns {Object} - Padrão detectado
   */
  static checkNewSymptomsPattern(currentSymptom, previousSymptoms) {
    try {
      // Extrair todos os tipos de sintomas registrados anteriormente
      const previousSymptomTypes = new Set(
        previousSymptoms.map((s) => s.symptom_name)
      );

      // Verificar se o sintoma atual é novo
      const isNewSymptom = !previousSymptomTypes.has(
        currentSymptom.symptom_name
      );

      // Se não for um sintoma novo, encerrar verificação
      if (!isNewSymptom) {
        return { detected: false };
      }

      // Verificar se o novo sintoma é severo
      const currentIntensity =
        typeof currentSymptom.intensity === "number"
          ? currentSymptom.intensity
          : this.severityToNumber(currentSymptom.intensity);

      // Determinar severidade do padrão baseado na intensidade do sintoma
      const patternSeverity =
        currentIntensity >= 4
          ? "high"
          : currentIntensity >= 3
          ? "medium"
          : "low";

      return {
        detected: true,
        symptom: currentSymptom.symptom_name,
        intensity: currentIntensity,
        severity: patternSeverity,
        isFirstOccurrence: true,
      };
    } catch (error) {
      logger.error("Erro ao verificar padrão de novos sintomas:", error);
      return { detected: false };
    }
  }

  /**
   * Converte descrição de severidade para valor numérico
   * @param {string} severity - Descrição da severidade
   * @returns {number} - Valor numérico
   */
  static severityToNumber(severity) {
    if (typeof severity === "number") return severity;

    const severityMap = {
      none: 0,
      "very mild": 1,
      mild: 1,
      moderate: 2,
      medium: 3,
      severe: 4,
      high: 4,
      "very severe": 5,
      extreme: 5,
      critical: 5,
    };

    return severityMap[severity.toLowerCase()] || 2; // Default para 'moderate'
  }

  /**
   * Converte valor numérico para descrição de severidade
   * @param {number} value - Valor numérico
   * @returns {string} - Descrição da severidade
   */
  static numberToSeverity(value) {
    const severityMap = {
      0: "none",
      1: "mild",
      2: "moderate",
      3: "medium",
      4: "severe",
      5: "extreme",
    };

    return severityMap[value] || "moderate";
  }

  /**
   * Cria um alerta de saúde no sistema
   * @param {string} userId - ID do usuário
   * @param {Object} alertData - Dados do alerta
   * @returns {Promise<Object>} - Alerta criado
   */
  static async createHealthAlert(userId, alertData) {
    try {
      const alert = {
        user_id: userId,
        alert_type: alertData.alertType,
        severity: alertData.severity,
        description: alertData.description,
        details: alertData.detectedPatterns || {},
        status: "active",
        created_at: new Date().toISOString(),
      };

      const { data } = await SupabaseClient.insert("health_alerts", alert);

      logger.info(`Alerta de saúde criado para o usuário ${userId}`);
      return data[0];
    } catch (error) {
      logger.error(
        `Erro ao criar alerta de saúde para o usuário ${userId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Notifica o usuário sobre um alerta de saúde importante
   * @param {string} userId - ID do usuário
   * @param {Object} alertData - Dados do alerta
   * @returns {Promise<boolean>} - Sucesso da notificação
   */
  static async notifyUserOfAlert(userId, alertData) {
    try {
      // Obter detalhes de contato do usuário
      const { data: userData } = await SupabaseClient.select("users", {
        filters: [{ column: "id", operator: "eq", value: userId }],
        limit: 1,
      });

      if (!userData || userData.length === 0) {
        logger.error(`Usuário ${userId} não encontrado para notificação`);
        return false;
      }

      const user = userData[0];

      // Preparar mensagem de notificação
      const message = `Alerta de Saúde: ${alertData.description}\n\nSeveridade: ${alertData.severity}\n\nRecomendação: Considere consultar seu médico para discutir estes sintomas.`;

      // Enviar notificação pelo WhatsApp se disponível
      if (user.phone) {
        try {
          await whatsAppClient.sendTextMessage(user.phone, message);
          logger.info(`Notificação de alerta enviada para ${user.phone}`);
        } catch (whatsappError) {
          logger.error(`Erro ao enviar notificação WhatsApp:`, whatsappError);
        }
      }

      // Inserir notificação no banco de dados
      await SupabaseClient.insert("notifications", {
        user_id: userId,
        type: "health_alert",
        content: message,
        is_read: false,
        created_at: new Date().toISOString(),
      });

      return true;
    } catch (error) {
      logger.error(`Erro ao notificar usuário ${userId}:`, error);
      return false;
    }
  }

  /**
   * Detecta se o usuário está passando por uma crise (flare)
   * @param {string} userId - ID do usuário
   * @param {Object} symptomData - Dados de sintomas atuais
   * @returns {Promise<Object>} - Resultado da detecção
   */
  static async detectFlare(userId, symptomData) {
    try {
      // Obter histórico recente de sintomas
      const { data: recentSymptoms } = await SupabaseClient.select(
        "user_symptoms",
        {
          filters: [
            { column: "user_id", operator: "eq", value: userId },
            {
              column: "recorded_at",
              operator: "gte",
              value: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ],
          order: "recorded_at",
          ascending: false,
        }
      );

      // Se não houver sintomas recentes suficientes, não há como detectar flare
      if (!recentSymptoms || recentSymptoms.length < 3) {
        return {
          flareDetected: false,
          confidence: 0,
          message: "Dados insuficientes para detectar crise",
        };
      }

      // Calcular pontuação de flare baseada em:
      // 1. Número de sintomas diferentes relatados recentemente
      // 2. Intensidade média dos sintomas
      // 3. Aumento repentino na intensidade
      const uniqueSymptoms = new Set(recentSymptoms.map((s) => s.symptom_name));

      const intensitySum = recentSymptoms.reduce((sum, s) => {
        return sum + this.severityToNumber(s.intensity);
      }, 0);

      const avgIntensity = intensitySum / recentSymptoms.length;

      // Verificar se houve aumento recente na intensidade
      const oldestIntensity = this.severityToNumber(
        recentSymptoms[recentSymptoms.length - 1].intensity
      );
      const newestIntensity = this.severityToNumber(
        recentSymptoms[0].intensity
      );
      const intensityIncrease = newestIntensity - oldestIntensity;

      // Calcular pontuação de flare (0-100)
      let flareScore = 0;
      flareScore += uniqueSymptoms.size * 10; // Máximo 50 (5 sintomas)
      flareScore += avgIntensity * 10; // Máximo 50 (intensidade 5)
      flareScore += intensityIncrease * 5; // Bônus por aumento

      // Limitar pontuação a 100
      flareScore = Math.min(100, Math.max(0, flareScore));

      // Determinar se é um flare baseado na pontuação
      const flareDetected = flareScore >= 60;

      // Determinar confiança da detecção
      const confidence = flareScore / 100;

      // Criar mensagem baseada na detecção
      let message;

      if (flareDetected) {
        message =
          "Detectamos um possível aumento nos seus sintomas de fibromialgia (crise). Recomendamos que você consulte seu médico e pratique técnicas de autocuidado adicionais neste período.";

        // Criar alerta se for um flare
        await this.createHealthAlert(userId, {
          alertType: "flare_detected",
          severity: flareScore >= 80 ? "high" : "medium",
          description: "Possível crise de fibromialgia detectada",
          detectedPatterns: {
            flareScore,
            uniqueSymptoms: Array.from(uniqueSymptoms),
            avgIntensity,
            intensityIncrease,
          },
        });

        // Notificar usuário
        await this.notifyUserOfAlert(userId, {
          alertType: "flare_detected",
          severity: flareScore >= 80 ? "high" : "medium",
          description:
            "Possível crise de fibromialgia detectada. Recomendamos autocuidado adicional e, se necessário, consulta médica.",
        });
      } else {
        message = "Seus sintomas não indicam uma crise no momento.";
      }

      return {
        flareDetected,
        flareScore,
        confidence,
        symptomCount: uniqueSymptoms.size,
        avgIntensity,
        intensityIncrease,
        message,
      };
    } catch (error) {
      logger.error(`Erro ao detectar flare para o usuário ${userId}:`, error);
      return {
        flareDetected: false,
        error: error.message,
        message: "Não foi possível completar a análise de crise.",
      };
    }
  }

  /**
   * Gera um relatório de saúde para o usuário
   * @param {string} userId - ID do usuário
   * @param {string} period - Período do relatório (daily, weekly, monthly)
   * @returns {Promise<Object>} - Relatório gerado
   */
  static async generateHealthReport(userId, period = "weekly") {
    try {
      // Determinar intervalo de tempo para o relatório
      let startDate;
      const now = new Date();

      switch (period) {
        case "daily":
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
          break;
        case "weekly":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "monthly":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
      }

      // Obter dados de sintomas do período
      const { data: symptoms } = await SupabaseClient.select("user_symptoms", {
        filters: [
          { column: "user_id", operator: "eq", value: userId },
          {
            column: "recorded_at",
            operator: "gte",
            value: startDate.toISOString(),
          },
        ],
        order: "recorded_at",
        ascending: true,
      });

      // Obter dados de humor do período
      const { data: moods } = await SupabaseClient.select("user_mood", {
        filters: [
          { column: "user_id", operator: "eq", value: userId },
          {
            column: "recorded_at",
            operator: "gte",
            value: startDate.toISOString(),
          },
        ],
        order: "recorded_at",
        ascending: true,
      });

      // Obter dados de sono do período
      const { data: sleep } = await SupabaseClient.select(
        "user_sleep_quality",
        {
          filters: [
            { column: "user_id", operator: "eq", value: userId },
            {
              column: "recorded_at",
              operator: "gte",
              value: startDate.toISOString(),
            },
          ],
          order: "recorded_at",
          ascending: true,
        }
      );

      // Obter dados de atividade física do período
      const { data: activities } = await SupabaseClient.select(
        "user_activities",
        {
          filters: [
            { column: "user_id", operator: "eq", value: userId },
            {
              column: "recorded_at",
              operator: "gte",
              value: startDate.toISOString(),
            },
          ],
          order: "recorded_at",
          ascending: true,
        }
      );

      // Processar e agregar dados para o relatório
      const report = {
        userId,
        period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        generatedAt: now.toISOString(),

        // Resumo de sintomas
        symptoms: {
          count: symptoms.length,
          byType: this._aggregateSymptomsByType(symptoms),
          avgIntensity: this._calculateAvgIntensity(symptoms),
          trend: this._calculateTrend(symptoms),
        },

        // Resumo de humor
        mood: {
          entries: moods.length,
          distribution: this._aggregateMoodData(moods),
          trend: this._calculateMoodTrend(moods),
        },

        // Resumo de sono
        sleep: {
          entries: sleep.length,
          avgQuality: this._calculateAvgSleepQuality(sleep),
          trend: this._calculateSleepTrend(sleep),
        },

        // Resumo de atividades
        activities: {
          count: activities.length,
          types: this._aggregateActivityTypes(activities),
        },
      };

      // Gerar mensagem personalizada de análise usando IA
      const analysisMessage = await this._generateReportAnalysis(report);
      report.analysis = analysisMessage;

      // Salvar relatório no banco de dados
      await SupabaseClient.insert("health_reports", {
        user_id: userId,
        period,
        report_data: report,
        created_at: now.toISOString(),
      });

      return report;
    } catch (error) {
      logger.error(`Erro ao gerar relatório para o usuário ${userId}:`, error);
      return {
        userId,
        error: error.message,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Agrega sintomas por tipo
   * @private
   */
  static _aggregateSymptomsByType(symptoms) {
    const byType = {};

    symptoms.forEach((s) => {
      if (!byType[s.symptom_name]) {
        byType[s.symptom_name] = {
          count: 0,
          avgIntensity: 0,
          totalIntensity: 0,
        };
      }

      byType[s.symptom_name].count++;
      byType[s.symptom_name].totalIntensity += this.severityToNumber(
        s.intensity
      );
    });

    // Calcular média para cada tipo
    Object.keys(byType).forEach((type) => {
      byType[type].avgIntensity =
        byType[type].totalIntensity / byType[type].count;
      delete byType[type].totalIntensity;
    });

    return byType;
  }

  /**
   * Calcula intensidade média de sintomas
   * @private
   */
  static _calculateAvgIntensity(symptoms) {
    if (!symptoms || symptoms.length === 0) return 0;

    const totalIntensity = symptoms.reduce((sum, s) => {
      return sum + this.severityToNumber(s.intensity);
    }, 0);

    return totalIntensity / symptoms.length;
  }

  /**
   * Calcula a tendência dos sintomas (melhorando, piorando, estável)
   * @private
   */
  static _calculateTrend(symptoms) {
    if (!symptoms || symptoms.length < 2) return "estável";

    // Dividir o período em duas metades
    const midpoint = Math.floor(symptoms.length / 2);
    const firstHalf = symptoms.slice(0, midpoint);
    const secondHalf = symptoms.slice(midpoint);

    // Calcular intensidade média de cada metade
    const firstHalfAvg = this._calculateAvgIntensity(firstHalf);
    const secondHalfAvg = this._calculateAvgIntensity(secondHalf);

    // Determinar tendência
    const difference = secondHalfAvg - firstHalfAvg;

    if (difference < -0.5) return "melhorando";
    if (difference > 0.5) return "piorando";
    return "estável";
  }

  /**
   * Agrega dados de humor
   * @private
   */
  static _aggregateMoodData(moods) {
    const distribution = {};

    moods.forEach((m) => {
      const mood = m.mood.toLowerCase();
      distribution[mood] = (distribution[mood] || 0) + 1;
    });

    return distribution;
  }

  /**
   * Calcula tendência de humor
   * @private
   */
  static _calculateMoodTrend(moods) {
    if (!moods || moods.length < 2) return "estável";

    // Mapeamento de humor para valores numéricos
    const moodValues = {
      excellent: 5,
      good: 4,
      neutral: 3,
      sad: 2,
      anxious: 2,
      depressed: 1,
      irritable: 2,
      overwhelmed: 1,
    };

    // Calcular valores numéricos
    const moodScores = moods.map((m) => moodValues[m.mood.toLowerCase()] || 3);

    // Dividir em duas metades
    const midpoint = Math.floor(moodScores.length / 2);
    const firstHalfAvg =
      moodScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg =
      moodScores.slice(midpoint).reduce((a, b) => a + b, 0) /
      (moodScores.length - midpoint);

    // Determinar tendência
    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 0.5) return "melhorando";
    if (difference < -0.5) return "piorando";
    return "estável";
  }

  /**
   * Calcula qualidade média do sono
   * @private
   */
  static _calculateAvgSleepQuality(sleep) {
    if (!sleep || sleep.length === 0) return 0;

    // Mapeamento de qualidade de sono para valores numéricos
    const qualityValues = {
      excellent: 5,
      good: 4,
      fair: 3,
      poor: 2,
      very_poor: 1,
    };

    const totalQuality = sleep.reduce((sum, s) => {
      return sum + (qualityValues[s.quality.toLowerCase()] || 3);
    }, 0);

    return totalQuality / sleep.length;
  }

  /**
   * Calcula tendência de sono
   * @private
   */
  static _calculateSleepTrend(sleep) {
    if (!sleep || sleep.length < 2) return "estável";

    // Mapeamento de qualidade para valores numéricos
    const qualityValues = {
      excellent: 5,
      good: 4,
      fair: 3,
      poor: 2,
      very_poor: 1,
    };

    // Calcular valores numéricos
    const sleepScores = sleep.map(
      (s) => qualityValues[s.quality.toLowerCase()] || 3
    );

    // Dividir em duas metades
    const midpoint = Math.floor(sleepScores.length / 2);
    const firstHalfAvg =
      sleepScores.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg =
      sleepScores.slice(midpoint).reduce((a, b) => a + b, 0) /
      (sleepScores.length - midpoint);

    // Determinar tendência
    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 0.5) return "melhorando";
    if (difference < -0.5) return "piorando";
    return "estável";
  }

  /**
   * Agrega tipos de atividades
   * @private
   */
  static _aggregateActivityTypes(activities) {
    const types = {};

    activities.forEach((a) => {
      types[a.activity_type] = (types[a.activity_type] || 0) + 1;
    });

    return types;
  }

  /**
   * Gera análise do relatório usando IA
   * @private
   */
  static async _generateReportAnalysis(report) {
    try {
      const reportSummary = JSON.stringify({
        periodo: report.period,
        sintomas: {
          total: report.symptoms.count,
          porTipo: report.symptoms.byType,
          intensidadeMedia: report.symptoms.avgIntensity,
          tendencia: report.symptoms.trend,
        },
        humor: {
          distribuicao: report.mood.distribution,
          tendencia: report.mood.trend,
        },
        sono: {
          qualidadeMedia: report.sleep.avgQuality,
          tendencia: report.sleep.trend,
        },
        atividades: report.activities.types,
      });

      const messages = [
        {
          role: "system",
          content: `
            Você é um especialista em fibromialgia analisando dados de saúde de um paciente.
            Forneça uma análise empática, informativa e encorajadora baseada nos dados.
            Inclua:
            1. Resumo dos principais padrões observados
            2. Correlações entre diferentes aspectos (sintomas, humor, sono)
            3. Recomendações personalizadas baseadas nos dados
            4. Reconhecimento de progressos e desafios
            5. Palavras de encorajamento
            
            Limite sua resposta a 250 palavras, use linguagem acessível e enfatize aspectos positivos quando possível.
          `,
        },
        {
          role: "user",
          content: `Por favor, analise meus dados de saúde do último período: ${reportSummary}`,
        },
      ];

      // Gerar análise com OpenAI
      const { text } = await OpenAIService.generateChatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 500,
      });

      return text;
    } catch (error) {
      logger.error("Erro ao gerar análise do relatório:", error);
      return "Não foi possível gerar uma análise personalizada dos seus dados. Consulte os detalhes numéricos no relatório para mais informações.";
    }
  }
}

module.exports = MonitoringService;
