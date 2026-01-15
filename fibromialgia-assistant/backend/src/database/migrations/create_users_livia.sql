-- =========================================
-- CRIAÇÃO DA TABELA users_livia
-- =========================================
-- Esta tabela armazena informações dos usuários

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela users_livia
CREATE TABLE IF NOT EXISTS users_livia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100),
  nickname VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_interaction TIMESTAMP WITH TIME ZONE,
  ultimo_contato TIMESTAMP WITH TIME ZONE,
  primeiro_contato TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'active',
  
  -- Informações de saúde
  age INTEGER,
  gender VARCHAR(20),
  diagnosis_date DATE,
  severity_level VARCHAR(20),
  main_symptoms TEXT[],
  triggers TEXT[],
  medications TEXT[],
  
  -- Preferências
  preferred_contact_time TIME,
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  language VARCHAR(10) DEFAULT 'pt-BR',
  preferences JSONB DEFAULT '{}'::jsonb,
  
  -- Métricas
  total_days_tracked INTEGER DEFAULT 0,
  nivel_engajamento NUMERIC(3,2) DEFAULT 0,
  avg_pain_level DECIMAL(3,2),
  avg_energy_level DECIMAL(3,2),
  avg_mood_level DECIMAL(3,2),
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_livia_phone ON users_livia(phone);
CREATE INDEX IF NOT EXISTS idx_users_livia_status ON users_livia(status);
CREATE INDEX IF NOT EXISTS idx_users_livia_last_interaction ON users_livia(last_interaction DESC);

-- Comentários para documentação
COMMENT ON TABLE users_livia IS 'Armazena informações dos usuários do assistente Livia';
COMMENT ON COLUMN users_livia.phone IS 'Número de telefone único do usuário';
COMMENT ON COLUMN users_livia.preferences IS 'Preferências do usuário em formato JSON';
COMMENT ON COLUMN users_livia.nivel_engajamento IS 'Nível de engajamento do usuário (0-1)';
