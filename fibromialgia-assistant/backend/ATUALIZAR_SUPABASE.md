# Atualizar Configurações do Supabase

## Como Substituir/Atualizar as Credenciais do Supabase

### Método Rápido: Usar Script Automático

Execute o script interativo para atualizar automaticamente:

```bash
cd fibromialgia-assistant/backend
node atualizar-supabase.js
```

Ou passe as credenciais como variáveis de ambiente:

```bash
SUPABASE_URL_NEW=https://seu-projeto.supabase.co \
SUPABASE_KEY_NEW=sua-chave-aqui \
node atualizar-supabase.js
```

---

## Método Manual: Atualização Manual

### Variáveis Necessárias

O sistema precisa das seguintes variáveis de ambiente do Supabase:

- `SUPABASE_URL` - URL do seu projeto Supabase
- `SUPABASE_KEY` - Chave anon/public do Supabase
- `SUPABASE_SERVICE_KEY` - Chave service/secret do Supabase (opcional, para operações administrativas)

### Onde Atualizar

As configurações do Supabase estão nos seguintes locais:

#### 1. Arquivo `.env` do Backend

**Arquivo:** `backend/.env`

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-anon-key-aqui
SUPABASE_SERVICE_KEY=sua-service-key-aqui
```

#### 2. Arquivo `.env` do Admin Panel (se existir)

**Arquivo:** `admin-panel/.env`

```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-chave-anon-key-aqui
```

### Como Obter as Credenciais do Supabase

1. **Acesse o Dashboard do Supabase:**

   - Vá para https://supabase.com/dashboard
   - Faça login com sua conta
   - Selecione seu projeto (ou crie um novo)

2. **Obter SUPABASE_URL:**

   - No menu lateral, vá em "Settings" > "API"
   - Copie o valor de "Project URL"
   - Formato: `https://xxxxx.supabase.co`

3. **Obter SUPABASE_KEY (anon key):**

   - Na mesma página "Settings" > "API"
   - Copie o valor de "Project API keys" > "anon public"
   - Esta é a chave pública que pode ser usada no frontend

4. **Obter SUPABASE_SERVICE_KEY (opcional):**
   - Na mesma página "Settings" > "API"
   - Copie o valor de "Project API keys" > "service_role secret"
   - ⚠️ **IMPORTANTE:** Esta chave deve ser mantida em segredo e nunca exposta no frontend

### Passos para Atualizar

1. **Atualizar arquivo `.env` do backend:**

   ```bash
   cd fibromialgia-assistant/backend
   # Edite o arquivo .env e atualize as variáveis SUPABASE_URL e SUPABASE_KEY
   ```

2. **Atualizar arquivo `.env` do admin-panel (se necessário):**

   ```bash
   cd fibromialgia-assistant/admin-panel
   # Edite o arquivo .env e atualize REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY
   ```

3. **Reiniciar os serviços:**
   - Reinicie o servidor backend
   - Reinicie o admin panel (se estiver rodando)

### Verificar se Funcionou

Após atualizar, teste a conexão:

1. **Verificar logs do backend:**

   - Ao iniciar o servidor, você deve ver: "Conexão com Supabase estabelecida com sucesso"

2. **Testar via código:**
   ```javascript
   const { supabase } = require("./src/config/supabase");
   const { data, error } = await supabase.from("users_livia").select("count");
   console.log("Conexão:", error ? "Erro" : "OK");
   ```

### Estrutura de Banco de Dados Necessária

Após atualizar as credenciais, certifique-se de que o novo projeto Supabase tem as tabelas necessárias:

**Tabelas obrigatórias:**

- `users_livia`
- `conversations_livia`

**Tabelas recomendadas:**

- `user_patterns`
- `daily_check_ins`

**Ver documento:** `VERIFICACAO_BANCO_DADOS.md` para lista completa

### Importante

- ⚠️ **Nunca commite arquivos `.env` no Git**
- ⚠️ **Mantenha as chaves em segurança**
- ⚠️ **A service key nunca deve ser usada no frontend**
- ⚠️ **Faça backup das configurações antigas antes de substituir**

### Exemplo de Arquivo .env

```env
# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Outras configurações...
PORT=3000
NODE_ENV=development
JWT_SECRET=seu-jwt-secret-aqui
```
