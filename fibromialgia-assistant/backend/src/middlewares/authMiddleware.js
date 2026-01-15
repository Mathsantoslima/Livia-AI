const authService = require("../services/authService");
const logger = require("../utils/logger");

/**
 * Middleware para verificar autenticação
 * @param {Object} req - Objeto da requisição
 * @param {Object} res - Objeto da resposta
 * @param {Function} next - Função para continuar o fluxo
 */
async function requireAuth(req, res, next) {
  try {
    // Obter token do header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    // Verificar formato do token
    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Token mal formatado" });
    }

    const [scheme, token] = parts;
    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: "Token mal formatado" });
    }

    // Verificar token
    const decoded = await authService.verifyToken(token);

    // Adicionar dados do usuário à requisição
    req.user = decoded;

    next();
  } catch (error) {
    logger.error("Erro na autenticação:", error);
    return res.status(401).json({ error: "Token inválido" });
  }
}

/**
 * Middleware para verificar permissões de administrador
 * @param {Object} req - Objeto da requisição
 * @param {Object} res - Objeto da resposta
 * @param {Function} next - Função para continuar o fluxo
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

/**
 * Middleware para verificar permissões de superadmin
 * @param {Object} req - Objeto da requisição
 * @param {Object} res - Objeto da resposta
 * @param {Function} next - Função para continuar o fluxo
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || req.user.role !== "superadmin") {
    return res.status(403).json({ error: "Acesso negado" });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
};
