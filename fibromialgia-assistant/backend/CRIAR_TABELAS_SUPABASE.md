# 🗄️ Criar Tabelas no Supabase

## ⚠️ Problema Identificado

O erro `Could not find the table 'public.conversations_livia'` indica que as tabelas necessárias não existem no Supabase.

## ✅ Solução: Criar Tabelas

### Opção 1: Via SQL Editor do Supabase (Recomendado)

1. **Acesse o Supabase Dashboard:**

   - Vá para https://supabase.com/dashboard
   - Selecione seu projeto
   - Clique em **SQL Editor** no menu lateral

2. **Execute os scripts SQL:**

   **Primeiro, crie a tabela `users_livia`:**

   ```sql
   -- Copie e cole o conteúdo do arquivo:
   -- backend/src/database/migrations/create_users_livia.sql
   ```

   **Depois, crie a tabela `conversations_livia`:**

   ```sql
   -- Copie e cole o conteúdo do arquivo:
   -- backend/src/database/migrations/create_conversations_livia.sql
   ```

3. **Verifique se as tabelas foram criadas:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('users_livia', 'conversations_livia');
   ```

### Opção 2: Via MCP Supabase (Se disponível)

Se você tiver o MCP Supabase configurado, posso executar as migrations automaticamente.

### Opção 3: Via Script Node.js

Execute o script de inicialização:

```bash
cd /Users/matheuslima/Downloads/fibro.ia
node init-banco-livia.js
```

**Nota:** Este script cria todas as tabelas necessárias, incluindo outras além das obrigatórias.

---

## 📋 Tabelas Obrigatórias

### 1. `users_livia`

- Armazena informações dos usuários
- **Arquivo SQL:** `backend/src/database/migrations/create_users_livia.sql`

### 2. `conversations_livia`

- Armazena todas as mensagens
- **Arquivo SQL:** `backend/src/database/migrations/create_conversations_livia.sql`

---

## ✅ Verificação

Após criar as tabelas, verifique se o erro desapareceu:

1. **Reinicie o backend** (se necessário)
2. **Acesse o dashboard:** http://localhost:3001
3. **Verifique os logs** - não deve mais aparecer o erro `Could not find the table`

---

## 🔍 Verificar Tabelas Existentes

Execute no SQL Editor do Supabase:

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

---

## 📝 Notas

- As tabelas são criadas com `IF NOT EXISTS`, então é seguro executar múltiplas vezes
- Os índices são criados automaticamente para melhor performance
- A foreign key em `conversations_livia.user_id` referencia `users_livia.id`

---

## 🚀 Próximos Passos

Após criar as tabelas:

1. ✅ Backend funcionará sem erros
2. ✅ Dashboard mostrará métricas corretamente
3. ✅ Mensagens serão salvas no banco de dados
4. ✅ Histórico de conversas será mantido
