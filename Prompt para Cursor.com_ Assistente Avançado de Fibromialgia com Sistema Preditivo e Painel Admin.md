# Prompt para Cursor.com: Assistente Avançado de Fibromialgia com Sistema Preditivo e Painel Admin

Crie um aplicativo Node.js completo para um assistente virtual especializado em fibromialgia que se integra com WhatsApp via Evolution API, inclui sistema preditivo de sintomas e painel administrativo completo. O sistema deve aprender continuamente com as interações dos usuários, gerar insights personalizados e prever como será o dia do paciente com base em dados históricos individuais e coletivos.

## Arquitetura e Tecnologias

- **Backend**: Node.js com Express
- **Frontend Admin**: React com Radix-UI
- **Banco de Dados**: Supabase (PostgreSQL)
- **Integrações**:
  - Evolution API (WhatsApp)
  - OpenAI API (análise de intenção e sistema preditivo)
  - Anthropic Claude API (geração de respostas)
- **Deploy**: Railway (backend) e Vercel (frontend)
- **Autenticação**: Supabase Auth

## Estrutura do Projeto

```
fibromialgia-assistant/
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── README.md
│   ├── src/
│   │   ├── index.js                    # Ponto de entrada da aplicação
│   │   ├── config/
│   │   │   ├── environment.js          # Configurações de ambiente
│   │   │   ├── supabase.js             # Cliente Supabase
│   │   │   ├── openai.js               # Cliente OpenAI
│   │   │   └── claude.js               # Cliente Claude
│   │   ├── controllers/
│   │   │   ├── webhookController.js    # Controlador para webhook do WhatsApp
│   │   │   ├── userController.js       # Controlador para gerenciamento de usuários
│   │   │   ├── predictionController.js # Controlador para previsões
│   │   │   └── adminController.js      # Controlador para painel admin
│   │   ├── services/
│   │   │   ├── whatsappService.js      # Serviço para envio de mensagens WhatsApp
│   │   │   ├── intentService.js        # Serviço para análise de intenção
│   │   │   ├── responseService.js      # Serviço para geração de respostas
│   │   │   ├── userService.js          # Serviço para gerenciamento de usuários
│   │   │   ├── predictionService.js    # Serviço para previsões e insights
│   │   │   ├── learningService.js      # Serviço para aprendizado coletivo
│   │   │   └── schedulerService.js     # Serviço para mensagens programadas
│   │   ├── models/
│   │   │   ├── userModel.js            # Modelo para usuários
│   │   │   ├── interactionModel.js     # Modelo para interações
│   │   │   ├── symptomModel.js         # Modelo para registro de sintomas
│   │   │   ├── predictionModel.js      # Modelo para previsões
│   │   │   └── subscriptionModel.js    # Modelo para assinaturas
│   │   ├── routes/
│   │   │   ├── index.js                # Rotas principais
│   │   │   ├── webhookRoutes.js        # Rotas de webhook
│   │   │   ├── userRoutes.js           # Rotas de usuário
│   │   │   ├── predictionRoutes.js     # Rotas de previsão
│   │   │   └── adminRoutes.js          # Rotas de admin
│   │   └── utils/
│   │       ├── messageParser.js        # Utilitário para extrair dados de mensagens
│   │       ├── predictionUtils.js      # Utilitários para previsões
│   │       └── logger.js               # Utilitário para logging
│   └── scripts/
│       └── setup-database.js           # Script para configuração inicial do banco
│
├── admin-panel/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── api/
│   │   │   ├── supabase.js             # Cliente Supabase para o frontend
│   │   │   └── apiClient.js            # Cliente para API do backend
│   │   ├── components/
│   │   │   ├── common/                 # Componentes comuns
│   │   │   ├── dashboard/              # Componentes do dashboard
│   │   │   ├── users/                  # Componentes de gestão de usuários
│   │   │   ├── payments/               # Componentes de gestão de pagamentos
│   │   │   ├── flows/                  # Componentes de gestão de fluxos
│   │   │   └── settings/               # Componentes de configurações
│   │   ├── contexts/
│   │   │   ├── AuthContext.js          # Contexto de autenticação
│   │   │   └── AppContext.js           # Contexto da aplicação
│   │   ├── pages/
│   │   │   ├── Dashboard.js            # Página principal
│   │   │   ├── Users.js                # Gestão de usuários
│   │   │   ├── UserDetail.js           # Detalhes do usuário
│   │   │   ├── Payments.js             # Gestão de pagamentos
│   │   │   ├── FlowEditor.js           # Editor de fluxos
│   │   │   ├── Settings.js             # Configurações
│   │   │   ├── Analytics.js            # Análises e métricas
│   │   │   └── Login.js                # Página de login
│   │   └── utils/
│   │       ├── formatters.js           # Formatadores de dados
│   │       └── validators.js           # Validadores de formulários
│   └── README.md
```

## Fluxos Principais

### 1. Fluxo do Assistente

1. Receber webhook do WhatsApp via Evolution API
2. Extrair dados da mensagem (texto, nome, número de telefone)
3. Verificar se o usuário existe no Supabase
4. Se não existir, criar usuário e iniciar onboarding personalizado
5. Analisar intenção da mensagem com OpenAI
6. Rotear com base na intenção detectada
7. Gerar resposta personalizada com Claude
8. Enviar resposta via WhatsApp
9. Registrar interação e dados de sintomas no banco de dados
10. Atualizar modelo preditivo com novos dados

### 2. Fluxo Preditivo e Proativo

1. Executar diariamente análise de dados históricos de cada usuário
2. Gerar previsão personalizada para o dia seguinte
3. Enviar mensagem proativa com previsão e recomendações
4. Solicitar feedback sobre a precisão da previsão
5. Incorporar feedback para melhorar o modelo preditivo
6. Identificar padrões coletivos entre usuários similares
7. Ajustar previsões com base em dados coletivos e individuais

