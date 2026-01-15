/**
 * Script para inicialização do banco de dados
 * Executa os scripts SQL de criação de tabelas e inserção de dados iniciais
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { config } = require("../src/config");
const logger = require("../src/utils/logger");

// Verificar configurações do Supabase
if (!config.supabase.url || !config.supabase.serviceKey) {
  console.error(
    "Configuração do Supabase incompleta! Verifique as variáveis de ambiente."
  );
  process.exit(1);
}

// Criar cliente do Supabase com a chave de serviço para operações administrativas
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

/**
 * Executa uma consulta SQL através do cliente Supabase
 * @param {string} sql - Consulta SQL a ser executada
 * @returns {Promise<Object>} - Resultado da consulta
 */
async function executeSql(sql) {
  try {
    const { data, error } = await supabaseAdmin.rpc("exec_sql", {
      sql_query: sql,
    });

    if (error) {
      throw error;
    }

    return { data };
  } catch (error) {
    logger.error("Erro ao executar SQL:", error);
    throw error;
  }
}

/**
 * Lê e executa um arquivo SQL
 * @param {string} filePath - Caminho do arquivo SQL
 * @returns {Promise<void>}
 */
async function executeSqlFile(filePath) {
  try {
    console.log(`Executando arquivo SQL: ${filePath}`);
    const sql = fs.readFileSync(filePath, "utf8");

    // Dividir o arquivo em comandos separados por ponto e vírgula
    const commands = sql
      .split(";")
      .map((command) => command.trim())
      .filter((command) => command.length > 0);

    // Executar cada comando separadamente
    for (const command of commands) {
      await executeSql(command);
      // Pequeno intervalo para evitar sobrecarga
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`Arquivo SQL executado com sucesso: ${filePath}`);
  } catch (error) {
    console.error(`Erro ao executar arquivo SQL ${filePath}:`, error);
    throw error;
  }
}

/**
 * Inicializa o banco de dados
 */
async function initializeDatabase() {
  try {
    console.log("Iniciando inicialização do banco de dados...");

    // Verificar extensão uuid-ossp (necessária para uuid_generate_v4())
    await executeSql('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log("Extensão uuid-ossp verificada.");

    // Executar script de criação de tabelas
    const createTablesPath = path.join(__dirname, "create_tables.sql");
    await executeSqlFile(createTablesPath);

    // Executar script de inserção de dados iniciais
    const insertDataPath = path.join(__dirname, "insert_seed_data.sql");
    await executeSqlFile(insertDataPath);

    console.log("Inicialização do banco de dados concluída com sucesso!");
  } catch (error) {
    console.error("Erro ao inicializar banco de dados:", error);
    process.exit(1);
  }
}

// Executar inicialização
initializeDatabase()
  .then(() => {
    console.log("Script finalizado com sucesso.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
