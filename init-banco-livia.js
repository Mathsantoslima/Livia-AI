// =========================================
// INICIALIZAÇÃO DO BANCO DE DADOS LIVIA
// Criar tabelas no Supabase
// =========================================

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");

// Configuração Supabase
const supabaseUrl = "https://dbwrpdxwfqqbsngijrle.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRid3JwZHh3ZnFxYnNuZ2lqcmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1MTg5MTcsImV4cCI6MjA2MzA5NDkxN30.iPs3VdIUWRPm78KC6hGlISO96EjXNG8Yz4UCsDCZK2M";
const supabase = createClient(supabaseUrl, supabaseKey);

async function executarSQL(sql, descricao) {
  try {
    console.log(`🔄 ${descricao}...`);

    const { data, error } = await supabase.rpc("exec_sql", {
      query: sql,
    });

    if (error) {
      console.error(`❌ Erro: ${descricao}`, error);
      return false;
    }

    console.log(`✅ ${descricao} - OK`);
    return true;
  } catch (error) {
    console.error(`❌ Erro: ${descricao}`, error.message);
    return false;
  }
}

async function inicializarBancoDados() {
  console.log(`
🌷 INICIALIZANDO BANCO DE DADOS LIVIA
====================================

Criando estrutura completa para assistente de fibromialgia...
`);

  // 1. Criar tabela de usuários
  const sqlUsuarios = `
    CREATE TABLE IF NOT EXISTS users_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(100),
      nickname VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_interaction TIMESTAMP WITH TIME ZONE,
      status VARCHAR(20) DEFAULT 'active',
      
      age INTEGER,
      gender VARCHAR(20),
      diagnosis_date DATE,
      severity_level VARCHAR(20),
      main_symptoms TEXT[],
      triggers TEXT[],
      medications TEXT[],
      
      preferred_contact_time TIME,
      timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
      language VARCHAR(10) DEFAULT 'pt-BR',
      
      total_days_tracked INTEGER DEFAULT 0,
      avg_pain_level DECIMAL(3,2),
      avg_energy_level DECIMAL(3,2),
      avg_mood_level DECIMAL(3,2),
      
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlUsuarios, "Criando tabela users_livia");

  // 2. Criar tabela de conversas
  const sqlConversas = `
    CREATE TABLE IF NOT EXISTS conversations_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      phone VARCHAR(20) NOT NULL,
      
      content TEXT NOT NULL,
      message_type VARCHAR(20) NOT NULL,
      
      media_type VARCHAR(20) DEFAULT 'text',
      media_url TEXT,
      media_transcription TEXT,
      
      sentiment VARCHAR(20),
      emotion VARCHAR(50),
      pain_level INTEGER,
      energy_level INTEGER,
      mood_level INTEGER,
      
      intent VARCHAR(50),
      topics TEXT[],
      symptoms_mentioned TEXT[],
      
      conversation_stage VARCHAR(50),
      is_daily_report BOOLEAN DEFAULT FALSE,
      
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      processed_at TIMESTAMP WITH TIME ZONE,
      ai_model VARCHAR(50),
      processing_time INTEGER,
      
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlConversas, "Criando tabela conversations_livia");

  // 3. Criar tabela de relatórios diários
  const sqlRelatorios = `
    CREATE TABLE IF NOT EXISTS daily_reports_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      report_date DATE NOT NULL,
      
      pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
      energy_level INTEGER CHECK (energy_level >= 0 AND energy_level <= 10),
      mood_level INTEGER CHECK (mood_level >= 0 AND mood_level <= 10),
      sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 10),
      
      symptoms_today TEXT[],
      symptom_intensity JSONB,
      pain_locations TEXT[],
      
      activities_done TEXT[],
      exercise_done BOOLEAN DEFAULT FALSE,
      exercise_type VARCHAR(100),
      exercise_duration INTEGER,
      
      sleep_hours DECIMAL(3,1),
      sleep_start_time TIME,
      sleep_end_time TIME,
      meals_quality VARCHAR(20),
      water_intake INTEGER,
      
      weather_impact BOOLEAN,
      stress_level INTEGER CHECK (stress_level >= 0 AND stress_level <= 10),
      stress_triggers TEXT[],
      
      medications_taken TEXT[],
      treatments_done TEXT[],
      
      notes TEXT,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      completed_at TIMESTAMP WITH TIME ZONE,
      source VARCHAR(20) DEFAULT 'conversation',
      
      UNIQUE(user_id, report_date)
    );
  `;

  await executarSQL(sqlRelatorios, "Criando tabela daily_reports_livia");

  // 4. Criar tabela de sugestões
  const sqlSugestoes = `
    CREATE TABLE IF NOT EXISTS suggestions_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      
      suggestion_type VARCHAR(50) NOT NULL,
      category VARCHAR(50),
      
      title VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      instructions TEXT,
      
      based_on_symptoms TEXT[],
      based_on_patterns JSONB,
      difficulty_level VARCHAR(20),
      estimated_time INTEGER,
      
      suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      tried_at TIMESTAMP WITH TIME ZONE,
      effectiveness_rating INTEGER CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 10),
      user_feedback TEXT,
      
      status VARCHAR(20) DEFAULT 'pending',
      
      ai_confidence DECIMAL(3,2),
      source VARCHAR(50),
      evidence_links TEXT[],
      
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlSugestoes, "Criando tabela suggestions_livia");

  // 5. Criar tabela de padrões
  const sqlPadroes = `
    CREATE TABLE IF NOT EXISTS patterns_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      pattern_type VARCHAR(50) NOT NULL,
      pattern_name VARCHAR(200) NOT NULL,
      
      description TEXT NOT NULL,
      conditions JSONB NOT NULL,
      outcomes JSONB NOT NULL,
      
      frequency_observed INTEGER DEFAULT 1,
      confidence_score DECIMAL(3,2),
      sample_size INTEGER,
      
      applicable_symptoms TEXT[],
      applicable_profiles JSONB,
      
      evidence_level VARCHAR(20),
      evidence_sources TEXT[],
      
      discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      last_validated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_by VARCHAR(50) DEFAULT 'collective_learning',
      
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlPadroes, "Criando tabela patterns_livia");

  // 6. Criar tabela de lembretes
  const sqlLembretes = `
    CREATE TABLE IF NOT EXISTS reminders_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      
      reminder_type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      
      scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
      repeat_pattern VARCHAR(50),
      repeat_config JSONB,
      
      status VARCHAR(20) DEFAULT 'pending',
      sent_at TIMESTAMP WITH TIME ZONE,
      acknowledged_at TIMESTAMP WITH TIME ZONE,
      
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlLembretes, "Criando tabela reminders_livia");

  // 7. Criar tabela de insights
  const sqlInsights = `
    CREATE TABLE IF NOT EXISTS insights_livia (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      
      insight_type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      
      data_period_start DATE,
      data_period_end DATE,
      supporting_data JSONB,
      
      chart_type VARCHAR(50),
      chart_data JSONB,
      
      generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      viewed_at TIMESTAMP WITH TIME ZONE,
      user_reaction VARCHAR(20),
      
      metadata JSONB DEFAULT '{}'::jsonb
    );
  `;

  await executarSQL(sqlInsights, "Criando tabela insights_livia");

  // 8. Criar índices importantes
  const sqlIndices = `
    CREATE INDEX IF NOT EXISTS idx_users_livia_phone ON users_livia(phone);
    CREATE INDEX IF NOT EXISTS idx_conversations_user_date ON conversations_livia(user_id, sent_at DESC);
    CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations_livia(phone);
    CREATE INDEX IF NOT EXISTS idx_daily_reports_user_date ON daily_reports_livia(user_id, report_date DESC);
    CREATE INDEX IF NOT EXISTS idx_suggestions_user_status ON suggestions_livia(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_reminders_scheduled ON reminders_livia(scheduled_for, status);
  `;

  await executarSQL(sqlIndices, "Criando índices de performance");

  console.log(`
✅ BANCO DE DADOS LIVIA INICIALIZADO COM SUCESSO!
===============================================

🌷 Tabelas criadas:
✅ users_livia - Perfis dos usuários
✅ conversations_livia - Histórico de conversas
✅ daily_reports_livia - Relatórios diários
✅ suggestions_livia - Sugestões personalizadas
✅ patterns_livia - Padrões detectados
✅ reminders_livia - Lembretes e agendamentos
✅ insights_livia - Insights e relatórios

🔧 Índices criados para performance otimizada

🚀 Pronto para uso com a Assistente Livia!
  `);
}

// Executar inicialização
if (require.main === module) {
  inicializarBancoDados().catch((error) => {
    console.error("❌ Erro na inicialização:", error);
    process.exit(1);
  });
}

module.exports = { inicializarBancoDados };
