const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");
const logger = require("../utils/logger");

/**
 * Middleware para autenticar token JWT
 */
async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Token de autenticação não fornecido",
      });
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o usuário existe no Supabase
    const { data: user, error } = await supabase
      .from("admins")
      .select("*")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        status: "error",
        message: "Usuário não encontrado ou token inválido",
      });
    }

    // Adicionar usuário ao request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Erro na autenticação:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "error",
        message: "Token expirado",
      });
    }

    return res.status(401).json({
      status: "error",
      message: "Token inválido",
    });
  }
}

/**
 * Middleware para verificar permissões de administrador
 */
function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      status: "error",
      message: "Acesso negado. Permissões de administrador necessárias.",
    });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdmin,
};
