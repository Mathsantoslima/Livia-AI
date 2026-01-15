const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");
const fs = require("fs").promises;
const path = require("path");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

/**
 * Cria um backup do banco de dados
 * @returns {Promise<Object>} Informações do backup
 */
async function createDatabaseBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "../../backups");
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

    // Criar diretório de backup se não existir
    await fs.mkdir(backupDir, { recursive: true });

    // Obter variáveis de ambiente do banco de dados
    const {
      POSTGRES_HOST,
      POSTGRES_PORT,
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
    } = process.env;

    // Comando para criar backup
    const command = `PGPASSWORD=${POSTGRES_PASSWORD} pg_dump -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -F c -f ${backupFile}`;

    // Executar backup
    await execPromise(command);

    // Fazer upload do backup para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("backups")
      .upload(
        `database/${path.basename(backupFile)}`,
        await fs.readFile(backupFile)
      );

    if (uploadError) throw uploadError;

    // Registrar backup no banco de dados
    const { data: backupData, error: dbError } = await supabase
      .from("backups")
      .insert([
        {
          type: "database",
          file_name: path.basename(backupFile),
          file_path: uploadData.path,
          file_size: (await fs.stat(backupFile)).size,
          status: "completed",
          metadata: {
            database: POSTGRES_DB,
            host: POSTGRES_HOST,
            port: POSTGRES_PORT,
          },
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // Remover arquivo local
    await fs.unlink(backupFile);

    logger.info("Backup do banco de dados criado:", { id: backupData.id });
    return backupData;
  } catch (error) {
    logger.error("Erro ao criar backup do banco de dados:", error);
    throw error;
  }
}

/**
 * Cria um backup dos arquivos do sistema
 * @returns {Promise<Object>} Informações do backup
 */
async function createFilesBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "../../backups");
    const backupFile = path.join(backupDir, `files-${timestamp}.tar.gz`);

    // Criar diretório de backup se não existir
    await fs.mkdir(backupDir, { recursive: true });

    // Diretórios a serem incluídos no backup
    const dirsToBackup = ["src", "config", "uploads", "logs"];

    // Comando para criar backup
    const command = `tar -czf ${backupFile} ${dirsToBackup.join(" ")}`;

    // Executar backup
    await execPromise(command);

    // Fazer upload do backup para o Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("backups")
      .upload(
        `files/${path.basename(backupFile)}`,
        await fs.readFile(backupFile)
      );

    if (uploadError) throw uploadError;

    // Registrar backup no banco de dados
    const { data: backupData, error: dbError } = await supabase
      .from("backups")
      .insert([
        {
          type: "files",
          file_name: path.basename(backupFile),
          file_path: uploadData.path,
          file_size: (await fs.stat(backupFile)).size,
          status: "completed",
          metadata: {
            directories: dirsToBackup,
          },
        },
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    // Remover arquivo local
    await fs.unlink(backupFile);

    logger.info("Backup dos arquivos criado:", { id: backupData.id });
    return backupData;
  } catch (error) {
    logger.error("Erro ao criar backup dos arquivos:", error);
    throw error;
  }
}

/**
 * Lista backups
 * @param {Object} filters - Filtros para a busca
 * @returns {Promise<Array>} Lista de backups
 */