### 3. Fluxo do Painel Admin

1. Autenticação de administradores via Supabase Auth
2. Dashboard com métricas em tempo real
3. Gestão completa de usuários (visualização, edição, suspensão)
4. Monitoramento de conversas e interações
5. Configuração de novos fluxos de conversa
6. Gestão de assinaturas e pagamentos
7. Visualização de métricas e análises
8. Configurações do sistema e do assistente

## Detalhes de Implementação

### 1. Backend (Node.js/Express)

#### 1.1 Configuração do Projeto

**package.json**

```json
{
  "name": "fibromialgia-assistant-backend",
  "version": "1.0.0",
  "description": "Backend para assistente virtual de fibromialgia com sistema preditivo",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "setup-db": "node scripts/setup-database.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.2",
    "cors": "^2.8.5",
    "cron": "^3.1.6",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-jwt": "^8.4.1",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "node-cron": "^3.0.3",
    "openai": "^4.20.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**src/index.js**

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const schedulerService = require("./services/schedulerService");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Fibromialgia Assistant API" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});

// Iniciar serviço de agendamento
schedulerService.initScheduledTasks();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
```

#### 1.2 Serviço de Previsão

**src/services/predictionService.js**

```javascript
const openaiClient = require("../config/openai");
const predictionModel = require("../models/predictionModel");
const symptomModel = require("../models/symptomModel");
const interactionModel = require("../models/interactionModel");
const logger = require("../utils/logger");

/**
 * Gera uma previsão para o dia seguinte com base nos dados históricos
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Previsão gerada
 */
async function generateDailyPrediction(userId) {
  try {
    // Obter dados históricos de sintomas
    const recentSymptoms = await symptomModel.getRecentSymptoms(userId, 14); // últimos 14 dias

    // Obter dados de interações recentes
    const recentInteractions = await interactionModel.getRecentInteractions(
      userId,
      10
    );

    // Obter dados coletivos de usuários similares
    const collectiveData = await getCollectiveInsights(userId);

    // Preparar dados para o modelo preditivo
    const predictionData = {
      recentSymptoms,
      recentInteractions,
      collectiveData,
    };

    // Gerar previsão usando OpenAI
    const prediction = await predictWithAI(predictionData);

    // Salvar previsão no banco de dados
    await predictionModel.savePrediction({
      user_id: userId,
      prediction_date: new Date(new Date().setDate(new Date().getDate() + 1))
        .toISOString()
        .split("T")[0],
      predicted_pain_level: prediction.painLevel,
      predicted_fatigue_level: prediction.fatigueLevel,
      predicted_sleep_quality: prediction.sleepQuality,
      predicted_mood_level: prediction.moodLevel,
      recommendations: prediction.recommendations,
      factors: prediction.factors,
      raw_prediction_data: prediction,
    });

    return prediction;
  } catch (error) {
    logger.error(`Error generating prediction: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém insights coletivos de usuários similares
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Dados coletivos
 */
async function getCollectiveInsights(userId) {
  try {
    // Implementar lógica para encontrar usuários com perfis similares
    // e agregar seus dados de forma anônima

    // Exemplo simplificado:
    const userProfile = await symptomModel.getUserProfile(userId);
    const similarUsers = await symptomModel.findSimilarUsers(userProfile);
    const collectiveData = await symptomModel.aggregateDataFromUsers(
      similarUsers
    );

    return collectiveData;
  } catch (error) {
    logger.error(`Error getting collective insights: ${error.message}`);
    return {}; // Retornar objeto vazio em caso de erro
  }
}

/**
 * Usa IA para gerar previsão com base nos dados
 * @param {Object} data - Dados para previsão
 * @returns {Promise<Object>} Previsão gerada
 */
async function predictWithAI(data) {
  try {
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Você é um sistema preditivo especializado em fibromialgia. Com base nos dados históricos de sintomas e interações do usuário, bem como dados coletivos de usuários similares, gere uma previsão para o dia seguinte. A previsão deve incluir níveis esperados de dor, fadiga, qualidade do sono e humor (escala 1-10), fatores que podem influenciar esses níveis, e recomendações personalizadas. Responda em formato JSON.`,
        },
        {
          role: "user",
          content: `Dados para previsão: ${JSON.stringify(data)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0].message.content;

    try {
      return JSON.parse(content);
    } catch (parseError) {
      logger.warn(`Failed to parse prediction: ${parseError.message}`);
      // Fallback para caso não consiga fazer o parse
      return {
        painLevel: 5,
        fatigueLevel: 5,
        sleepQuality: 5,
        moodLevel: 5,
        recommendations: [
          "Mantenha-se hidratado",
          "Pratique técnicas de relaxamento",
          "Evite esforços excessivos",
        ],
        factors: ["Padrão de sono irregular", "Mudanças climáticas"],
      };
    }
  } catch (error) {
    logger.error(`Error in AI prediction: ${error.message}`);
    // Fallback em caso de erro na API
    return {
      painLevel: 5,
      fatigueLevel: 5,
      sleepQuality: 5,
      moodLevel: 5,
      recommendations: [
        "Mantenha-se hidratado",
        "Pratique técnicas de relaxamento",
        "Evite esforços excessivos",
      ],
      factors: ["Dados insuficientes para análise completa"],
    };
  }
}

/**
 * Avalia a precisão das previsões anteriores com base no feedback
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Métricas de precisão
 */
