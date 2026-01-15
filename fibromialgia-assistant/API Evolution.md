# Prompt para Cursor.com: Assistente Avançado de Fibromialgia com Sistema Preditivo, Painel Admin e Self-Host Evolution API

Crie um aplicativo Node.js completo para um assistente virtual especializado em fibromialgia que integra nativamente a Evolution API em modo self-hosted, inclui sistema preditivo de sintomas e painel administrativo completo. O sistema deve aprender continuamente com as interações dos usuários, gerar insights personalizados e prever como será o dia do paciente com base em dados históricos individuais e coletivos.

## Arquitetura e Tecnologias

- **Backend**: Node.js com Express
- **Frontend Admin**: React com Material-UI
- **Banco de Dados**: Supabase (PostgreSQL)
- **WhatsApp Integration**: Evolution API (self-hosted com Docker)
- **IA**: OpenAI API (análise de intenção e sistema preditivo) e Anthropic Claude API (geração de respostas)
- **Deploy**: Railway (backend + Evolution API) e Vercel (frontend)
- **Autenticação**: Supabase Auth
- **Containerização**: Docker e Docker Compose

## Estrutura do Projeto

```
fibromialgia-assistant/
├── docker-compose.yml                # Configuração Docker para todo o projeto
├── .env.example                      # Variáveis de ambiente de exemplo
├── .gitignore
├── README.md
├── backend/                          # Aplicação principal
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── index.js                  # Ponto de entrada da aplicação
│   │   ├── config/
│   │   │   ├── environment.js        # Configurações de ambiente
│   │   │   ├── supabase.js           # Cliente Supabase
│   │   │   ├── openai.js             # Cliente OpenAI
│   │   │   ├── claude.js             # Cliente Claude
│   │   │   └── evolution.js          # Cliente para Evolution API local
│   │   ├── controllers/
│   │   │   ├── webhookController.js  # Controlador para webhook do WhatsApp
│   │   │   ├── userController.js     # Controlador para gerenciamento de usuários
│   │   │   ├── predictionController.js # Controlador para previsões
│   │   │   ├── adminController.js    # Controlador para painel admin
│   │   │   └── whatsappController.js # Controlador para gerenciar WhatsApp
│   │   ├── services/
│   │   │   ├── whatsappService.js    # Serviço para envio de mensagens WhatsApp
│   │   │   ├── intentService.js      # Serviço para análise de intenção
│   │   │   ├── responseService.js    # Serviço para geração de respostas
│   │   │   ├── userService.js        # Serviço para gerenciamento de usuários
│   │   │   ├── predictionService.js  # Serviço para previsões e insights
│   │   │   ├── learningService.js    # Serviço para aprendizado coletivo
│   │   │   ├── schedulerService.js   # Serviço para mensagens programadas
│   │   │   └── evolutionService.js   # Serviço para gerenciar Evolution API
│   │   ├── models/
│   │   │   ├── userModel.js          # Modelo para usuários
│   │   │   ├── interactionModel.js   # Modelo para interações
│   │   │   ├── symptomModel.js       # Modelo para registro de sintomas
│   │   │   ├── predictionModel.js    # Modelo para previsões
│   │   │   └── subscriptionModel.js  # Modelo para assinaturas
│   │   ├── routes/
│   │   │   ├── index.js              # Rotas principais
│   │   │   ├── webhookRoutes.js      # Rotas de webhook
│   │   │   ├── userRoutes.js         # Rotas de usuário
│   │   │   ├── predictionRoutes.js   # Rotas de previsão
│   │   │   ├── adminRoutes.js        # Rotas de admin
│   │   │   └── whatsappRoutes.js     # Rotas para gerenciar WhatsApp
│   │   └── utils/
│   │       ├── messageParser.js      # Utilitário para extrair dados de mensagens
│   │       ├── predictionUtils.js    # Utilitários para previsões
│   │       └── logger.js             # Utilitário para logging
│   └── scripts/
│       ├── setup-database.js         # Script para configuração inicial do banco
│       └── setup-evolution.js        # Script para configuração da Evolution API
│
├── evolution-api/                    # Self-host da Evolution API
│   ├── Dockerfile                    # Configuração Docker para Evolution API
│   ├── instances/                    # Diretório para armazenar instâncias
│   │   └── default/                  # Instância padrão pré-configurada
│   └── config/                       # Configurações da Evolution API
│
├── admin-panel/                      # Frontend do painel administrativo
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── api/
│   │   │   ├── supabase.js           # Cliente Supabase para o frontend
│   │   │   └── apiClient.js          # Cliente para API do backend
│   │   ├── components/
│   │   │   ├── common/               # Componentes comuns
│   │   │   ├── dashboard/            # Componentes do dashboard
│   │   │   ├── users/                # Componentes de gestão de usuários
│   │   │   ├── payments/             # Componentes de gestão de pagamentos
│   │   │   ├── flows/                # Componentes de gestão de fluxos
│   │   │   ├── whatsapp/             # Componentes de gestão do WhatsApp
│   │   │   └── settings/             # Componentes de configurações
│   │   ├── contexts/
│   │   │   ├── AuthContext.js        # Contexto de autenticação
│   │   │   └── AppContext.js         # Contexto da aplicação
│   │   ├── pages/
│   │   │   ├── Dashboard.js          # Página principal
│   │   │   ├── Users.js              # Gestão de usuários
│   │   │   ├── UserDetail.js         # Detalhes do usuário
│   │   │   ├── Payments.js           # Gestão de pagamentos
│   │   │   ├── FlowEditor.js         # Editor de fluxos
│   │   │   ├── WhatsappManager.js    # Gerenciador de WhatsApp
│   │   │   ├── Settings.js           # Configurações
│   │   │   ├── Analytics.js          # Análises e métricas
│   │   │   └── Login.js              # Página de login
│   │   └── utils/
│   │       ├── formatters.js         # Formatadores de dados
│   │       └── validators.js         # Validadores de formulários
│   └── README.md
```