async function listBackups(filters = {}) {
  try {
    let query = supabase.from("backups").select("*");

    // Aplicar filtros
    if (filters.type) {
      query = query.eq("type", filters.type);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.start_date) {
      query = query.gte("created_at", filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte("created_at", filters.end_date);
    }

    // Ordenação
    query = query.order("created_at", { ascending: false });

    // Paginação
    if (filters.page && filters.limit) {
      const start = (filters.page - 1) * filters.limit;
      query = query.range(start, start + filters.limit - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Erro ao listar backups:", error);
    throw error;
  }
}

/**
 * Obtém detalhes de um backup
 * @param {string} backupId - ID do backup
 * @returns {Promise<Object>} Detalhes do backup
 */
async function getBackupDetails(backupId) {
  try {
    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    logger.error("Erro ao obter detalhes do backup:", error);
    throw error;
  }
}

/**
 * Remove um backup
 * @param {string} backupId - ID do backup
 * @returns {Promise<void>}
 */
async function removeBackup(backupId) {
  try {
    // Obter detalhes do backup
    const backup = await getBackupDetails(backupId);

    // Remover arquivo do storage
    const { error: storageError } = await supabase.storage
      .from("backups")
      .remove([backup.file_path]);

    if (storageError) throw storageError;

    // Remover registro do banco de dados
    const { error: dbError } = await supabase
      .from("backups")
      .delete()
      .eq("id", backupId);

    if (dbError) throw dbError;

    logger.info("Backup removido:", { id: backupId });
  } catch (error) {
    logger.error("Erro ao remover backup:", error);
    throw error;
  }
}

/**
 * Restaura um backup do banco de dados
 * @param {string} backupId - ID do backup
 * @returns {Promise<void>}
 */
async function restoreDatabaseBackup(backupId) {
  try {
    // Obter detalhes do backup
    const backup = await getBackupDetails(backupId);

    if (backup.type !== "database") {
      throw new Error("Backup inválido para restauração do banco de dados");
    }

    // Download do arquivo de backup
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("backups")
      .download(backup.file_path);

    if (downloadError) throw downloadError;

    const backupDir = path.join(__dirname, "../../backups");
    const backupFile = path.join(backupDir, backup.file_name);

    // Criar diretório de backup se não existir
    await fs.mkdir(backupDir, { recursive: true });

    // Salvar arquivo localmente
    await fs.writeFile(backupFile, await fileData.arrayBuffer());

    // Obter variáveis de ambiente do banco de dados
    const {
      POSTGRES_HOST,
      POSTGRES_PORT,
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
    } = process.env;

    // Comando para restaurar backup
    const command = `PGPASSWORD=${POSTGRES_PASSWORD} pg_restore -h ${POSTGRES_HOST} -p ${POSTGRES_PORT} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c ${backupFile}`;

    // Executar restauração
    await execPromise(command);

    // Remover arquivo local
    await fs.unlink(backupFile);

    logger.info("Backup do banco de dados restaurado:", { id: backupId });
  } catch (error) {
    logger.error("Erro ao restaurar backup do banco de dados:", error);
    throw error;
  }
}

/**
 * Restaura um backup dos arquivos
 * @param {string} backupId - ID do backup
 * @returns {Promise<void>}
 */
async function restoreFilesBackup(backupId) {
  try {
    // Obter detalhes do backup
    const backup = await getBackupDetails(backupId);

    if (backup.type !== "files") {
      throw new Error("Backup inválido para restauração dos arquivos");
    }

    // Download do arquivo de backup
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("backups")
      .download(backup.file_path);

    if (downloadError) throw downloadError;

    const backupDir = path.join(__dirname, "../../backups");
    const backupFile = path.join(backupDir, backup.file_name);

    // Criar diretório de backup se não existir
    await fs.mkdir(backupDir, { recursive: true });

    // Salvar arquivo localmente
    await fs.writeFile(backupFile, await fileData.arrayBuffer());

    // Comando para restaurar backup
    const command = `tar -xzf ${backupFile}`;

    // Executar restauração
    await execPromise(command);

    // Remover arquivo local
    await fs.unlink(backupFile);

    logger.info("Backup dos arquivos restaurado:", { id: backupId });
  } catch (error) {
    logger.error("Erro ao restaurar backup dos arquivos:", error);
    throw error;
  }
}

module.exports = {
  createDatabaseBackup,
  createFilesBackup,
  listBackups,
  getBackupDetails,
  removeBackup,
  restoreDatabaseBackup,
  restoreFilesBackup,
};
