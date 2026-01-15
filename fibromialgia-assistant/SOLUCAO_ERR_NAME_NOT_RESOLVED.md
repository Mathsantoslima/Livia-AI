# 🔧 Solução: Erro ERR_NAME_NOT_RESOLVED

## ⚠️ Problema

O frontend está mostrando erros `ERR_NAME_NOT_RESOLVED` ao tentar acessar o Supabase diretamente:
```
dbwrpdxwfqqbsngijrle.supabase.co/rest/v1/conversations_livia
```

## 🔍 Causa

O frontend está tentando acessar o Supabase **diretamente** através do `supabaseService`, mas:

1. **As tabelas ainda não foram criadas** no Supabase (veja `CRIAR_TABELAS_SUPABASE.md`)
2. **O acesso direto ao Supabase pode falhar** se não houver permissões corretas
3. **O ideal é usar o backend** como intermediário (via `apiService`)

## ✅ Soluções

### Solução 1: Criar Tabelas no Supabase (Imediato)

**O erro principal é que as tabelas não existem!**

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em **SQL Editor**

2. **Execute os scripts SQL:**
   - `backend/src/database/migrations/create_users_livia.sql`
   - `backend/src/database/migrations/create_conversations_livia.sql`

**Após criar as tabelas, o erro `ERR_NAME_NOT_RESOLVED` deve desaparecer.**

### Solução 2: Verificar URL do Supabase

**Se o erro persistir**, verifique se o URL do Supabase está correto:

1. **Acesse o Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Selecione seu projeto
   - Vá em **Settings** > **API**

2. **Verifique a URL:**
   - Deve ser algo como: `https://xxxxx.supabase.co`
   - Compare com o `.env` do frontend: `admin-panel/.env`

3. **Atualize o `.env` se necessário:**
   ```bash
   REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon
   ```

4. **Reinicie o frontend:**
   ```bash
   cd admin-panel
   # Pare o servidor (Ctrl+C)
   npm start
   ```

### Solução 3: Usar Backend em Vez de Supabase Direto (Opcional)

**Alternativa:** Modificar o frontend para usar o backend (`apiService`) em vez do Supabase direto (`supabaseService`). Isso requer refatoração do código.

---

## 🧪 Verificação

### 1. Verificar URL do Supabase

```bash
# Testar resolução DNS
nslookup dbwrpdxwfqqbsngijrle.supabase.co

# Ou testar com curl
curl -I https://dbwrpdxwfqqbsngijrle.supabase.co
```

### 2. Verificar Tabelas Existentes

Execute no SQL Editor do Supabase:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users_livia', 'conversations_livia');
```

**Se não retornar nada, as tabelas não existem!**

### 3. Verificar Configuração

```bash
# Verificar .env do frontend
cd admin-panel
cat .env | grep SUPABASE
```

---

## 📋 Checklist de Resolução

- [ ] **Criar tabelas no Supabase** (obrigatório)
  - [ ] `users_livia`
  - [ ] `conversations_livia`
- [ ] **Verificar URL do Supabase** no `.env`
- [ ] **Verificar chave anon** no `.env`
- [ ] **Reiniciar frontend** após mudanças
- [ ] **Testar acesso** ao dashboard

---

## ⚠️ Nota Importante

O erro `ERR_NAME_NOT_RESOLVED` pode indicar:

1. **Tabelas não existem** (mais provável) - Crie as tabelas
2. **URL incorreta** - Verifique no dashboard do Supabase
3. **Problema de DNS** - Temporário, tente novamente mais tarde
4. **Projeto Supabase pausado** - Verifique no dashboard

---

## 🚀 Próximos Passos

1. **Criar tabelas no Supabase** (veja `CRIAR_TABELAS_SUPABASE.md`)
2. **Verificar se o erro desapareceu**
3. **Testar o dashboard novamente**

---

## 📚 Arquivos Relacionados

- `backend/CRIAR_TABELAS_SUPABASE.md` - Guia para criar tabelas
- `admin-panel/src/config/supabaseClient.js` - Configuração do Supabase
- `admin-panel/src/services/supabaseService.js` - Serviço que usa Supabase diretamente
