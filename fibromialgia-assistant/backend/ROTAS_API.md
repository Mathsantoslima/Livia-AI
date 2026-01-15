# Rotas da API - Documentação

## Estrutura de Rotas

Todas as rotas da API estão sob o prefixo `/api`, exceto:
- `/health` - Health check (raiz)
- `/webhook/*` - Webhooks (raiz)

## Rotas Disponíveis

### 🔓 Rotas Públicas (sem autenticação)

#### Health Check
- **GET** `/health`
  - Retorna status do servidor
  - Exemplo: `GET http://localhost:3000/health`

#### Teste da API
- **GET** `/api/test`
  - Testa se a API está funcionando
  - Exemplo: `GET http://localhost:3000/api/test`
  - Resposta: `{ "message": "API está funcionando!" }`

#### Webhooks
- **POST** `/webhook/whatsapp` ✅ **FUNCIONANDO**
  - Recebe mensagens do WhatsApp
  - **Método:** POST (não GET)
  - **Exemplo:** `POST http://localhost:3000/webhook/whatsapp`
  - **Formato esperado:**
    ```json
    {
      "event": "message",
      "data": {
        "from": "5511999999999@s.whatsapp.net",
        "to": "5511936188540@s.whatsapp.net",
        "body": "Texto da mensagem",
        "id": "message_id",
        "timestamp": 1234567890,
        "type": "conversation"
      }
    }
    ```
  - **Nota importante:** 
    - Esta rota está registrada diretamente em `/webhook/whatsapp` (não `/api/webhook/whatsapp`)
    - A rota aceita apenas **POST** (GET retorna 404)
    - Se o payload não tiver o formato esperado, retorna `{"status":"ignored"}` (não é erro)

### 🔒 Rotas Protegidas (requerem autenticação)

Todas as rotas abaixo requerem header de autenticação:
```
Authorization: Bearer <token>
```

#### Usuários
- **GET** `/api/users`
- **POST** `/api/users`
- **GET** `/api/users/:id`
- **PUT** `/api/users/:id`
- **DELETE** `/api/users/:id`

#### Predições
- **GET** `/api/predictions`
- **POST** `/api/predictions`
- **GET** `/api/predictions/:id`

#### Admin
- **GET** `/api/admin/*`
- Várias rotas administrativas

#### Instâncias
- **GET** `/api/instances`
- **POST** `/api/instances`
- Outras rotas de instâncias

#### Dashboard (Métricas)
- **GET** `/api/dashboard`
  - Dashboard completo de métricas
  - Requer: Autenticação + Admin
  - Exemplo: `GET http://localhost:3000/api/dashboard?period=24h`
  
- **GET** `/api/dashboard/costs`
  - Estatísticas de custo
  - Requer: Autenticação + Admin
  
- **GET** `/api/dashboard/providers`
  - Estatísticas dos providers
  - Requer: Autenticação + Admin

#### WhatsApp
- **POST** `/api/whatsapp/send`
  - Envia mensagem via WhatsApp
  - Requer: Autenticação

## Testando as Rotas

### 1. Teste Básico (sem autenticação)

```bash
# Health check
curl http://localhost:3000/health

# Teste da API
curl http://localhost:3000/api/test
```

### 2. Teste de Rotas Protegidas (com autenticação)

Primeiro, obtenha um token de autenticação (via login/admin), depois:

```bash
# Exemplo com token
curl -H "Authorization: Bearer seu_token_aqui" http://localhost:3000/api/dashboard
```

### 3. Exemplo de Resposta do Health Check

```json
{
  "status": "online",
  "timestamp": "2026-01-13T23:54:15.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

### 4. Exemplo de Resposta do Test

```json
{
  "message": "API está funcionando!"
}
```

## Notas Importantes

1. **Rota raiz (`/`)**: Não há rota definida para `/` - isso é esperado. Use `/health` ou `/api/test` para testar.

2. **Erro 404 em `/`**: É normal receber 404 na rota raiz. O servidor está configurado corretamente.

3. **Rotas não encontradas**: Se você está recebendo 404 em rotas específicas, verifique:
   - Se a rota está sob o prefixo `/api`
   - Se requer autenticação (e se você está enviando o token)
   - Se o método HTTP está correto (GET, POST, etc.)

## Endpoints Recomendados para Teste

### Iniciar testes (sem autenticação):
1. `GET /health` - Verifica se o servidor está online
2. `GET /api/test` - Verifica se as rotas estão funcionando

### Com autenticação:
1. `GET /api/dashboard` - Dashboard de métricas
2. `GET /api/users` - Lista de usuários
