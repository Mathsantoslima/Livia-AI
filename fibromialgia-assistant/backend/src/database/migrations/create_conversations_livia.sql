-- =========================================
-- CRIAÇÃO DA TABELA conversations_livia
-- =========================================
-- Esta tabela armazena todas as mensagens trocadas entre usuários e a Livia

-- Criar extensão UUID se não existir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tabela conversations_livia
CREATE TABLE IF NOT EXISTS conversations_livia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  phone VARCHAR(20) NOT NULL,
  
  content TEXT NOT NULL,
  message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  
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
  
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Índices para performance
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users_livia(id) ON DELETE SET NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_date ON conversations_livia(user_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON conversations_livia(phone);
CREATE INDEX IF NOT EXISTS idx_conversations_sent_at ON conversations_livia(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_message_type ON conversations_livia(message_type);
CREATE INDEX IF NOT EXISTS idx_conversations_sentiment ON conversations_livia(sentiment) WHERE sentiment IS NOT NULL;

-- Comentários para documentação
COMMENT ON TABLE conversations_livia IS 'Armazena todas as mensagens trocadas entre usuários e a assistente Livia';
COMMENT ON COLUMN conversations_livia.user_id IS 'ID do usuário (pode ser NULL se não identificado)';
COMMENT ON COLUMN conversations_livia.phone IS 'Número de telefone do usuário';
COMMENT ON COLUMN conversations_livia.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN conversations_livia.message_type IS 'Tipo: user, assistant ou system';
COMMENT ON COLUMN conversations_livia.sentiment IS 'Sentimento detectado na mensagem';
COMMENT ON COLUMN conversations_livia.metadata IS 'Metadados adicionais (model usado, tools utilizados, etc.)';
