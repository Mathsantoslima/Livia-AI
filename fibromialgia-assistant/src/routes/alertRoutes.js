const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");

// Listar alertas
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);
    res.status(500).json({ error: "Erro ao buscar alertas" });
  }
});

// Criar alerta
router.post("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .insert([req.body])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Erro ao criar alerta:", error);
    res.status(500).json({ error: "Erro ao criar alerta" });
  }
});

// Atualizar alerta
router.put("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("alerts")
      .update(req.body)
      .eq("id", req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Erro ao atualizar alerta:", error);
    res.status(500).json({ error: "Erro ao atualizar alerta" });
  }
});

// Excluir alerta
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("alerts")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir alerta:", error);
    res.status(500).json({ error: "Erro ao excluir alerta" });
  }
});

module.exports = router;
