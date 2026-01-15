const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");

// Obter configurações
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    res.status(500).json({ error: "Erro ao buscar configurações" });
  }
});

// Atualizar configurações
router.put("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("settings")
      .upsert([req.body])
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    res.status(500).json({ error: "Erro ao atualizar configurações" });
  }
});

module.exports = router;