## Configuração Docker

### docker-compose.yml

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    container_name: fibromialgia-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - EVOLUTION_API_URL=http://evolution-api:8080
      - EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
      - EVOLUTION_INSTANCE_ID=default
    volumes:
      - ./backend/logs:/app/logs
    depends_on:
      - evolution-api
    networks:
      - fibromialgia-network

  evolution-api:
    build: ./evolution-api
    container_name: fibromialgia-evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_TYPE=apikey
      - LOG_LEVEL=ERROR
      - CORS_ORIGIN=*
      - WEBHOOK_URL=http://backend:3000/api/webhook/whatsapp
      - WEBHOOK_EVENTS=messages,status
    volumes:
      - ./evolution-api/instances:/evolution/instances
      - ./evolution-api/store:/evolution/store
    networks:
      - fibromialgia-network

networks:
  fibromialgia-network:
    driver: bridge
```

### backend/Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### evolution-api/Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /evolution

# Instalar dependências necessárias
RUN apk add --no-cache git python3 make g++ ffmpeg

# Clonar o repositório da Evolution API
RUN git clone https://github.com/evolution-api/evolution-api.git .

# Instalar dependências
RUN npm install

# Copiar configurações personalizadas
COPY ./config /evolution/config

# Criar diretório para instâncias
RUN mkdir -p /evolution/instances/default

# Expor porta
EXPOSE 8080

# Iniciar a API
CMD ["npm", "start"]
```

## Fluxos Principais

### 1. Fluxo de Inicialização

1. Iniciar containers Docker (backend e Evolution API)
2. Configurar automaticamente a instância padrão da Evolution API
3. Gerar token de API para comunicação interna
4. Verificar conexão com o Supabase
5. Iniciar serviços de agendamento e previsão

### 2. Fluxo do Assistente

1. Receber webhook do WhatsApp via Evolution API local
2. Extrair dados da mensagem (texto, nome, número de telefone)
3. Verificar se o usuário existe no Supabase
4. Se não existir, criar usuário e iniciar onboarding personalizado
5. Analisar intenção da mensagem com OpenAI
6. Rotear com base na intenção detectada
7. Gerar resposta personalizada com Claude
8. Enviar resposta via Evolution API local
9. Registrar interação e dados de sintomas no banco de dados
10. Atualizar modelo preditivo com novos dados

