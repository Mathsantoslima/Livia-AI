/**
 * Script para testar se o webhook está processando mensagens corretamente
 */

require("dotenv").config({ path: "./.env" });
const axios = require("axios");

const WEBHOOK_URL = process.env.WEBHOOK_URL || "http://localhost:3000/api/webhook/w-api";

// Simular payload de mensagem recebida da W-API
const testMessage = {
  event: "webhookReceived",
  instanceId: "VH1570-AP32GM-N91RKI",
  sender: {
    id: "5511999999999",
  },
  text: "Oi, estou testando o sistema",
  msgContent: {
    conversation: "Oi, estou testando o sistema",
  },
  chat: {
    id: "5511999999999@c.us",
  },
  timestamp: Date.now(),
  messageId: `test_${Date.now()}`,
};

async function testarWebhook() {
  console.log("🧪 Testando webhook W-API...\n");

  console.log("📤 Enviando mensagem de teste:");
  console.log(JSON.stringify(testMessage, null, 2));
  console.log("");

  try {
    const response = await axios.post(WEBHOOK_URL, testMessage, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log("✅ Resposta do webhook:");
    console.log(JSON.stringify(response.data, null, 2));
    console.log("\n📊 Status:", response.status);

    if (response.status === 200) {
      console.log("\n✅ Webhook está funcionando!");
    }
  } catch (error) {
    console.error("❌ Erro ao testar webhook:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Erro:", error.message);
    }
  }
}

testarWebhook();
