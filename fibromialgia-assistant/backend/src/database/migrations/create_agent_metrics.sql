-- =========================================
-- CREATE AGENT METRICS TABLE
-- =========================================
-- 
-- Tabela para persistir métricas de agentes/providers
-- Permite rastreamento histórico de uso, custos e performance
--

-- Criar tabela para métricas de agentes
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  request_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  total_latency_ms BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10, 6) DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  period_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider, period_date)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_metrics_provider ON agent_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_period ON agent_metrics(period_date);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_provider_period ON agent_metrics(provider, period_date);

-- Função para atualizar métricas (upsert)
CREATE OR REPLACE FUNCTION update_agent_metrics(
  p_provider VARCHAR,
  p_success BOOLEAN,
  p_latency_ms INTEGER,
  p_cost DECIMAL,
  p_tokens INTEGER,
  p_period_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO agent_metrics (
    provider,
    request_count,
    success_count,
    error_count,
    total_latency_ms,
    total_cost_usd,
    total_tokens,
    period_date
  )
  VALUES (
    p_provider,
    1,
    CASE WHEN p_success THEN 1 ELSE 0 END,
    CASE WHEN p_success THEN 0 ELSE 1 END,
    p_latency_ms,
    p_cost,
    p_tokens,
    p_period_date
  )
  ON CONFLICT (provider, period_date)
  DO UPDATE SET
    request_count = agent_metrics.request_count + 1,
    success_count = agent_metrics.success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    error_count = agent_metrics.error_count + CASE WHEN p_success THEN 0 ELSE 1 END,
    total_latency_ms = agent_metrics.total_latency_ms + p_latency_ms,
    total_cost_usd = agent_metrics.total_cost_usd + p_cost,
    total_tokens = agent_metrics.total_tokens + p_tokens,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE agent_metrics IS 'Métricas agregadas de agentes/providers por dia';
COMMENT ON COLUMN agent_metrics.provider IS 'Nome do provider (gemini, chatgpt, claude)';
COMMENT ON COLUMN agent_metrics.period_date IS 'Data do período (formato DATE)';
COMMENT ON COLUMN agent_metrics.total_cost_usd IS 'Custo total em dólares (USD)';
COMMENT ON COLUMN agent_metrics.total_tokens IS 'Total de tokens usados (input + output)';
