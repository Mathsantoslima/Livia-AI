const express = require("express");
const router = express.Router();
const { supabase } = require("../config/supabaseClient");

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(401).json({ error: "Credenciais inválidas" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("Erro no logout:", error);
    res.status(500).json({ error: "Erro ao realizar logout" });
  }
});

// Verificar sessão
router.get("/session", async (req, res) => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw error;
    res.json(session);
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    res.status(401).json({ error: "Sessão inválida" });
  }
});

module.exports = router;
