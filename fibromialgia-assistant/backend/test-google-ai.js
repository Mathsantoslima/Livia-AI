/**
 * =========================================
 * TESTE DE CONEXÃO COM GOOGLE AI
 * =========================================
 * 
 * Script simples para testar se a chave da API
 * Google AI está configurada corretamente
 */

require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGoogleAI() {
  try {
    console.log("🧪 Testando conexão com Google AI...\n");

    // Verificar se a chave está configurada
    if (!process.env.GOOGLE_AI_API_KEY) {
      console.error("❌ Erro: GOOGLE_AI_API_KEY não configurada!");
      console.log("\n📝 Configure a chave no arquivo .env:");
      console.log("   GOOGLE_AI_API_KEY=sua-chave-aqui");
      console.log("\n📚 Veja COMO_OBTER_CHAVE_GOOGLE_AI.md para instruções");
      process.exit(1);
    }

    console.log("✅ Chave encontrada: " + process.env.GOOGLE_AI_API_KEY.substring(0, 10) + "...");
    console.log("✅ Modelo: " + (process.env.GEMINI_MODEL || "gemini-1.5-pro") + "\n");

    // Testar conexão
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
    });

    console.log("🔄 Enviando requisição de teste...\n");

    const result = await model.generateContent("Olá! Responda apenas: 'Conexão OK'");
    const response = await result.response;
    const text = response.text();

    console.log("✅ Conexão com Google AI funcionando perfeitamente!\n");
    console.log("📥 Resposta do modelo:");
    console.log("   " + text + "\n");
    console.log("🎉 Tudo configurado! Você pode usar a infraestrutura de IA agora.\n");

    return true;
  } catch (error) {
    console.error("\n❌ Erro ao conectar com Google AI:");
    console.error("   " + error.message + "\n");

    if (error.message.includes("API key")) {
      console.log("💡 Possíveis soluções:");
      console.log("   1. Verifique se a chave está correta no arquivo .env");
      console.log("   2. Certifique-se de não ter espaços extras na chave");
      console.log("   3. Verifique se a API está habilitada no Google Cloud Console");
      console.log("   4. Veja COMO_OBTER_CHAVE_GOOGLE_AI.md para mais detalhes\n");
    }

    if (error.message.includes("quota") || error.message.includes("limit")) {
      console.log("💡 Você pode ter atingido o limite da API.");
      console.log("   Verifique seus limites em: https://aistudio.google.com/app/apikey\n");
    }

    process.exit(1);
  }
}

// Executar teste
testGoogleAI();