### 3. Fluxo Preditivo e Proativo

1. Executar diariamente análise de dados históricos de cada usuário
2. Gerar previsão personalizada para o dia seguinte
3. Enviar mensagem proativa com previsão e recomendações
4. Solicitar feedback sobre a precisão da previsão
5. Incorporar feedback para melhorar o modelo preditivo
6. Identificar padrões coletivos entre usuários similares
7. Ajustar previsões com base em dados coletivos e individuais

### 4. Fluxo do Painel Admin para WhatsApp

1. Autenticação de administradores via Supabase Auth
2. Visualização do status da instância do WhatsApp
3. Interface para trocar o número de WhatsApp conectado
4. Processo de escaneamento de QR Code para nova conexão
5. Monitoramento de status da conexão
6. Logs de eventos da Evolution API
7. Opções de reiniciar instância ou limpar dados

## Detalhes de Implementação

### 1. Configuração da Evolution API Self-Hosted

#### scripts/setup-evolution.js

```javascript
require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const logger = require("../src/utils/logger");

const EVOLUTION_API_URL =
  process.env.EVOLUTION_API_URL || "http://evolution-api:8080";
const EVOLUTION_API_KEY =
  process.env.EVOLUTION_API_KEY || "sua-chave-api-segura";
const INSTANCE_NAME = "default";

/**
 * Configura a Evolution API
 */
async function setupEvolutionApi() {
  try {
    logger.info("Iniciando configuração da Evolution API...");

    // Verificar se a API está online
    await waitForEvolutionApi();

    // Verificar se a instância já existe
    const instanceExists = await checkInstanceExists();

    if (!instanceExists) {
      // Criar instância padrão
      await createInstance();
      logger.info(`Instância "${INSTANCE_NAME}" criada com sucesso`);
    } else {
      logger.info(`Instância "${INSTANCE_NAME}" já existe`);
    }

    logger.info("Configuração da Evolution API concluída com sucesso");
  } catch (error) {
    logger.error(`Erro na configuração da Evolution API: ${error.message}`);
    throw error;
  }
}

/**
 * Aguarda a Evolution API ficar online
 */
async function waitForEvolutionApi(retries = 30, delay = 2000) {
  logger.info("Aguardando Evolution API ficar online...");

  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(`${EVOLUTION_API_URL}/api/healthz`, {
        headers: { apikey: EVOLUTION_API_KEY },
      });

      if (response.status === 200) {
        logger.info("Evolution API está online");
        return true;
      }
    } catch (error) {
      logger.debug(
        `Tentativa ${i + 1}/${retries}: Evolution API ainda não está disponível`
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Evolution API não ficou disponível após várias tentativas");
}

/**
 * Verifica se a instância já existe
 */
async function checkInstanceExists() {
  try {
    const response = await axios.get(
      `${EVOLUTION_API_URL}/api/instance/instances`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    );

    return response.data.instances.includes(INSTANCE_NAME);
  } catch (error) {
    logger.error(`Erro ao verificar instâncias: ${error.message}`);
    return false;
  }
}

/**
 * Cria a instância padrão
 */
async function createInstance() {
  try {
    const response = await axios.post(
      `${EVOLUTION_API_URL}/api/instance/create`,
      {
        instanceName: INSTANCE_NAME,
        webhook: {
          url: "http://backend:3000/api/webhook/whatsapp",
          events: ["messages", "status"],
        },
        settings: {
          rejectCalls: true,
          msgReconnecting: "Reconectando...",
          welcomeMessage: "Assistente de Fibromialgia iniciado",
        },
      },
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    );

    if (response.status !== 201) {
      throw new Error(`Falha ao criar instância: ${response.data.message}`);
    }

    return true;
  } catch (error) {
    logger.error(`Erro ao criar instância: ${error.message}`);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupEvolutionApi()
    .then(() => {
      logger.info(
        "Script de configuração da Evolution API concluído com sucesso"
      );
      process.exit(0);
    })
    .catch((error) => {
      logger.error(
        `Erro no script de configuração da Evolution API: ${error.message}`
      );
      process.exit(1);
    });
}

module.exports = {
  setupEvolutionApi,
  waitForEvolutionApi,
  checkInstanceExists,
  createInstance,
};
```

