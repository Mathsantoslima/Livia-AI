-- =========================================
-- ADICIONAR CAMPOS DE ROTINA E PERFIL COMPORTAMENTAL
-- =========================================
-- Esta migration adiciona campos para armazenar rotina, perfil comportamental,
-- hábitos e estratégias do usuário

-- Adicionar campos de rotina diária
ALTER TABLE users_livia
ADD COLUMN IF NOT EXISTS daily_routine JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS behavioral_profile JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS habits JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS recurring_symptoms JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS perceived_triggers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strategies_that_worked JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS strategies_that_failed JSONB DEFAULT '[]'::jsonb;

-- Comentários para documentação
COMMENT ON COLUMN users_livia.daily_routine IS 'Rotina diária do usuário: horários de sono, trabalho, atividades físicas, etc.';
COMMENT ON COLUMN users_livia.behavioral_profile IS 'Perfil comportamental: padrões de resposta, preferências de comunicação, etc.';
COMMENT ON COLUMN users_livia.habits IS 'Hábitos: sono, trabalho, esforço físico, esforço mental';
COMMENT ON COLUMN users_livia.recurring_symptoms IS 'Sintomas recorrentes identificados';
COMMENT ON COLUMN users_livia.perceived_triggers IS 'Gatilhos percebidos pelo usuário';
COMMENT ON COLUMN users_livia.strategies_that_worked IS 'Estratégias que funcionaram para o usuário';
COMMENT ON COLUMN users_livia.strategies_that_failed IS 'Estratégias que não funcionaram para o usuário';

-- Estrutura esperada dos campos JSONB:
-- daily_routine: {
--   sleep: { bedtime: "22:00", wakeTime: "07:00", quality: "good|medium|poor" },
--   work: { startTime: "09:00", endTime: "18:00", type: "remote|office|hybrid", intensity: "low|medium|high" },
--   physicalActivity: { type: "walking|gym|yoga|none", duration: 30, frequency: "daily|weekly" },
--   meals: { breakfast: "08:00", lunch: "13:00", dinner: "19:00" }
-- }
--
-- behavioral_profile: {
--   communicationStyle: "direct|detailed|brief",
--   responsePattern: "immediate|delayed|scheduled",
--   emotionalTendency: "optimistic|realistic|pessimistic",
--   copingMechanisms: ["exercise", "meditation", "rest"]
-- }
--
-- habits: {
--   sleep: { averageHours: 7, quality: "good|medium|poor", consistency: "high|medium|low" },
--   work: { hoursPerDay: 8, stressLevel: "low|medium|high", breaks: true },
--   physicalEffort: { level: "low|medium|high", frequency: "daily|weekly|rarely" },
--   mentalEffort: { level: "low|medium|high", concentration: "high|medium|low" }
-- }