async function evaluatePredictionAccuracy(userId) {
  try {
    const predictions = await predictionModel.getUserPredictions(userId, 30); // últimos 30 dias
    const actualSymptoms = await symptomModel.getRecentSymptoms(userId, 30);

    // Mapear previsões com dados reais do mesmo dia
    const matchedData = predictions
      .map((prediction) => {
        const actualData = actualSymptoms.find(
          (s) => s.date.split("T")[0] === prediction.prediction_date
        );

        if (!actualData) return null;

        return {
          prediction,
          actual: actualData,
          accuracy: calculateAccuracy(prediction, actualData),
        };
      })
      .filter((item) => item !== null);

    // Calcular métricas gerais
    const overallAccuracy =
      matchedData.reduce((sum, item) => sum + item.accuracy, 0) /
      matchedData.length;

    return {
      overallAccuracy,
      sampleSize: matchedData.length,
      detailedResults: matchedData,
    };
  } catch (error) {
    logger.error(`Error evaluating prediction accuracy: ${error.message}`);
    throw error;
  }
}

/**
 * Calcula a precisão entre previsão e dados reais
 * @param {Object} prediction - Dados da previsão
 * @param {Object} actual - Dados reais
 * @returns {number} Pontuação de precisão (0-1)
 */
function calculateAccuracy(prediction, actual) {
  const painDiff = Math.abs(
    prediction.predicted_pain_level - actual.pain_level
  );
  const fatigueDiff = Math.abs(
    prediction.predicted_fatigue_level - actual.fatigue_level
  );
  const sleepDiff = Math.abs(
    prediction.predicted_sleep_quality - actual.sleep_quality
  );
  const moodDiff = Math.abs(
    prediction.predicted_mood_level - actual.mood_level
  );

  // Calcular diferença média (escala 0-10)
  const avgDiff = (painDiff + fatigueDiff + sleepDiff + moodDiff) / 4;

  // Converter para precisão (0-1)
  return Math.max(0, 1 - avgDiff / 10);
}

module.exports = {
  generateDailyPrediction,
  getCollectiveInsights,
  evaluatePredictionAccuracy,
};
```

#### 1.3 Serviço de Agendamento

**src/services/schedulerService.js**

```javascript
const cron = require("node-cron");
const userModel = require("../models/userModel");
const predictionService = require("./predictionService");
const whatsappService = require("./whatsappService");
const logger = require("../utils/logger");

/**
 * Inicializa todas as tarefas agendadas
 */
function initScheduledTasks() {
  // Gerar previsões diárias (às 20h)
  cron.schedule("0 20 * * *", generateDailyPredictions);

  // Enviar previsões aos usuários (às 7h)
  cron.schedule("0 7 * * *", sendDailyPredictions);

  // Solicitar registro de sintomas (às 19h)
  cron.schedule("0 19 * * *", requestSymptomTracking);

  // Atualizar modelo de aprendizado coletivo (às 2h da manhã)
  cron.schedule("0 2 * * *", updateCollectiveLearningModel);

  logger.info("Scheduled tasks initialized");
}

/**
 * Gera previsões diárias para todos os usuários ativos
 */
async function generateDailyPredictions() {
  try {
    logger.info("Starting daily predictions generation");

    // Obter todos os usuários ativos com assinatura válida
    const activeUsers = await userModel.getActiveUsers();

    logger.info(`Generating predictions for ${activeUsers.length} users`);

    // Gerar previsões para cada usuário
    for (const user of activeUsers) {
      try {
        await predictionService.generateDailyPrediction(user.id);
        logger.info(`Generated prediction for user ${user.id}`);
      } catch (error) {
        logger.error(
          `Error generating prediction for user ${user.id}: ${error.message}`
        );
        // Continuar com o próximo usuário
      }
    }

    logger.info("Daily predictions generation completed");
  } catch (error) {
    logger.error(`Error in daily predictions generation: ${error.message}`);
  }
}

/**
 * Envia previsões diárias para todos os usuários ativos
 */
async function sendDailyPredictions() {
  try {
    logger.info("Starting daily predictions sending");

    // Obter todos os usuários ativos com assinatura válida
    const activeUsers = await userModel.getActiveUsers();

    logger.info(`Sending predictions to ${activeUsers.length} users`);

    // Enviar previsão para cada usuário
    for (const user of activeUsers) {
      try {
        // Obter a previsão mais recente para o usuário
        const prediction = await predictionService.getMostRecentPrediction(
          user.id
        );

        if (!prediction) {
          logger.warn(`No prediction found for user ${user.id}`);
          continue;
        }

        // Formatar mensagem de previsão
        const message = formatPredictionMessage(prediction, user);

        // Enviar mensagem via WhatsApp
        await whatsappService.sendTextMessage(user.phone, message);

        logger.info(`Sent prediction to user ${user.id}`);
      } catch (error) {
        logger.error(
          `Error sending prediction to user ${user.id}: ${error.message}`
        );
        // Continuar com o próximo usuário
      }
    }

    logger.info("Daily predictions sending completed");
  } catch (error) {
    logger.error(`Error in daily predictions sending: ${error.message}`);
  }
}

/**
 * Formata a mensagem de previsão para envio
 * @param {Object} prediction - Dados da previsão
 * @param {Object} user - Dados do usuário
 * @returns {string} Mensagem formatada
 */
function formatPredictionMessage(prediction, user) {
  return `Bom dia, ${user.name || "Amigo(a)"}! 🌞

*PREVISÃO PARA HOJE*
Com base nos seus dados recentes e padrões que observei, hoje você pode esperar:

• Nível de dor: ${prediction.predicted_pain_level}/10
• Nível de fadiga: ${prediction.predicted_fatigue_level}/10
• Qualidade do sono: ${prediction.predicted_sleep_quality}/10
• Nível de humor: ${prediction.predicted_mood_level}/10

*FATORES DE INFLUÊNCIA*
${prediction.factors.map((factor) => `• ${factor}`).join("\n")}

*RECOMENDAÇÕES PERSONALIZADAS*
${prediction.recommendations.map((rec) => `• ${rec}`).join("\n")}

Como está se sentindo hoje? Sua resposta me ajudará a melhorar minhas previsões futuras. 💙`;
}

/**
 * Solicita registro de sintomas aos usuários
 */
