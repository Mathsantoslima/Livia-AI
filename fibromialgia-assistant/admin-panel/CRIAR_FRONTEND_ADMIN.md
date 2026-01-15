# Plano para Criar Front-End Admin

## Status Atual

O admin-panel já existe com:
- ✅ Estrutura React básica
- ✅ Páginas básicas (Dashboard, Users, Settings, etc.)
- ✅ Autenticação local (mock)
- ✅ Layout e componentes básicos

## O Que Precisa Ser Criado/Atualizado

### 1. Serviços de API ✅ (Criado)
- ✅ `src/services/apiService.js` - Serviço para comunicação com backend

### 2. Autenticação (Pendente)
- ⏳ Atualizar `src/contexts/AuthContext.js` para usar API real
- ⏳ Integrar login com `/api/admin/auth/login`

### 3. Dashboard de Métricas de IA (Pendente)
- ⏳ Criar componente para mostrar métricas de providers
- ⏳ Criar componente para mostrar custos
- ⏳ Criar componente para mostrar estatísticas de uso
- ⏳ Atualizar `src/pages/DashboardPage.js` para usar API real

### 4. Configurações (Pendente)
- ⏳ Adicionar `REACT_APP_API_URL` no `.env`
- ⏳ Configurar CORS no backend (se necessário)

## Próximos Passos

1. **Atualizar AuthContext** para usar API real
2. **Criar componente de Dashboard de IA** com métricas
3. **Integrar com rotas do backend** (`/api/dashboard`, `/api/dashboard/costs`, etc.)
4. **Testar integração completa**

## Estrutura de Rotas do Backend

### Autenticação
- `POST /api/admin/auth/login` - Login (pública)

### Dashboard
- `GET /api/dashboard` - Dashboard completo
- `GET /api/dashboard/costs` - Estatísticas de custo
- `GET /api/dashboard/providers` - Estatísticas dos providers

### Monitoramento
- `GET /api/admin/monitoring/health` - Saúde do sistema
- `GET /api/admin/monitoring/metrics` - Todas as métricas

## Variáveis de Ambiente Necessárias

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_KEY=sua-chave-anon
```
