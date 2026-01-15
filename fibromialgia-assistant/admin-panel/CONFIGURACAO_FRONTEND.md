# Configuração do Front-End Admin

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do diretório `admin-panel/` com as seguintes variáveis:

```env
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_KEY=sua-chave-anon-key
```

## Instalação e Execução

1. **Instalar dependências:**
   ```bash
   cd admin-panel
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Copie o exemplo acima para `.env`
   - Preencha com seus valores reais

3. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm start
   ```

   O servidor iniciará em `http://localhost:3000` (ou outra porta se 3000 estiver ocupada)

## Estrutura Criada

### Serviços
- ✅ `src/services/apiService.js` - Serviço para comunicação com backend

### Componentes de Dashboard
- ✅ `src/components/Dashboard/AIDashboard.js` - Dashboard principal de métricas de IA
- ✅ `src/components/Dashboard/ProviderStats.js` - Estatísticas dos providers
- ✅ `src/components/Dashboard/CostStats.js` - Estatísticas de custo

### Contextos
- ✅ `src/contexts/AuthContext.js` - Atualizado para usar API real

### Páginas
- ✅ `src/pages/DashboardPage.js` - Integrado com componente AIDashboard

## Funcionalidades Implementadas

### 1. Autenticação
- Login integrado com `/api/admin/auth/login`
- Gerenciamento de token JWT
- Logout funcional

### 2. Dashboard de Métricas de IA
- Visualização de estatísticas de providers (Gemini, ChatGPT, Claude)
- Visualização de custos (total, diário, mensal, projeções)
- Seleção de período (24h, 7d, 30d)
- Gráficos e tabelas

### 3. Integração com Backend
- Chamadas para `/api/dashboard`
- Chamadas para `/api/dashboard/costs`
- Chamadas para `/api/dashboard/providers`

## Próximos Passos

1. **Testar integração:**
   - Verificar se o backend está rodando
   - Verificar se as rotas estão acessíveis
   - Testar login
   - Testar dashboard

2. **Configurar CORS (se necessário):**
   - Se houver erros de CORS, configurar no backend

3. **Criar usuário admin:**
   - Criar um admin no Supabase (tabela `admins`)
   - Usar esse admin para fazer login

4. **Verificar ProviderManager:**
   - Verificar se o ProviderManager está configurado no backend
   - As rotas de dashboard requerem ProviderManager disponível
