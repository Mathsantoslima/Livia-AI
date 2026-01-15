const { supabase } = require("../config/supabaseClient");
const fs = require("fs").promises;
const path = require("path");

// Diretório para armazenar os backups
const BACKUP_DIR = path.join(__dirname, "../../backups");

// Garantir que o diretório de backups existe
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// Criar backup
async function createBackup() {
  try {
    await ensureBackupDir();

    // Obter dados das tabelas
    const [users, alerts, reports, settings] = await Promise.all([
      supabase.from("users").select("*"),
      supabase.from("alerts").select("*"),
      supabase.from("reports").select("*"),
      supabase.from("settings").select("*"),
    ]);

    // Criar objeto de backup
    const backup = {
      timestamp: new Date().toISOString(),
      data: {
        users: users.data,
        alerts: alerts.data,
        reports: reports.data,
        settings: settings.data,
      },
    };

    // Salvar backup no arquivo
    const filename = `backup_${Date.now()}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(backup, null, 2));

    // Salvar registro do backup no banco
    const { data, error } = await supabase
      .from("backups")
      .insert([
        {
          filename,
          created_at: new Date().toISOString(),
          size: (await fs.stat(filepath)).size,
        },
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    throw error;
  }
}

// Restaurar backup
async function restoreBackup(backupId) {
  try {
    // Obter informações do backup
    const { data: backup, error } = await supabase
      .from("backups")
      .select("*")
      .eq("id", backupId)
      .single();

    if (error) throw error;

    // Ler arquivo de backup
    const filepath = path.join(BACKUP_DIR, backup.filename);
    const backupData = JSON.parse(await fs.readFile(filepath, "utf8"));

    // Restaurar dados
    const { users, alerts, reports, settings } = backupData.data;

    // Limpar tabelas existentes
    await Promise.all([
      supabase.from("users").delete().neq("id", 0),
      supabase.from("alerts").delete().neq("id", 0),
      supabase.from("reports").delete().neq("id", 0),
      supabase.from("settings").delete().neq("id", 0),
    ]);

    // Inserir dados do backup
    await Promise.all([
      supabase.from("users").insert(users),
      supabase.from("alerts").insert(alerts),
      supabase.from("reports").insert(reports),
      supabase.from("settings").insert(settings),
    ]);

    return true;
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    throw error;
  }
}

module.exports = {
  createBackup,
  restoreBackup,
};
