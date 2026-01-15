/**
 * Script para criar um usuário administrador
 * 
 * Uso: node create-admin.js
 */

require("dotenv").config();
const { supabase } = require("./src/config/supabase");
const bcrypt = require("bcrypt");
const logger = require("./src/utils/logger");

const SALT_ROUNDS = 10;

async function createAdmin() {
  try {
    const email = "admin@fibroia.com";
    const password = "123456";
    const name = "Administrador";
    const role = "admin";

    console.log(`\n🔐 Criando usuário administrador...\n`);
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Nome: ${name}`);
    console.log(`🔑 Role: ${role}\n`);

    // Verificar se o admin já existe
    const { data: existingAdmin, error: checkError } = await supabase
      .from("admins")
      .select("id, email, name")
      .eq("email", email)
      .single();

    if (existingAdmin) {
      console.log(`⚠️  Administrador já existe!`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}\n`);
      
      console.log(`❓ Deseja atualizar a senha? (isso requer acesso direto ao Supabase)\n`);
      process.exit(0);
    }

    // Criptografar senha
    console.log(`🔒 Criptografando senha...`);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Criar administrador
    console.log(`💾 Salvando no banco de dados...`);
    const { data: admin, error } = await supabase
      .from("admins")
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role,
        },
      ])
      .select("id, email, name, role, created_at")
      .single();

    if (error) {
      console.error(`\n❌ Erro ao criar administrador:`, error);
      
      if (error.code === "PGRST116") {
        console.error(`\n💡 A tabela 'admins' pode não existir.`);
        console.error(`   Verifique se a tabela foi criada no Supabase.\n`);
      }
      
      throw error;
    }

    console.log(`\n✅ Administrador criado com sucesso!\n`);
    console.log(`📋 Detalhes:`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Nome: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Criado em: ${admin.created_at}\n`);
    console.log(`🚀 Você pode fazer login no admin panel com:`);
    console.log(`   Email: ${email}`);
    console.log(`   Senha: ${password}\n`);

    process.exit(0);
  } catch (error) {
    logger.error("Erro ao criar administrador:", error);
    console.error(`\n❌ Erro: ${error.message}\n`);
    process.exit(1);
  }
}

// Executar
createAdmin();