async function requestSymptomTracking() {
  try {
    logger.info("Starting symptom tracking requests");

    // Obter todos os usuários ativos com assinatura válida
    const activeUsers = await userModel.getActiveUsers();

    logger.info(`Requesting symptom tracking from ${activeUsers.length} users`);

    // Solicitar registro para cada usuário
    for (const user of activeUsers) {
      try {
        const message = `Olá, ${user.name || "Amigo(a)"} 👋

Como foi seu dia hoje? Gostaria de registrar como você está se sentindo para que eu possa acompanhar sua evolução e melhorar minhas previsões.

Por favor, responda com seus níveis atuais (1-10):
• Dor: ?/10
• Fadiga: ?/10
• Qualidade do sono: ?/10
• Humor: ?/10

Alguma observação adicional sobre seu dia?`;

        // Enviar mensagem via WhatsApp
        await whatsappService.sendTextMessage(user.phone, message);

        logger.info(`Requested symptom tracking from user ${user.id}`);
      } catch (error) {
        logger.error(
          `Error requesting symptom tracking from user ${user.id}: ${error.message}`
        );
        // Continuar com o próximo usuário
      }
    }

    logger.info("Symptom tracking requests completed");
  } catch (error) {
    logger.error(`Error in symptom tracking requests: ${error.message}`);
  }
}

/**
 * Atualiza o modelo de aprendizado coletivo
 */
async function updateCollectiveLearningModel() {
  try {
    logger.info("Starting collective learning model update");

    // Implementar lógica para atualizar o modelo de aprendizado coletivo
    // com base nos dados mais recentes de todos os usuários

    logger.info("Collective learning model update completed");
  } catch (error) {
    logger.error(`Error in collective learning model update: ${error.message}`);
  }
}

module.exports = {
  initScheduledTasks,
  generateDailyPredictions,
  sendDailyPredictions,
  requestSymptomTracking,
  updateCollectiveLearningModel,
};
```

#### 1.4 Modelo de Sintomas

**src/models/symptomModel.js**

```javascript
const supabase = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Registra sintomas do usuário
 * @param {Object} symptomData - Dados dos sintomas
 * @returns {Promise<Object>} Sintomas registrados
 */
