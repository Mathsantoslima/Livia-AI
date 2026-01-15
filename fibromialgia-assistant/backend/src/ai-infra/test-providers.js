/**
 * =========================================
 * TESTE DE PROVIDERS MÚLTIPLOS
 * =========================================
 * 
 * Script para testar todos os providers configurados
 */

require("dotenv").config();
const { ProviderManager } = require("../core/providers");
const logger = require("../utils/logger");

async function testProviders() {
  try {
    console.log("🧪 Testando múltiplos providers de IA...\n");

    // Criar ProviderManager
    const providerManager = new ProviderManager({
      defaultProvider: "gemini",
      fallbackOrder: ["gemini", "chatgpt", "claude"],
      strategy: "fallback",
    });

    console.log("📊 Providers disponíveis:", providerManager.listProviders());
    console.log("\n");

    // Testar cada provider
    console.log("🔍 Testando conexão com cada provider...\n");
    const healthResults = await providerManager.testAllProviders();

    for (const [name, result] of Object.entries(healthResults)) {
      if (result.healthy) {
        console.log(`✅ ${name.toUpperCase()}: Conectado e funcionando`);
      } else {
        console.log(`❌ ${name.toUpperCase()}: ${result.error || "Falhou"}`);
      }
    }

    console.log("\n");

    // Testar geração com fallback
    console.log("🚀 Testando geração de resposta...\n");

    const systemPrompt = "Você é um assistente útil e amigável.";
    const messages = [
      {
        role: "user",
        content: "Responda em uma frase: Qual é a capital do Brasil?",
      },
    ];

    try {
      const response = await providerManager.generate(systemPrompt, messages);

      console.log("✅ Resposta gerada com sucesso!");
      console.log(`📝 Provider usado: ${response.providerUsed.toUpperCase()}`);
      console.log(`🔄 Fallback usado: ${response.fallbackUsed ? "Sim" : "Não"}`);
      console.log(`💬 Resposta: ${response.text}`);
      console.log(`📊 Tokens: ${JSON.stringify(response.usage)}`);

      if (response.fallbackUsed && response.originalProvider) {
        console.log(`⚠️  Provider original falhou: ${response.originalProvider}`);
      }
    } catch (error) {
      console.error("❌ Erro ao gerar resposta:", error.message);
    }

    console.log("\n");

    // Estatísticas
    console.log("📈 Estatísticas dos providers:");
    const stats = providerManager.getStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n✅ Teste concluído!\n");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  }
}

// Executar teste
testProviders();
