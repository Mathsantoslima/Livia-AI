#!/usr/bin/env node

/**
 * Script para limpar sessão do WhatsApp Baileys
 *
 * Este script remove todos os arquivos de sessão para forçar
 * uma nova autenticação via QR Code.
 *
 * Uso: node limpar-sessao.js
 */

const fs = require("fs");
const path = require("path");

// Cores para saída
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

const SESSION_DIR = path.join(__dirname, "sessions");

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function limparSessao() {
  log("\n🧹 Limpando sessão do WhatsApp Baileys...", BLUE);

  try {
    // Verificar se o diretório existe
    if (!fs.existsSync(SESSION_DIR)) {
      log("✅ Diretório de sessões não existe. Nada a limpar.", GREEN);
      return true;
    }

    // Listar arquivos antes de limpar
    const files = fs.readdirSync(SESSION_DIR);

    if (files.length === 0) {
      log("✅ Diretório de sessões já está vazio.", GREEN);
      return true;
    }

    log(`📁 Encontrados ${files.length} arquivo(s) de sessão:`, YELLOW);
    files.forEach((file) => {
      log(`   - ${file}`, YELLOW);
    });

    // Remover todos os arquivos e subdiretórios
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });

    log("🗑️  Arquivos removidos com sucesso.", GREEN);

    // Recriar diretório vazio
    fs.mkdirSync(SESSION_DIR, { recursive: true });

    log("📁 Diretório de sessões recriado (vazio).", GREEN);

    log("\n✅ Sessão limpa com sucesso!", GREEN);
    log(
      "🔄 Ao reiniciar o servidor, será gerado um novo QR Code para autenticação.\n",
      BLUE
    );

    return true;
  } catch (error) {
    log(`\n❌ Erro ao limpar sessão: ${error.message}`, RED);
    console.error(error);
    return false;
  }
}

// Executar
if (require.main === module) {
  const sucesso = limparSessao();
  process.exit(sucesso ? 0 : 1);
}

module.exports = { limparSessao };
