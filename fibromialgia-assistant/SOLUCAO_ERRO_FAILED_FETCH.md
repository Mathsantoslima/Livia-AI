# 🔧 Solução: Erro "Failed to fetch" no Frontend

## ⚠️ Problema

O frontend está mostrando múltiplos erros `Failed to fetch` ao tentar carregar dados do dashboard.

## 🔍 Causa

As rotas do dashboard (`/api/dashboard/*`) requerem **autenticação** (token JWT), mas o frontend não está autenticado ou o token não está sendo enviado corretamente.

## ✅ Solução

### Passo 1: Fazer Login no Frontend

1. **Acesse a página de login:**
   ```
   http://localhost:3001/login
   ```

2. **Use as credenciais:**
   - **Email:** `admin@fibroia.com`
   - **Senha:** `123456`

3. **Após o login**, você será redirecionado para o dashboard e os erros devem desaparecer.

### Passo 2: Verificar se o Token está sendo Enviado

Abra o **Console do Navegador** (F12) e verifique:

1. **Network Tab:**
   - Veja se as requisições para `/api/dashboard/*` estão sendo feitas
   - Verifique se o header `Authorization: Bearer ...` está presente

2. **Application/Storage Tab:**
   - Verifique se há um item `fibroia_user` no `localStorage`
   - Deve conter o token JWT

### Passo 3: Verificar CORS (se necessário)

Se o problema persistir após o login, pode ser um problema de CORS. Verifique se o backend está configurado corretamente:

```javascript
// backend/server.js deve ter:
app.use(cors()); // Permite requisições de qualquer origem
```

---

## 🧪 Teste Manual

### 1. Testar Login via API

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@fibroia.com","password":"123456"}'
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "...",
    "email": "admin@fibroia.com",
    "name": "Administrador",
    "role": "admin"
  }
}
```

### 2. Testar Dashboard com Token

```bash
# Substitua SEU_TOKEN pelo token obtido acima
curl http://localhost:3000/api/dashboard/costs \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Resposta esperada:**
```json
{
  "summary": {...},
  "projected": {...}
}
```

---

## 🔄 Fluxo Correto

1. **Usuário acessa:** `http://localhost:3001`
2. **Não autenticado:** Redirecionado para `/login`
3. **Faz login:** Credenciais são validadas
4. **Token salvo:** No `localStorage` como `fibroia_user`
5. **Requisições futuras:** Incluem `Authorization: Bearer TOKEN`
6. **Dashboard carrega:** Sem erros

---

## ⚠️ Problemas Comuns

### 1. Token Expirado
- **Sintoma:** Erro 401 após algum tempo
- **Solução:** Fazer logout e login novamente

### 2. CORS Bloqueando
- **Sintoma:** Erro "Failed to fetch" mesmo com token
- **Solução:** Verificar configuração CORS no backend

### 3. Backend Offline
- **Sintoma:** Erro "Failed to connect"
- **Solução:** Verificar se o backend está rodando na porta 3000

### 4. URL da API Incorreta
- **Sintoma:** Erro 404 ou "Failed to fetch"
- **Solução:** Verificar `REACT_APP_API_URL` no `.env` do frontend

---

## 📝 Checklist

- [ ] Backend está rodando (`curl http://localhost:3000/health`)
- [ ] Frontend está rodando (`http://localhost:3001`)
- [ ] Usuário fez login (`/login`)
- [ ] Token está no `localStorage`
- [ ] Requisições incluem header `Authorization`
- [ ] CORS está configurado no backend

---

## 🚀 Próximos Passos

Após resolver o problema de autenticação:

1. ✅ Dashboard carregará corretamente
2. ✅ Métricas de IA serão exibidas
3. ✅ Gráficos e estatísticas funcionarão
4. ⚠️ **Ainda falta:** Criar tabelas no Supabase (veja `CRIAR_TABELAS_SUPABASE.md`)

---

## 📚 Arquivos Relacionados

- `admin-panel/src/services/apiService.js` - Serviço de API
- `admin-panel/src/contexts/AuthContext.js` - Contexto de autenticação
- `backend/src/routes/dashboardRoutes.js` - Rotas do dashboard
- `backend/src/middlewares/authMiddleware.js` - Middleware de autenticação
