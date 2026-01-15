const { supabase } = require("../config/supabase");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const logger = require("../utils/logger");

const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

/**
 * Autentica um usuário administrador
 * @param {string} email - Email do administrador
 * @param {string} password - Senha do administrador
 * @returns {Promise<Object>} Token JWT e dados do usuário
 */
async function authenticateAdmin(email, password) {
  try {
    // Buscar administrador
    const { data: admin, error } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (error) throw error;
    if (!admin) throw new Error("Administrador não encontrado");

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) throw new Error("Senha inválida");

    // Gerar token JWT
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Registrar login
    await supabase.from("admin_logs").insert([
      {
        admin_id: admin.id,
        action: "login",
        ip_address: null, // Será preenchido pelo middleware
      },
    ]);

    logger.info(`Administrador ${admin.email} autenticado com sucesso`);

    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  } catch (error) {
    logger.error(`Erro na autenticação do administrador ${email}:`, error);
    throw error;
  }
}

/**
 * Cria um novo usuário administrador
 * @param {Object} adminData - Dados do administrador
 * @returns {Promise<Object>} Dados do administrador criado
 */
async function createAdmin(adminData) {
  try {
    // Verificar se email já existe
    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id")
      .eq("email", adminData.email)
      .single();

    if (existingAdmin) throw new Error("Email já cadastrado");

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

    // Criar administrador
    const { data: admin, error } = await supabase
      .from("admins")
      .insert([
        {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: adminData.role || "admin",
        },
      ])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Administrador ${admin.email} criado com sucesso`);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  } catch (error) {
    logger.error(`Erro ao criar administrador ${adminData.email}:`, error);
    throw error;
  }
}

/**
 * Atualiza dados de um administrador
 * @param {string} adminId - ID do administrador
 * @param {Object} updateData - Dados para atualização
 * @returns {Promise<Object>} Dados do administrador atualizado
 */
async function updateAdmin(adminId, updateData) {
  try {
    // Se houver nova senha, criptografar
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }

    // Atualizar administrador
    const { data: admin, error } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", adminId)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Administrador ${admin.email} atualizado com sucesso`);

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };
  } catch (error) {
    logger.error(`Erro ao atualizar administrador ${adminId}:`, error);
    throw error;
  }
}

/**
 * Remove um administrador
 * @param {string} adminId - ID do administrador
 * @returns {Promise<void>}
 */
async function deleteAdmin(adminId) {
  try {
    const { error } = await supabase.from("admins").delete().eq("id", adminId);

    if (error) throw error;

    logger.info(`Administrador ${adminId} removido com sucesso`);
  } catch (error) {
    logger.error(`Erro ao remover administrador ${adminId}:`, error);
    throw error;
  }
}

/**
 * Lista todos os administradores
 * @returns {Promise<Array>} Lista de administradores
 */
async function listAdmins() {
  try {
    const { data: admins, error } = await supabase
      .from("admins")
      .select("id, name, email, role, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return admins;
  } catch (error) {
    logger.error("Erro ao listar administradores:", error);
    throw error;
  }
}

/**
 * Verifica se um token JWT é válido
 * @param {string} token - Token JWT
 * @returns {Promise<Object>} Dados do token decodificado
 */
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar se administrador ainda existe
    const { data: admin } = await supabase
      .from("admins")
      .select("id")
      .eq("id", decoded.id)
      .single();

    if (!admin) throw new Error("Administrador não encontrado");

    return decoded;
  } catch (error) {
    logger.error("Erro ao verificar token:", error);
    throw error;
  }
}

module.exports = {
  authenticateAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listAdmins,
  verifyToken,
};