#### src/config/evolution.js

```javascript
const axios = require("axios");
const logger = require("../utils/logger");
const { evolution } = require("./environment");

// Criar cliente axios configurado para a Evolution API
const evolutionClient = axios.create({
  baseURL: evolution.apiUrl,
  headers: {
    "Content-Type": "application/json",
    apikey: evolution.apiKey,
  },
});

// Interceptor para logging
evolutionClient.interceptors.request.use((request) => {
  logger.debug(
    `Evolution API Request: ${request.method.toUpperCase()} ${request.url}`
  );
  return request;
});

evolutionClient.interceptors.response.use(
  (response) => {
    logger.debug(`Evolution API Response: ${response.status}`);
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error(
        `Evolution API Error: ${error.response.status} - ${JSON.stringify(
          error.response.data
        )}`
      );
    } else {
      logger.error(`Evolution API Error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

module.exports = evolutionClient;
```

### 2. Serviço de Gerenciamento do WhatsApp

#### src/services/evolutionService.js

```javascript
const evolutionClient = require("../config/evolution");
const { evolution } = require("../config/environment");
const logger = require("../utils/logger");

/**
 * Obtém o status da instância
 * @returns {Promise<Object>} Status da instância
 */
async function getInstanceStatus() {
  try {
    const response = await evolutionClient.get(
      `/api/instance/info/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error getting instance status: ${error.message}`);
    throw error;
  }
}

/**
 * Inicia a instância do WhatsApp
 * @returns {Promise<Object>} Resultado da operação
 */
async function startInstance() {
  try {
    const response = await evolutionClient.post(
      `/api/instance/connect/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error starting instance: ${error.message}`);
    throw error;
  }
}

/**
 * Desconecta a instância do WhatsApp
 * @returns {Promise<Object>} Resultado da operação
 */
async function disconnectInstance() {
  try {
    const response = await evolutionClient.post(
      `/api/instance/logout/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error disconnecting instance: ${error.message}`);
    throw error;
  }
}

/**
 * Reinicia a instância do WhatsApp
 * @returns {Promise<Object>} Resultado da operação
 */
async function restartInstance() {
  try {
    const response = await evolutionClient.post(
      `/api/instance/restart/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error restarting instance: ${error.message}`);
    throw error;
  }
}

/**
 * Obtém o QR Code para conexão
 * @returns {Promise<Object>} Dados do QR Code
 */
async function getQrCode() {
  try {
    const response = await evolutionClient.get(
      `/api/instance/qrcode/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error getting QR code: ${error.message}`);
    throw error;
  }
}

/**
 * Verifica se o número está conectado
 * @param {string} phoneNumber - Número de telefone a verificar
 * @returns {Promise<boolean>} Se o número está conectado
 */
async function checkNumberConnected(phoneNumber) {
  try {
    const response = await evolutionClient.post(
      `/api/message/checkNumberStatus/${evolution.instanceId}`,
      {
        phone: phoneNumber,
      }
    );
    return response.data.status === 200;
  } catch (error) {
    logger.error(`Error checking number status: ${error.message}`);
    return false;
  }
}

/**
 * Obtém informações do perfil conectado
 * @returns {Promise<Object>} Informações do perfil
 */
async function getProfileInfo() {
  try {
    const response = await evolutionClient.get(
      `/api/instance/profile/${evolution.instanceId}`
    );
    return response.data;
  } catch (error) {
    logger.error(`Error getting profile info: ${error.message}`);
    throw error;
  }
}

