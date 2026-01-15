const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");

// Listar relatórios
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar relatórios:", error);
    res.status(500).json({ error: "Erro ao buscar relatórios" });
  }
});

// Criar relatório
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("reports")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro ao criar relatório:", error);
    res.status(500).json({ error: "Erro ao criar relatório" });
  }
});

// Excluir relatório
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir relatório:", error);
    res.status(500).json({ error: "Erro ao excluir relatório" });
  }
});

module.exports = router;
