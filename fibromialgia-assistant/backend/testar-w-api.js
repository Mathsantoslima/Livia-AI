#!/usr/bin/env node

/**
 * Script de Teste da Integração W-API
 * 
 * Este script verifica se a integração com a W-API está funcionando corretamente.
 */

require("dotenv").config({ path: "./.env" });
const wApiService = require("./src/services/wApiService");
const config = require("./src/config");
const logger = require("./src/utils/logger");

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testarWApi() {
  log("\n🧪 Testando Integração W-API\n", "cyan");

  // 1. Verificar configuração
  log("1️⃣ Verificando configuração...", "blue");
  const instanceId = (config.config && config.config.wApi && config.config.wApi.instanceId) || process.env.W_API_INSTANCE_ID;
  const token = (config.config && config.config.wApi && config.config.wApi.token) || process.env.W_API_TOKEN;
  const wApiUrl = (config.config && config.config.wApi && config.config.wApi.url) || process.env.W_API_URL || "https://api.w-api.app/v1";

  if (!instanceId) {
    log("❌ W_API_INSTANCE_ID não configurado", "red");
    return;
  }

  if (!token) {
    log("❌ W_API_TOKEN não configurado", "red");
    return;
  }

  log(`   ✅ Instance ID: ${instanceId}`, "green");
  log(`   ✅ Token: ${token ? token.substring(0, 10) + "..." : "não configurado"}`, "green");
  log(`   ✅ URL: ${wApiUrl}`, "green");

  // 2. Verificar status da instância
  log("\n2️⃣ Verificando status da instância...", "blue");
  try {
    const status = await wApiService.checkInstanceStatus(instanceId);
    
    log(`   Status: ${status.status || status.state || "unknown"}`, "cyan");
    
    if (status.connectedPhone) {
      log(`   ✅ Conectado ao número: ${status.connectedPhone}`, "green");
    } else {
      log(`   ⚠️  Instância não conectada. Obtenha o QR Code.`, "yellow");
    }

    if (status.name) {
      log(`   Nome: ${status.name}`, "cyan");
    }

    if (status.platform) {
      log(`   Plataforma: ${status.platform}`, "cyan");
    }
  } catch (error) {
    log(`   ❌ Erro ao verificar status: ${error.message}`, "red");
    if (error.response) {
      log(`   Detalhes: ${JSON.stringify(error.response.data)}`, "red");
    }
    return;
  }

  // 3. Verificar webhook
  log("\n3️⃣ Verificando webhook...", "blue");
  const webhookUrl = process.env.WEBHOOK_URL || "https://365e92374747.ngrok-free.app/api/webhook/w-api";
  log(`   Webhook configurado: ${webhookUrl}`, "cyan");
  
  // Testar webhook (simulação)
  try {
    const axios = require("axios");
    const testResponse = await axios.post(
      webhookUrl,
      {
        event: "test",
        data: { from: "559199999999", body: "teste" },
      },
      {
        timeout: 5000,
        validateStatus: () => true, // Aceitar qualquer status
      }
    );

    if (testResponse.status === 200 || testResponse.status === 404) {
      log(`   ✅ Webhook acessível (status: ${testResponse.status})`, "green");
    } else {
      log(`   ⚠️  Webhook retornou status: ${testResponse.status}`, "yellow");
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      log(`   ⚠️  Webhook não acessível. Verifique se o ngrok está rodando.`, "yellow");
    } else {
      log(`   ⚠️  Erro ao testar webhook: ${error.message}`, "yellow");
    }
  }

  // 4. Resumo
  log("\n📊 Resumo da Configuração\n", "cyan");
  log("✅ Integração W-API configurada", "green");
  log(`✅ Instance ID: ${instanceId}`, "green");
  log(`✅ Webhook: ${webhookUrl}`, "green");
  
  log("\n💡 Próximos Passos:\n", "yellow");
  log("1. Envie uma mensagem para o número conectado", "cyan");
  log("2. Verifique os logs do backend para processamento", "cyan");
  log("3. A IA Livia deve responder automaticamente", "cyan");
  log("4. Monitore o dashboard para métricas\n", "cyan");

  log("✨ Teste concluído!\n", "green");
}

// Executar teste
testarWApi().catch((error) => {
  log(`\n❌ Erro fatal: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
