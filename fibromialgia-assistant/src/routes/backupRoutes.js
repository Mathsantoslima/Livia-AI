const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");
const { createBackup, restoreBackup } = require("../services/backupService");

// Listar backups
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("backups")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro ao listar backups:", error);
    res.status(500).json({ error: "Erro ao listar backups" });
  }
});

// Criar backup
router.post("/", async (req, res) => {
  try {
    const backup = await createBackup();
    res.status(201).json(backup);
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    res.status(500).json({ error: "Erro ao criar backup" });
  }
});

// Restaurar backup
router.post("/:id/restore", async (req, res) => {
  try {
    const { id } = req.params;
    await restoreBackup(id);
    res.status(200).json({ message: "Backup restaurado com sucesso" });
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    res.status(500).json({ error: "Erro ao restaurar backup" });
  }
});

// Excluir backup
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("backups").delete().eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir backup:", error);
    res.status(500).json({ error: "Erro ao excluir backup" });
  }
});

module.exports = router;
