#!/usr/bin/env node

/**
 * Script para atualizar/substituir configurações do Supabase
 *
 * Uso:
 *   node atualizar-supabase.js
 *
 * Ou passe as credenciais como variáveis de ambiente:
 *   SUPABASE_URL_NEW=... SUPABASE_KEY_NEW=... node atualizar-supabase.js
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Cores para output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function atualizarEnvFile(envPath, updates) {
  try {
    let content = "";

    // Ler arquivo existente se existir
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf8");
    }

    // Atualizar ou adicionar variáveis
    updates.forEach(({ key, value }) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      const newLine = `${key}=${value}`;

      if (regex.test(content)) {
        // Substituir linha existente
        content = content.replace(regex, newLine);
      } else {
        // Adicionar nova linha
        if (content && !content.endsWith("\n")) {
          content += "\n";
        }
        content += `${newLine}\n`;
      }
    });

    // Escrever arquivo
    fs.writeFileSync(envPath, content, "utf8");
    return true;
  } catch (error) {
    log(`Erro ao atualizar ${envPath}: ${error.message}`, "red");
    return false;
  }
}

async function main() {
  log("\n🔧 Atualizar Configurações do Supabase", "blue");
  log("=====================================\n", "blue");

  // Obter novas credenciais
  let supabaseUrl = process.env.SUPABASE_URL_NEW;
  let supabaseKey = process.env.SUPABASE_KEY_NEW;
  let supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY_NEW;

  if (!supabaseUrl) {
    supabaseUrl = await question(
      "🔗 SUPABASE_URL (https://xxxxx.supabase.co): "
    );
  }

  if (!supabaseKey) {
    supabaseKey = await question("🔑 SUPABASE_KEY (anon key): ");
  }

  supabaseServiceKey =
    supabaseServiceKey ||
    (await question(
      "🔐 SUPABASE_SERVICE_KEY (opcional, pressione Enter para pular): "
    ));

  // Validar
  if (!supabaseUrl || !supabaseKey) {
    log("\n❌ SUPABASE_URL e SUPABASE_KEY são obrigatórios!", "red");
    rl.close();
    process.exit(1);
  }

  // Confirmar
  log("\n📋 Configurações a atualizar:", "yellow");
  log(`   SUPABASE_URL: ${supabaseUrl}`, "yellow");
  log(`   SUPABASE_KEY: ${supabaseKey.substring(0, 20)}...`, "yellow");
  if (supabaseServiceKey) {
    log(
      `   SUPABASE_SERVICE_KEY: ${supabaseServiceKey.substring(0, 20)}...`,
      "yellow"
    );
  }

  const confirm = await question("\n❓ Confirmar atualização? (s/n): ");
  if (confirm.toLowerCase() !== "s" && confirm.toLowerCase() !== "sim") {
    log("\n❌ Operação cancelada.", "yellow");
    rl.close();
    process.exit(0);
  }

  // Preparar atualizações
  const updates = [
    { key: "SUPABASE_URL", value: supabaseUrl },
    { key: "SUPABASE_KEY", value: supabaseKey },
  ];

  if (supabaseServiceKey) {
    updates.push({ key: "SUPABASE_SERVICE_KEY", value: supabaseServiceKey });
  }

  // Atualizar arquivos .env
  const baseDir = path.join(__dirname);
  const backendEnv = path.join(baseDir, ".env");
  const adminPanelEnv = path.join(baseDir, "../admin-panel/.env");

  log("\n📝 Atualizando arquivos...", "blue");

  // Backend
  if (fs.existsSync(backendEnv)) {
    log(`   ✅ Atualizando ${backendEnv}`, "green");
    atualizarEnvFile(backendEnv, updates);
  } else {
    log(`   ⚠️  ${backendEnv} não encontrado`, "yellow");
  }

  // Admin Panel (usar variáveis REACT_APP_)
  if (fs.existsSync(adminPanelEnv)) {
    log(`   ✅ Atualizando ${adminPanelEnv}`, "green");
    const adminUpdates = [
      { key: "REACT_APP_SUPABASE_URL", value: supabaseUrl },
      { key: "REACT_APP_SUPABASE_ANON_KEY", value: supabaseKey },
    ];
    atualizarEnvFile(adminPanelEnv, adminUpdates);
  } else {
    log(`   ⚠️  ${adminPanelEnv} não encontrado (opcional)`, "yellow");
  }

  log("\n✅ Configurações atualizadas com sucesso!", "green");
  log("\n📌 Próximos passos:", "blue");
  log("   1. Reinicie o servidor backend", "yellow");
  log("   2. Reinicie o admin panel (se estiver rodando)", "yellow");
  log("   3. Verifique os logs para confirmar a conexão", "yellow");
  log(
    "   4. Certifique-se de que o novo Supabase tem as tabelas necessárias",
    "yellow"
  );
  log(
    "\n   📄 Verifique o documento VERIFICACAO_BANCO_DADOS.md para a estrutura necessária\n",
    "blue"
  );

  rl.close();
}

// Executar
main().catch((error) => {
  log(`\n❌ Erro: ${error.message}`, "red");
  rl.close();
  process.exit(1);
});
