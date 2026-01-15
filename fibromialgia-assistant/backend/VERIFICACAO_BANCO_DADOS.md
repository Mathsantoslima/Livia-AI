# Verificação da Estrutura do Banco de Dados - Supabase

## Tabelas Necessárias

O sistema de agentes requer as seguintes tabelas no Supabase:

### 1. **users_livia** (Obrigatória)
**Usada por:** MemoryManager, Tools, AgentBase

**Campos esperados:**
- `id` (UUID ou TEXT) - ID único do usuário
- `phone` (TEXT) - Número de telefone do usuário
- `name` (TEXT, nullable) - Nome do usuário
- `nickname` (TEXT, nullable) - Apelido do usuário
- `preferences` (JSONB, nullable) - Preferências do usuário
- `last_interaction` (TIMESTAMP, nullable) - Última interação
- `ultimo_contato` (TIMESTAMP, nullable) - Último contato (alias)
- `nivel_engajamento` (NUMERIC, nullable) - Nível de engajamento (0-1)
- `primeiro_contato` (TIMESTAMP, nullable) - Primeiro contato
- `status` (TEXT, nullable) - Status do usuário (ex: "active")

**Índices recomendados:**
- Índice único em `id`
- Índice em `phone`

### 2. **conversations_livia** (Obrigatória)
**Usada por:** MemoryManager, Tools, MetricsDashboard

**Campos esperados:**
- `id` (UUID, serial) - ID único da mensagem
- `user_id` (UUID/TEXT) - ID do usuário (foreign key para users_livia)
- `content` (TEXT) - Conteúdo da mensagem
- `message_type` (TEXT) - Tipo: "user" ou "assistant"
- `sent_at` (TIMESTAMP) - Data/hora de envio
- `intent` (TEXT, nullable) - Intenção detectada
- `sentiment` (TEXT, nullable) - Sentimento detectado
- `metadata` (JSONB, nullable) - Metadados adicionais (model, tools_used, etc.)

**Índices recomendados:**
- Índice em `user_id`
- Índice em `sent_at`
- Índice composto em `(user_id, sent_at)`

### 3. **user_patterns** (Recomendada)
**Usada por:** MemoryManager, Tools

**Campos esperados:**
- `id` (UUID, serial) - ID único do padrão
- `user_id` (UUID/TEXT) - ID do usuário (foreign key para users_livia)
- `pattern_type` (TEXT) - Tipo do padrão (ex: "pain_cycle", "sleep_pattern")
- `pattern_description` (TEXT) - Descrição do padrão
- `confidence` (NUMERIC) - Nível de confiança (0-1)
- `is_active` (BOOLEAN) - Se o padrão está ativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Índices recomendados:**
- Índice em `user_id`
- Índice em `is_active`
- Índice composto em `(user_id, is_active)`

### 4. **daily_check_ins** (Opcional - para funcionalidades avançadas)
**Usada por:** Tools (detectarPadroes, gerarResumoDiario)

**Campos esperados:**
- `id` (UUID, serial) - ID único do check-in
- `user_id` (UUID/TEXT) - ID do usuário
- `check_in_date` (DATE) - Data do check-in
- `pain_level` (INTEGER, nullable) - Nível de dor (0-10)
- `sleep_quality` (INTEGER, nullable) - Qualidade do sono
- `mood` (TEXT, nullable) - Humor
- `energy_level` (INTEGER, nullable) - Nível de energia
- `notes` (TEXT, nullable) - Notas adicionais
- `created_at` (TIMESTAMP) - Data de criação

**Índices recomendados:**
- Índice em `user_id`
- Índice em `check_in_date`
- Índice composto em `(user_id, check_in_date)` (único)

### 5. **collective_insights** (Opcional - para aprendizado coletivo)
**Usada por:** MemoryManager, Tools

**Campos esperados:**
- `id` (UUID, serial) - ID único do insight
- `insight_type` (TEXT) - Tipo do insight
- `insight_description` (TEXT) - Descrição do insight
- `evidence_strength` (NUMERIC) - Força da evidência (0-1)
- `recommended_action` (TEXT, nullable) - Ação recomendada
- `action_category` (TEXT, nullable) - Categoria da ação
- `is_active` (BOOLEAN) - Se o insight está ativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Índices recomendados:**
- Índice em `is_active`
- Índice em `evidence_strength`

### 6. **global_patterns** (Opcional - para padrões globais)
**Usada por:** MemoryManager

**Campos esperados:**
- `id` (UUID, serial) - ID único do padrão
- `pattern_type` (TEXT) - Tipo do padrão
- `pattern_description` (TEXT) - Descrição do padrão
- `frequency` (NUMERIC) - Frequência do padrão
- `is_active` (BOOLEAN) - Se o padrão está ativo
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

**Índices recomendados:**
- Índice em `is_active`

### 7. **agent_metrics** (Opcional - para métricas de agentes)
**Usada por:** Dashboard de métricas (já tem migration criada)

**Ver arquivo:** `backend/src/database/migrations/create_agent_metrics.sql`

## Checklist de Verificação

### Tabelas Obrigatórias (sistema não funciona sem elas)
- [ ] `users_livia`
- [ ] `conversations_livia`

### Tabelas Recomendadas (funcionalidades avançadas)
- [ ] `user_patterns`
- [ ] `daily_check_ins`

### Tabelas Opcionais (funcionalidades extras)
- [ ] `collective_insights`
- [ ] `global_patterns`
- [ ] `agent_metrics`

## Como Verificar no Supabase

1. **Acessar o Supabase Dashboard:**
   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto

2. **Verificar Tabelas:**
   - Navegue para "Table Editor" no menu lateral
   - Verifique se as tabelas listadas acima existem

3. **Verificar Estrutura:**
   - Para cada tabela, verifique se os campos esperados existem
   - Verifique tipos de dados (podem variar um pouco)

4. **Verificar Índices:**
   - Navegue para "Database" > "Indexes"
   - Verifique se os índices recomendados existem

## SQL de Verificação Rápida

Execute no SQL Editor do Supabase para verificar tabelas:

```sql
-- Listar todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verificar estrutura de users_livia
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users_livia'
ORDER BY ordinal_position;

-- Verificar estrutura de conversations_livia
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations_livia'
ORDER BY ordinal_position;
```

## Notas Importantes

1. **Campos podem ter nomes diferentes:** O código verifica tanto `last_interaction` quanto `ultimo_contato`, então ambos podem existir ou apenas um.

2. **Tipos de dados:** UUID pode ser TEXT em algumas implementações. O código está preparado para ambos.

3. **Campos nullable:** Muitos campos são nullable, então não é necessário que todos existam para o sistema funcionar.

4. **Criação automática:** O sistema cria usuários automaticamente se não existirem (quando possível).

5. **Tabelas opcionais:** O sistema funciona mesmo sem as tabelas opcionais, mas algumas funcionalidades podem não estar disponíveis.

## Próximos Passos

1. Verificar se `users_livia` e `conversations_livia` existem
2. Se não existirem, criar as tabelas com os campos mínimos
3. Testar o sistema e verificar logs para erros relacionados ao banco
4. Adicionar tabelas opcionais conforme necessário