/**
 * Envia mensagem de texto
 * @param {string} phoneNumber - Número de telefone do destinatário
 * @param {string} text - Texto da mensagem
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendTextMessage(phoneNumber, text) {
  try {
    const response = await evolutionClient.post(
      `/api/message/sendText/${evolution.instanceId}`,
      {
        number: phoneNumber,
        text: text,
      }
    );
    return response.data;
  } catch (error) {
    logger.error(`Error sending text message: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getInstanceStatus,
  startInstance,
  disconnectInstance,
  restartInstance,
  getQrCode,
  checkNumberConnected,
  getProfileInfo,
  sendTextMessage,
};
```

### 3. Controlador de WhatsApp para o Painel Admin

#### src/controllers/whatsappController.js

```javascript
const evolutionApiService = require("../services/evolutionApiService");
const logger = require("../utils/logger");

// Obtém o status da instância do WhatsApp
async function getStatus(req, res) {
  try {
    const status = await evolutionApiService.checkInstanceStatus(
      "fibromialgia"
    );
    res.status(200).json({
      status: "success",
      data: status,
    });
  } catch (error) {
    logger.error(`Erro ao obter status do WhatsApp: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// Obtém o QR Code para conexão
async function getQrCode(req, res) {
  try {
    const qrCode = await evolutionApiService.getQrCode("fibromialgia");
    res.status(200).json({
      status: "success",
      data: qrCode,
    });
  } catch (error) {
    logger.error(`Erro ao obter QR code: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// Envia mensagem de teste
async function sendTestMessage(req, res) {
  try {
    const { phoneNumber, message } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({
        status: "error",
        message: "Número de telefone e mensagem são obrigatórios",
      });
    }

    const result = await evolutionApiService.sendTextMessage(
      "fibromialgia",
      phoneNumber,
      message
    );
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(`Erro ao enviar mensagem de teste: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

// Reinicia a instância
async function restartInstance(req, res) {
  try {
    const result = await evolutionApiService.restartInstance("fibromialgia");
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    logger.error(`Erro ao reiniciar instância: ${error.message}`);
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
}

module.exports = {
  getStatus,
  getQrCode,
  sendTestMessage,
  restartInstance,
};
```

### 4. Rotas para Gerenciamento do WhatsApp

#### src/routes/whatsappRoutes.js

```javascript
const express = require("express");
const whatsappController = require("../controllers/whatsappController");
const router = express.Router();

// Rotas públicas (sem autenticação)
router.get("/status", whatsappController.getStatus);
router.get("/qrcode", whatsappController.getQrCode);

// Rotas que requerem autenticação
router.post("/test-message", whatsappController.sendTestMessage);
router.post("/restart", whatsappController.restartInstance);

module.exports = router;
```

### 5. Componente de Gerenciamento do WhatsApp no Painel Admin

#### src/pages/WhatsappManager.js (Frontend)

```jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  TextField,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
} from "@mui/material";
import {
  Refresh,
  QrCode,
  Send,
  PowerSettingsNew,
  RestartAlt,
  PhoneAndroid,
} from "@mui/icons-material";
import apiClient from "../api/apiClient";

function WhatsappManager() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [profileInfo, setProfileInfo] = useState(null);
  const [testMessage, setTestMessage] = useState("");
  const [testPhone, setTestPhone] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  useEffect(() => {
    fetchStatus();
    fetchProfileInfo();

    // Configurar atualização automática a cada 30 segundos
    const interval = setInterval(() => {
      fetchStatus();
    }, 30000);

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  async function fetchStatus() {
    try {
      setLoading(true);
      const response = await apiClient.get("/whatsapp/status");
      setStatus(response.data.data);
      setLoading(false);

      // Se não estiver conectado, buscar QR code
      if (response.data.data.state !== "open") {
        fetchQrCode();
      }
    } catch (error) {
      console.error("Error fetching WhatsApp status:", error);
      setError("Erro ao obter status do WhatsApp");
      setLoading(false);
    }
  }

  async function fetchQrCode() {
    try {
      const response = await apiClient.get("/whatsapp/qrcode");
      setQrCode(response.data.data.qrcode);
    } catch (error) {
      console.error("Error fetching QR code:", error);
      setError("Erro ao obter QR code");
    }
  }

  async function fetchProfileInfo() {
    try {
      const response = await apiClient.get("/whatsapp/profile");
      setProfileInfo(response.data.data);
    } catch (error) {
      console.error("Error fetching profile info:", error);
      // Não definir erro aqui, pois pode não estar conectado ainda
    }
  }

  async function handleStartInstance() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await apiClient.post("/whatsapp/start");
      setSuccess("Instância iniciada com sucesso");

      // Buscar QR code após iniciar
      fetchQrCode();

      // Atualizar status após 2 segundos
      setTimeout(() => {
        fetchStatus();
      }, 2000);
    } catch (error) {
      console.error("Error starting WhatsApp instance:", error);
      setError("Erro ao iniciar instância do WhatsApp");
      setLoading(false);
    }
  }

  async function handleDisconnectInstance() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await apiClient.post("/whatsapp/disconnect");
      setSuccess("WhatsApp desconectado com sucesso");

      // Atualizar status após 2 segundos
      setTimeout(() => {
        fetchStatus();
        setProfileInfo(null);
      }, 2000);
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      setError("Erro ao desconectar WhatsApp");
      setLoading(false);
    }
  }

  async function handleRestartInstance() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await apiClient.post("/whatsapp/restart");
      setSuccess("Instância reiniciada com sucesso");

      // Atualizar status após 5 segundos
      setTimeout(() => {
        fetchStatus();
        fetchProfileInfo();
      }, 5000);
    } catch (error) {
      console.error("Error restarting WhatsApp instance:", error);
      setError("Erro ao reiniciar instância do WhatsApp");
      setLoading(false);
    }
  }

  async function handleSendTestMessage() {
    try {
      setError(null);
      setSuccess(null);

      if (!testPhone || !testMessage) {
        setError("Número de telefone e mensagem são obrigatórios");
        return;
      }

      await apiClient.post("/whatsapp/test-message", {
        phoneNumber: testPhone,
        message: testMessage,
      });

      setSuccess("Mensagem de teste enviada com sucesso");
      setTestMessage("");
    } catch (error) {
      console.error("Error sending test message:", error);
      setError("Erro ao enviar mensagem de teste");
    }
  }

  function getStatusChip() {
    if (!status) return <Chip label="Desconhecido" color="default" />;

    switch (status.state) {
      case "open":
        return <Chip label="Conectado" color="success" />;
      case "connecting":
        return <Chip label="Conectando" color="warning" />;
      case "close":
        return <Chip label="Desconectado" color="error" />;
      default:
        return <Chip label={status.state} color="default" />;
    }
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gerenciador de WhatsApp
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Card de Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Status da Conexão</Typography>
                {getStatusChip()}
              </Box>

              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box display="flex" justifyContent="center" my={3}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {status && (
                    <Box>
                      <Typography variant="body1" gutterBottom>
                        <strong>Estado:</strong> {status.state}
                      </Typography>
                      {status.state === "open" && profileInfo && (
                        <>
                          <Typography variant="body1" gutterBottom>
                            <strong>Número:</strong> {profileInfo.wid?.user}
                          </Typography>
                          <Typography variant="body1" gutterBottom>
                            <strong>Nome:</strong> {profileInfo.pushname}
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </>
              )}
            </CardContent>
            <CardActions>
              <Button
                startIcon={<Refresh />}
                onClick={fetchStatus}
                disabled={loading}
              >
                Atualizar
              </Button>
              <Button
                startIcon={<PowerSettingsNew />}
                onClick={handleStartInstance}
                disabled={loading || status?.state === "open"}
                color="primary"
              >
                Iniciar
              </Button>
              <Button
                startIcon={<PowerSettingsNew />}
                onClick={handleDisconnectInstance}
                disabled={loading || status?.state !== "open"}
                color="error"
              >
                Desconectar
              </Button>
              <Button
                startIcon={<RestartAlt />}
                onClick={handleRestartInstance}
                disabled={loading}
                color="warning"
              >
                Reiniciar
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card de QR Code */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QR Code para Conexão
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {status?.state !== "open" ? (
                <>
                  {qrCode ? (
                    <Box display="flex" justifyContent="center" my={2}>
                      <img
                        src={`data:image/png;base64,${qrCode}`}
                        alt="QR Code"
                        style={{ width: "100%", maxWidth: "300px" }}
                      />
                    </Box>
                  ) : (
                    <Box display="flex" justifyContent="center" my={3}>
                      <CircularProgress />
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    color="textSecondary"
                    align="center"
                  >
                    Escaneie este QR Code com seu WhatsApp para conectar
                  </Typography>
                </>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  my={3}
                >
                  <PhoneAndroid
                    sx={{ fontSize: 60, color: "success.main", mb: 2 }}
                  />
                  <Typography variant="body1" align="center">
                    WhatsApp conectado com sucesso!
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button
                startIcon={<QrCode />}
                onClick={fetchQrCode}
                disabled={loading || status?.state === "open"}
              >
                Atualizar QR Code
              </Button>
            </CardActions>
          </Card>
        </Grid>

        {/* Card de Mensagem de Teste */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Enviar Mensagem de Teste
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Número de Telefone"
                    variant="outlined"
                    fullWidth
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="5511999999999"
                    helperText="Formato: DDI + DDD + Número (sem espaços ou caracteres especiais)"
                    disabled={status?.state !== "open"}
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField
                    label="Mensagem"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    disabled={status?.state !== "open"}
                  />
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <Button
                startIcon={<Send />}
                onClick={handleSendTestMessage}
                disabled={
                  loading ||
                  status?.state !== "open" ||
                  !testPhone ||
                  !testMessage
                }
                color="primary"
                variant="contained"
              >
                Enviar Mensagem de Teste
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WhatsappManager;
```

### 6. Inicialização do Backend com Evolution API

#### src/index.js

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const schedulerService = require("./services/schedulerService");
const { setupEvolutionApi } = require("../scripts/setup-evolution");
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

// Inicializar aplicação
async function initializeApp() {
  try {
    // Configurar Evolution API
    await setupEvolutionApi();

    // Iniciar serviço de agendamento
    schedulerService.initScheduledTasks();

    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Error initializing app: ${error.message}`);
    process.exit(1);
  }
}

initializeApp();
```

## Deploy no Railway

Para fazer o deploy no Railway, siga estas etapas:

### 1. Preparação

1. **Crie uma conta no Railway**: Acesse [railway.app](https://railway.app/) e crie uma conta.

2. **Instale a CLI do Railway** (opcional):

   ```bash
   npm i -g @railway/cli
   railway login
   ```

3. **Prepare seu repositório Git**:
   - Certifique-se de que todos os arquivos estão no repositório
   - Inclua o arquivo `docker-compose.yml` na raiz do projeto
   - Adicione os Dockerfiles para cada serviço

### 2. Deploy via GitHub

1. **Faça push do seu código para um repositório GitHub**

2. **No dashboard do Railway**:

   - Clique em "New Project" > "Deploy from GitHub repo"
   - Selecione seu repositório
   - Escolha a opção "Docker Compose"
   - Configure as variáveis de ambiente necessárias

3. **Configure as variáveis de ambiente**:

   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key
   CLAUDE_API_KEY=your-claude-api-key
   EVOLUTION_API_KEY=your-evolution-api-key
   ```

4. **Deploy do frontend**:
   - No Vercel, crie um novo projeto a partir do mesmo repositório
   - Selecione a pasta `admin-panel` como diretório raiz
   - Configure as variáveis de ambiente para o frontend

### 3. Monitoramento

1. **Verifique os logs** no dashboard do Railway para garantir que tudo está funcionando corretamente

2. **Monitore o uso de recursos** para ajustar os planos conforme necessário

3. **Configure alertas** para ser notificado em caso de problemas

## Conclusão

Este projeto implementa um assistente virtual avançado para pacientes com fibromialgia via WhatsApp, com sistema preditivo, painel administrativo completo e integração nativa com a Evolution API em modo self-hosted. A arquitetura é modular, escalável e segue boas práticas de desenvolvimento.

O sistema é capaz de aprender continuamente com as interações dos usuários, gerar insights personalizados e prever como será o dia do paciente com base em dados históricos individuais e coletivos.

O painel administrativo permite gerenciar usuários, monitorar conversas, configurar novos fluxos, trocar o número de WhatsApp conectado e visualizar métricas importantes para o negócio.

O deploy no Railway com Docker garante uma hospedagem confiável e escalável, com fácil configuração e monitoramento.