async function recordSymptoms(symptomData) {
  try {
    const { data, error } = await supabase
      .from("symptoms")
      .insert([
        {
          user_id: symptomData.user_id,
          pain_level: symptomData.pain_level,
          fatigue_level: symptomData.fatigue_level,
          sleep_quality: symptomData.sleep_quality,
          mood_level: symptomData.mood_level,
          weather: symptomData.weather,
          activities: symptomData.activities,
          notes: symptomData.notes,
          date: symptomData.date || new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error recording symptoms: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém sintomas recentes do usuário
 * @param {string} userId - ID do usuário
 * @param {number} days - Número de dias para buscar
 * @returns {Promise<Array>} Lista de sintomas
 */
async function getRecentSymptoms(userId, days = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("symptoms")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDate.toISOString())
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error getting recent symptoms: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém o perfil de sintomas do usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} Perfil de sintomas
 */
async function getUserProfile(userId) {
  try {
    // Obter sintomas dos últimos 30 dias
    const symptoms = await getRecentSymptoms(userId, 30);

    // Calcular médias
    const avgPain =
      symptoms.reduce((sum, s) => sum + s.pain_level, 0) / symptoms.length;
    const avgFatigue =
      symptoms.reduce((sum, s) => sum + s.fatigue_level, 0) / symptoms.length;
    const avgSleep =
      symptoms.reduce((sum, s) => sum + s.sleep_quality, 0) / symptoms.length;
    const avgMood =
      symptoms.reduce((sum, s) => sum + s.mood_level, 0) / symptoms.length;

    // Identificar padrões
    const commonActivities = identifyCommonItems(
      symptoms.map((s) => s.activities || [])
    );
    const commonWeather = identifyCommonItems(
      symptoms.map((s) => s.weather || "")
    );

    return {
      userId,
      avgPain,
      avgFatigue,
      avgSleep,
      avgMood,
      commonActivities,
      commonWeather,
      sampleSize: symptoms.length,
    };
  } catch (error) {
    logger.error(`Error getting user profile: ${error.message}`);
    throw error;
  }
}

/**
 * Identifica itens comuns em uma lista
 * @param {Array} items - Lista de itens
 * @returns {Array} Itens mais comuns
 */
function identifyCommonItems(items) {
  const flatItems = items.flat();
  const counts = {};

  flatItems.forEach((item) => {
    counts[item] = (counts[item] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map((entry) => entry[0]);
}

/**
 * Encontra usuários com perfil similar
 * @param {Object} profile - Perfil do usuário
 * @returns {Promise<Array>} Lista de IDs de usuários similares
 */
async function findSimilarUsers(profile) {
  try {
    // Implementar lógica para encontrar usuários com perfil similar
    // Exemplo simplificado:
    const { data, error } = await supabase.rpc("find_similar_users", {
      p_user_id: profile.userId,
      p_pain_threshold: 1.5,
      p_fatigue_threshold: 1.5,
      p_sleep_threshold: 1.5,
      p_mood_threshold: 1.5,
      p_limit: 20,
    });

    if (error) throw error;
    return data.map((user) => user.id);
  } catch (error) {
    logger.error(`Error finding similar users: ${error.message}`);
    return []; // Retornar array vazio em caso de erro
  }
}

/**
 * Agrega dados de um grupo de usuários
 * @param {Array} userIds - Lista de IDs de usuários
 * @returns {Promise<Object>} Dados agregados
 */
async function aggregateDataFromUsers(userIds) {
  try {
    if (userIds.length === 0) return {};

    // Implementar lógica para agregar dados de usuários
    // Exemplo simplificado:
    const { data, error } = await supabase.rpc("aggregate_user_symptoms", {
      p_user_ids: userIds,
      p_days: 30,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(`Error aggregating data from users: ${error.message}`);
    return {}; // Retornar objeto vazio em caso de erro
  }
}

module.exports = {
  recordSymptoms,
  getRecentSymptoms,
  getUserProfile,
  findSimilarUsers,
  aggregateDataFromUsers,
};
```

#### 1.5 Controlador Admin

**src/controllers/adminController.js**

```javascript
const userModel = require("../models/userModel");
const interactionModel = require("../models/interactionModel");
const symptomModel = require("../models/symptomModel");
const predictionModel = require("../models/predictionModel");
const subscriptionModel = require("../models/subscriptionModel");
const logger = require("../utils/logger");

/**
 * Obtém estatísticas gerais do sistema
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function getSystemStats(req, res) {
  try {
    // Total de usuários
    const totalUsers = await userModel.getTotalUsers();

    // Usuários ativos (últimos 7 dias)
    const activeUsers = await userModel.getActiveUserCount(7);

    // Total de interações
    const totalInteractions = await interactionModel.getTotalInteractions();

    // Interações nos últimos 7 dias
    const recentInteractions = await interactionModel.getRecentInteractionCount(
      7
    );

    // Precisão média das previsões
    const predictionAccuracy =
      await predictionModel.getAveragePredictionAccuracy();

    // Receita total
    const totalRevenue = await subscriptionModel.getTotalRevenue();

    // Receita mensal
    const monthlyRevenue = await subscriptionModel.getMonthlyRevenue();

    res.status(200).json({
      status: "success",
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          retentionRate: ((activeUsers / totalUsers) * 100).toFixed(2),
        },
        interactions: {
          total: totalInteractions,
          recent: recentInteractions,
          averagePerUser: (totalInteractions / totalUsers).toFixed(2),
        },
        predictions: {
          accuracy: predictionAccuracy,
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
        },
      },
    });
  } catch (error) {
    logger.error(`Error getting system stats: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * Obtém lista de usuários com filtros
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function getUsers(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      subscription_status,
      search,
      sort_by = "created_at",
      sort_order = "desc",
    } = req.query;

    const users = await userModel.getUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      subscription_status,
      search,
      sort_by,
      sort_order,
    });

    res.status(200).json({
      status: "success",
      data: users.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count,
        pages: Math.ceil(users.count / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * Obtém detalhes de um usuário específico
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function getUserDetails(req, res) {
  try {
    const { id } = req.params;

    // Dados básicos do usuário
    const user = await userModel.getUserById(id);

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Histórico de interações
    const interactions = await interactionModel.getUserInteractions(id, 20);

    // Histórico de sintomas
    const symptoms = await symptomModel.getRecentSymptoms(id, 30);

    // Histórico de previsões
    const predictions = await predictionModel.getUserPredictions(id, 30);

    // Detalhes da assinatura
    const subscription = await subscriptionModel.getUserSubscription(id);

    res.status(200).json({
      status: "success",
      data: {
        user,
        interactions,
        symptoms,
        predictions,
        subscription,
      },
    });
  } catch (error) {
    logger.error(`Error getting user details: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * Atualiza dados de um usuário
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const userData = req.body;

    // Verificar se o usuário existe
    const existingUser = await userModel.getUserById(id);

    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    // Atualizar usuário
    const updatedUser = await userModel.updateUser(id, userData);

    res.status(200).json({
      status: "success",
      data: updatedUser,
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
}

/**
 * Gerencia a assinatura de um usuário
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 */
async function manageSubscription(req, res) {
  try {
    const { id } = req.params;
    const { action, plan, expiry_date } = req.body;

    // Verificar se o usuário existe
    const existingUser = await userModel.getUserById(id);

    if (!existingUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    let result;

    switch (action) {
      case "activate":
        result = await subscriptionModel.activateSubscription(
          id,
          plan,
          expiry_date
        );
        break;
      case "cancel":
        result = await subscriptionModel.cancelSubscription(id);
        break;
      case "extend":
        result = await subscriptionModel.extendSubscription(id, expiry_date);
        break;
      default:
        return res
          .status(400)
          .json({ status: "error", message: "Invalid action" });
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(`Error managing subscription: ${error.message}`);
    res.status(500).json({ status: "error", message: error.message });
  }
}

module.exports = {
  getSystemStats,
  getUsers,
  getUserDetails,
  updateUser,
  manageSubscription,
};
```

### 2. Frontend Admin (React)

#### 2.1 Configuração do Projeto

**package.json**

```json
{
  "name": "fibromialgia-admin-panel",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.18",
    "@mui/material": "^5.14.18",
    "@mui/x-data-grid": "^6.18.1",
    "@supabase/supabase-js": "^2.39.0",
    "axios": "^1.6.2",
    "chart.js": "^4.4.0",
    "date-fns": "^2.30.0",
    "react": "^18.2.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.19.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": ["react-app", "react-app/jest"]
  },
  "browserslist": {
    "production": [">0.2%", "not dead", "not op_mini all"],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

#### 2.2 Configuração do Supabase

**src/api/supabase.js**

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Supabase URL and key must be defined in environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
```

#### 2.3 Contexto de Autenticação

**src/contexts/AuthContext.js**

```javascript
import React, { createContext, useState, useEffect, useContext } from "react";
import supabase from "../api/supabase";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    const session = supabase.auth.getSession();
    setUser(session?.user || null);
    setLoading(false);

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  // Função de login
  async function login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error logging in:", error.message);
      throw error;
    }
  }

  // Função de logout
  async function logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Error logging out:", error.message);
      throw error;
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
```

#### 2.4 Página de Dashboard

**src/pages/Dashboard.js**

```javascript
import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  CircularProgress,
} from "@mui/material";
import {
  PeopleOutline,
  MessageOutline,
  TrendingUp,
  AttachMoney,
} from "@mui/icons-material";
import { Line, Bar } from "react-chartjs-2";
import apiClient from "../api/apiClient";

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [userTrend, setUserTrend] = useState(null);
  const [interactionTrend, setInteractionTrend] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Obter estatísticas gerais
        const statsResponse = await apiClient.get("/admin/stats");
        setStats(statsResponse.data.data);

        // Obter tendências de usuários
        const userTrendResponse = await apiClient.get("/admin/trends/users");
        setUserTrend(userTrendResponse.data.data);

        // Obter tendências de interações
        const interactionTrendResponse = await apiClient.get(
          "/admin/trends/interactions"
        );
        setInteractionTrend(interactionTrendResponse.data.data);

        // Obter tendências de receita
        const revenueTrendResponse = await apiClient.get(
          "/admin/trends/revenue"
        );
        setRevenueTrend(revenueTrendResponse.data.data);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Cards de estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Usuários Totais"
            value={stats.users.total}
            subtitle={`${stats.users.active} ativos`}
            icon={<PeopleOutline />}
            color="#3f51b5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Interações"
            value={stats.interactions.total}
            subtitle={`${stats.interactions.recent} nos últimos 7 dias`}
            icon={<MessageOutline />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Precisão Previsões"
            value={`${stats.predictions.accuracy}%`}
            subtitle="Média geral"
            icon={<TrendingUp />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Receita Mensal"
            value={`R$ ${stats.revenue.monthly.toFixed(2)}`}
            subtitle={`Total: R$ ${stats.revenue.total.toFixed(2)}`}
            icon={<AttachMoney />}
            color="#f44336"
          />
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Crescimento de Usuários
            </Typography>
            <Line data={userTrendData(userTrend)} options={chartOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Distribuição de Assinaturas
            </Typography>
            <Bar data={subscriptionData(stats)} options={chartOptions} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: 300,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Interações Diárias
            </Typography>
            <Line
              data={interactionTrendData(interactionTrend)}
              options={chartOptions}
            />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

// Componente de card de estatística
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
            <Typography variant="body2" color="textSecondary">
              {subtitle}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: "50%",
              p: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {React.cloneElement(icon, { style: { color, fontSize: 40 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// Funções para formatar dados dos gráficos
function userTrendData(data) {
  return {
    labels: data.dates,
    datasets: [
      {
        label: "Novos Usuários",
        data: data.new_users,
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.1)",
        fill: true,
      },
      {
        label: "Usuários Ativos",
        data: data.active_users,
        borderColor: "#4caf50",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        fill: true,
      },
    ],
  };
}

function interactionTrendData(data) {
  return {
    labels: data.dates,
    datasets: [
      {
        label: "Interações",
        data: data.interactions,
        borderColor: "#ff9800",
        backgroundColor: "rgba(255, 152, 0, 0.1)",
        fill: true,
      },
    ],
  };
}

function subscriptionData(stats) {
  // Exemplo simplificado
  return {
    labels: ["Trial", "Básico", "Premium"],
    datasets: [
      {
        label: "Usuários",
        data: [
          stats.users.total - stats.users.active,
          stats.users.active * 0.7, // Exemplo: 70% dos ativos são básicos
          stats.users.active * 0.3, // Exemplo: 30% dos ativos são premium
        ],
        backgroundColor: [
          "rgba(255, 152, 0, 0.6)",
          "rgba(63, 81, 181, 0.6)",
          "rgba(76, 175, 80, 0.6)",
        ],
        borderColor: [
          "rgb(255, 152, 0)",
          "rgb(63, 81, 181)",
          "rgb(76, 175, 80)",
        ],
        borderWidth: 1,
      },
    ],
  };
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
  },
};

export default Dashboard;
```

#### 2.5 Página de Gestão de Usuários

**src/pages/Users.js**

```javascript
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Search,
  Refresh,
  Visibility,
  Edit,
  Delete,
  FilterList,
} from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import apiClient from "../api/apiClient";

function Users() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    subscription_status: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, filters]);

  async function fetchUsers() {
    try {
      setLoading(true);

      const params = {
        page: page + 1, // API usa base 1 para páginas
        limit: pageSize,
        ...filters,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await apiClient.get("/admin/users", { params });

      setUsers(response.data.data);
      setTotalUsers(response.data.pagination.total);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setLoading(false);
    }
  }

  function handleSearch() {
    setPage(0); // Resetar para primeira página
    fetchUsers();
  }

  function handleFilterChange(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPage(0); // Resetar para primeira página
  }

  function handleViewUser(id) {
    navigate(`/users/${id}`);
  }

  function handleEditUser(id) {
    navigate(`/users/${id}/edit`);
  }

  async function handleDeleteUser(id) {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita."
      )
    ) {
      try {
        await apiClient.delete(`/admin/users/${id}`);
        fetchUsers(); // Recarregar lista
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Erro ao excluir usuário. Por favor, tente novamente.");
      }
    }
  }

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Nome", width: 150 },
    { field: "phone", headerName: "Telefone", width: 150 },
    {
      field: "subscription_status",
      headerName: "Assinatura",
      width: 130,
      renderCell: (params) => {
        const status = params.value;
        let color = "default";

        switch (status) {
          case "trial":
            color = "warning";
            break;
          case "active":
            color = "success";
            break;
          case "expired":
            color = "error";
            break;
          default:
            color = "default";
        }

        return <Chip label={status} color={color} size="small" />;
      },
    },
    {
      field: "last_interaction",
      headerName: "Última Interação",
      width: 180,
      valueFormatter: (params) => {
        return params.value
          ? format(new Date(params.value), "dd/MM/yyyy HH:mm")
          : "Nunca";
      },
    },
    {
      field: "created_at",
      headerName: "Cadastro",
      width: 180,
      valueFormatter: (params) => {
        return format(new Date(params.value), "dd/MM/yyyy HH:mm");
      },
    },
    {
      field: "actions",
      headerName: "Ações",
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Visualizar">
            <IconButton
              onClick={() => handleViewUser(params.row.id)}
              size="small"
            >
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton
              onClick={() => handleEditUser(params.row.id)}
              size="small"
            >
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              onClick={() => handleDeleteUser(params.row.id)}
              size="small"
              color="error"
            >
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Usuários</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/users/new")}
        >
          Novo Usuário
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TextField
            label="Buscar usuário"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} edge="end">
                    <Search />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mr: 2 }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => {
              /* Abrir modal de filtros avançados */
            }}
            sx={{ mr: 2, whiteSpace: "nowrap" }}
          >
            Filtros
          </Button>

          <IconButton onClick={fetchUsers}>
            <Refresh />
          </IconButton>
        </Box>

        {/* Chips de filtros ativos */}
        {Object.entries(filters).some(([_, value]) => value) && (
          <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
            {Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              return (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onDelete={() => handleFilterChange(key, "")}
                  size="small"
                />
              );
            })}
            <Chip
              label="Limpar filtros"
              onClick={() =>
                setFilters({ status: "", subscription_status: "" })
              }
              size="small"
              color="primary"
            />
          </Box>
        )}
      </Paper>

      <Paper sx={{ height: 600, width: "100%" }}>
        <DataGrid
          rows={users}
          columns={columns}
          pagination
          rowCount={totalUsers}
          loading={loading}
          pageSizeOptions={[5, 10, 25, 50]}
          paginationMode="server"
          page={page}
          pageSize={pageSize}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
          disableSelectionOnClick
        />
      </Paper>
    </Container>
  );
}

export default Users;
```

### 3. Estrutura do Banco de Dados (Supabase)

#### 3.1 Script de Configuração

**scripts/setup-database.js**

```javascript
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "SUPABASE_URL and SUPABASE_KEY environment variables are required"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log("Setting up database...");

    // Criar tabela de usuários
    const { error: usersError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "users",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        phone TEXT UNIQUE NOT NULL,
        name TEXT,
        subscription_status TEXT DEFAULT 'trial',
        subscription_expiry TIMESTAMP WITH TIME ZONE,
        onboarding_completed BOOLEAN DEFAULT FALSE,
        subtype TEXT,
        last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (usersError) {
      throw usersError;
    }

    // Criar tabela de interações
    const { error: interactionsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "interactions",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        message_type TEXT NOT NULL,
        user_message TEXT,
        assistant_message TEXT,
        ai_model_used TEXT,
        context_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (interactionsError) {
      throw interactionsError;
    }

    // Criar tabela de sintomas
    const { error: symptomsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "symptoms",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        pain_level INTEGER,
        fatigue_level INTEGER,
        sleep_quality INTEGER,
        mood_level INTEGER,
        cognitive_issues INTEGER,
        weather TEXT,
        activities JSONB,
        notes TEXT,
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (symptomsError) {
      throw symptomsError;
    }

    // Criar tabela de previsões
    const { error: predictionsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "predictions",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        prediction_date DATE NOT NULL,
        predicted_pain_level INTEGER,
        predicted_fatigue_level INTEGER,
        predicted_sleep_quality INTEGER,
        predicted_mood_level INTEGER,
        recommendations JSONB,
        factors JSONB,
        accuracy FLOAT,
        raw_prediction_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (predictionsError) {
      throw predictionsError;
    }

    // Criar tabela de assinaturas
    const { error: subscriptionsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "subscriptions",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        plan TEXT NOT NULL,
        status TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        payment_method TEXT,
        payment_id TEXT,
        amount DECIMAL(10,2),
        currency TEXT DEFAULT 'BRL',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (subscriptionsError) {
      throw subscriptionsError;
    }

    // Criar tabela de administradores
    const { error: adminsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "admins",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT NOT NULL,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      `,
      }
    );

    if (adminsError) {
      throw adminsError;
    }

    // Criar tabela de configurações do sistema
    const { error: settingsError } = await supabase.rpc(
      "create_table_if_not_exists",
      {
        table_name: "settings",
        table_definition: `
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        key TEXT UNIQUE NOT NULL,
        value JSONB,
        description TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_by UUID
      `,
      }
    );

    if (settingsError) {
      throw settingsError;
    }

    // Criar função para encontrar usuários similares
    const { error: functionError } = await supabase.rpc(
      "create_function_if_not_exists",
      {
        function_name: "find_similar_users",
        function_definition: `
        CREATE OR REPLACE FUNCTION find_similar_users(
          p_user_id UUID,
          p_pain_threshold FLOAT DEFAULT 1.5,
          p_fatigue_threshold FLOAT DEFAULT 1.5,
          p_sleep_threshold FLOAT DEFAULT 1.5,
          p_mood_threshold FLOAT DEFAULT 1.5,
          p_limit INT DEFAULT 20
        )
        RETURNS TABLE (
          id UUID,
          similarity FLOAT
        )
        LANGUAGE plpgsql
        AS $$
        DECLARE
          user_avg RECORD;
        BEGIN
          -- Get average metrics for the target user
          SELECT 
            AVG(pain_level) as avg_pain,
            AVG(fatigue_level) as avg_fatigue,
            AVG(sleep_quality) as avg_sleep,
            AVG(mood_level) as avg_mood
          INTO user_avg
          FROM symptoms
          WHERE user_id = p_user_id
          AND date >= NOW() - INTERVAL '30 days';
          
          -- Find similar users
          RETURN QUERY
          WITH user_avgs AS (
            SELECT 
              s.user_id,
              AVG(s.pain_level) as avg_pain,
              AVG(s.fatigue_level) as avg_fatigue,
              AVG(s.sleep_quality) as avg_sleep,
              AVG(s.mood_level) as avg_mood
            FROM symptoms s
            WHERE s.date >= NOW() - INTERVAL '30 days'
            GROUP BY s.user_id
          )
          SELECT 
            ua.user_id as id,
            (1 - (
              ABS(ua.avg_pain - user_avg.avg_pain) + 
              ABS(ua.avg_fatigue - user_avg.avg_fatigue) + 
              ABS(ua.avg_sleep - user_avg.avg_sleep) + 
              ABS(ua.avg_mood - user_avg.avg_mood)
            ) / 40) as similarity
          FROM user_avgs ua
          WHERE ua.user_id != p_user_id
          AND ABS(ua.avg_pain - user_avg.avg_pain) <= p_pain_threshold
          AND ABS(ua.avg_fatigue - user_avg.avg_fatigue) <= p_fatigue_threshold
          AND ABS(ua.avg_sleep - user_avg.avg_sleep) <= p_sleep_threshold
          AND ABS(ua.avg_mood - user_avg.avg_mood) <= p_mood_threshold
          ORDER BY similarity DESC
          LIMIT p_limit;
        END;
        $$;
      `,
      }
    );

    if (functionError) {
      throw functionError;
    }

    // Criar função para agregar dados de sintomas
    const { error: aggregateError } = await supabase.rpc(
      "create_function_if_not_exists",
      {
        function_name: "aggregate_user_symptoms",
        function_definition: `
        CREATE OR REPLACE FUNCTION aggregate_user_symptoms(
          p_user_ids UUID[],
          p_days INT DEFAULT 30
        )
        RETURNS JSON
        LANGUAGE plpgsql
        AS $$
        DECLARE
          result JSON;
        BEGIN
          SELECT json_build_object(
            'avg_pain', AVG(pain_level),
            'avg_fatigue', AVG(fatigue_level),
            'avg_sleep', AVG(sleep_quality),
            'avg_mood', AVG(mood_level),
            'common_activities', (
              SELECT json_agg(activity)
              FROM (
                SELECT activity, COUNT(*) as count
                FROM symptoms s, jsonb_array_elements_text(s.activities) as activity
                WHERE s.user_id = ANY(p_user_ids)
                AND s.date >= NOW() - (p_days || ' days')::INTERVAL
                GROUP BY activity
                ORDER BY count DESC
                LIMIT 10
              ) as top_activities
            ),
            'common_weather', (
              SELECT json_agg(weather)
              FROM (
                SELECT weather, COUNT(*) as count
                FROM symptoms s
                WHERE s.user_id = ANY(p_user_ids)
                AND s.date >= NOW() - (p_days || ' days')::INTERVAL
                GROUP BY weather
                ORDER BY count DESC
                LIMIT 5
              ) as top_weather
            ),
            'sample_size', COUNT(DISTINCT user_id)
          )
          INTO result
          FROM symptoms
          WHERE user_id = ANY(p_user_ids)
          AND date >= NOW() - (p_days || ' days')::INTERVAL;
          
          RETURN result;
        END;
        $$;
      `,
      }
    );

    if (aggregateError) {
      throw aggregateError;
    }

    console.log("Database setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up database:", error.message);
    process.exit(1);
  }
}

setupDatabase();
```

## Deploy no Railway

Para fazer o deploy no Railway, siga estas etapas:

### 1. Backend

1. **Crie uma conta no Railway**: Acesse [railway.app](https://railway.app/) e crie uma conta.

2. **Prepare seu projeto para o Railway**:

   - Certifique-se de que seu `package.json` tem um script `start`
   - Adicione um arquivo `Procfile` na raiz do projeto:
     ```
     web: npm start
     ```

3. **Deploy via GitHub**:

   - Faça push do seu código para um repositório GitHub
   - No dashboard do Railway, clique em "New Project" > "Deploy from GitHub repo"
   - Selecione seu repositório
   - Configure as variáveis de ambiente necessárias

4. **Configure as variáveis de ambiente**:
   No dashboard do Railway, vá para a aba "Variables" e adicione todas as variáveis de ambiente listadas no arquivo `.env.example`.

### 2. Frontend Admin

1. **Crie um projeto no Vercel**:

   - Acesse [vercel.com](https://vercel.com/) e crie uma conta
   - Conecte seu repositório GitHub
   - Selecione a pasta `admin-panel` como diretório raiz
   - Configure as variáveis de ambiente necessárias

2. **Configure as variáveis de ambiente**:
   - `REACT_APP_API_URL`: URL do backend no Railway
   - `REACT_APP_SUPABASE_URL`: URL do projeto Supabase
   - `REACT_APP_SUPABASE_KEY`: Chave anônima do Supabase

## Configuração da Evolution API

1. Acesse o painel da Evolution API
2. Configure um webhook para o endpoint do seu aplicativo:
   ```
   https://seu-app-railway.app/api/webhook/whatsapp
   ```
3. Certifique-se de que a instância está conectada e ativa

## Próximos Passos e Melhorias

1. **Implementar testes automatizados** para backend e frontend
2. **Adicionar análise de sentimento** para melhorar a detecção de emoções
3. **Implementar sistema de notificações** para administradores
4. **Adicionar integração com gateway de pagamento** para gerenciar assinaturas
5. **Implementar sistema de backup** para dados críticos
6. **Adicionar suporte a múltiplos idiomas**
7. **Implementar sistema de feedback** para usuários avaliarem as previsões
8. **Adicionar visualizações avançadas** de dados no painel admin

## Conclusão

Este projeto implementa um assistente virtual avançado para pacientes com fibromialgia via WhatsApp, com sistema preditivo e painel administrativo completo. A arquitetura é modular, escalável e segue boas práticas de desenvolvimento.

O sistema é capaz de aprender continuamente com as interações dos usuários, gerar insights personalizados e prever como será o dia do paciente com base em dados históricos individuais e coletivos.

O painel administrativo permite gerenciar usuários, monitorar conversas, configurar novos fluxos e visualizar métricas importantes para o negócio.

O deploy no Railway e Vercel garante uma hospedagem confiável e escalável, com fácil configuração e monitoramento.
