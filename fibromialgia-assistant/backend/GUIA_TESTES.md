# Guia de Testes - Autenticação e WhatsApp Baileys

Este guia explica como testar rotas protegidas e iniciar o WhatsApp Baileys para integração completa.

## 📋 Índice

1. [Autenticação e Teste de Rotas Protegidas](#1-autenticação-e-teste-de-rotas-protegidas)
2. [Iniciar WhatsApp Baileys](#2-iniciar-whatsapp-baileys)
3. [Testar Integração Completa](#3-testar-integração-completa)

---

## 1. Autenticação e Teste de Rotas Protegidas

### Como Funciona a Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação. Todas as rotas protegidas requerem um token no header:

```
Authorization: Bearer <seu_token_jwt>
```

### Pré-requisitos

1. **JWT_SECRET configurado** no arquivo `.env`
2. **Tabela `admins`** no Supabase com pelo menos um administrador
3. **Servidor backend rodando** em `http://localhost:3000`

### Como Obter um Token

#### Opção 1: Via API de Autenticação (Rota Pública)

A API possui uma rota de login pública:

```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu_email@exemplo.com",
    "password": "sua_senha"
  }'
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "uuid-do-admin",
    "email": "seu_email@exemplo.com",
    "name": "Nome do Admin",
    "role": "admin"
  }
}
```

**Nota:** Você precisa ter um administrador criado na tabela `admins` do Supabase antes de poder fazer login. Se não tiver, você precisará criar um via script SQL ou via rota de registro (que requer autenticação).

#### Opção 2: Criar um Token Manualmente (para desenvolvimento)

Se você precisa criar um token para testes, você pode usar o `authService` ou criar um script de teste:

```javascript
// test-token.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const adminId = 'seu_admin_id_do_supabase'; // ID do admin no Supabase

const token = jwt.sign(
  {
    id: adminId,
    email: 'admin@exemplo.com',
    role: 'admin'
  },
  JWT_SECRET,
  { expiresIn: '24h' }
);

console.log('Token gerado:');
console.log(token);
```

### Testar Rotas Protegidas

Com o token em mãos, você pode testar rotas protegidas:

```bash
# Exemplo: Testar dashboard
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  http://localhost:3000/api/dashboard

# Exemplo: Testar lista de usuários
curl -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  http://localhost:3000/api/users
```

### Rotas Protegidas Disponíveis

Consulte `ROTAS_API.md` para ver todas as rotas protegidas. Principais:

- `GET /api/dashboard` - Dashboard de métricas
- `GET /api/users` - Lista de usuários
- `GET /api/admin/*` - Rotas administrativas
- `GET /api/predictions` - Predições
- `GET /api/whatsapp/status` - Status do WhatsApp

---

## 2. Iniciar WhatsApp Baileys

### Pré-requisitos

1. **Backend rodando** (servidor principal)
2. **Variáveis de ambiente configuradas** (especialmente Supabase e IA)
3. **Node.js instalado** e dependências instaladas

### Método 1: Usar Script de Inicialização

Se você tem um script `start-whatsapp-baileys.sh`:

```bash
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant
chmod +x start-whatsapp-baileys.sh
./start-whatsapp-baileys.sh
```

### Método 2: Iniciar Manualmente

```bash
# Navegar para o diretório do WhatsApp Baileys
cd /Users/matheuslima/Downloads/fibro.ia/fibromialgia-assistant/whatsapp-baileys-api

# Instalar dependências (se necessário)
npm install

# Iniciar servidor
node server.js
```

### O Que Esperar

1. **Servidor inicia** na porta 8080 (ou porta configurada)
2. **QR Code é gerado** no terminal
3. **Escaneie o QR Code** com seu WhatsApp
4. **Após escanear**, a conexão é estabelecida
5. **Infraestrutura de IA é inicializada** automaticamente

### Logs Esperados

```
Servidor WhatsApp API rodando na porta 8080
API Key: sua_api_key
Webhook URL: seu_webhook_url
QR Code gerado. Escaneie com WhatsApp:
[QR Code ASCII]
🤖 Inicializando infraestrutura de IA...
✅ Infraestrutura de IA inicializada com sucesso!
Conexão aberta!
```

### Problemas Comuns

#### QR Code não aparece
- Verifique se o diretório `sessions/` existe
- Verifique permissões de arquivo
- Limpe o diretório `sessions/` e tente novamente

#### Erro ao inicializar IA
- Verifique se o backend está rodando
- Verifique variáveis de ambiente (Supabase, chaves de IA)
- Verifique logs do erro

#### Conexão fecha imediatamente
- Verifique credenciais do WhatsApp
- Limpe o diretório `sessions/` e reconecte
- Verifique conexão com internet

---

## 3. Testar Integração Completa

### Fluxo Completo

1. **Backend rodando** → `http://localhost:3000`
2. **WhatsApp Baileys rodando** → `http://localhost:8080`
3. **WhatsApp conectado** (QR Code escaneado)
4. **IA inicializada** e pronta

### Teste 1: Verificar Status do Sistema

```bash
# Verificar backend
curl http://localhost:3000/health

# Verificar WhatsApp (se tiver endpoint)
curl http://localhost:8080/status
```

### Teste 2: Enviar Mensagem via WhatsApp

Após conectar o WhatsApp, você pode enviar uma mensagem para o número configurado e a IA deve responder automaticamente.

### Teste 3: Verificar Logs

Monitore os logs do WhatsApp Baileys para ver:
- Mensagens recebidas
- Respostas da IA
- Erros (se houver)

### Teste 4: Verificar Dashboard (com autenticação)

```bash
# Com token válido
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost:3000/api/dashboard
```

---

## 📝 Notas Importantes

### Variáveis de Ambiente Necessárias

Certifique-se de ter configurado no `.env` do backend:

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_key
SUPABASE_SERVICE_KEY=sua_service_key

# JWT
JWT_SECRET=seu_secret_jwt_super_secreto

# IA Providers
GOOGLE_AI_API_KEY=sua_chave_google
OPENAI_API_KEY=sua_chave_openai
CLAUDE_API_KEY=sua_chave_claude

# WhatsApp
ASSISTANT_PHONE_NUMBER=(11) 93618-8540
ASSISTANT_PHONE_NUMBER_RAW=5511936188540
```

### Estrutura de Diretórios

```
fibromialgia-assistant/
├── backend/              # Servidor principal (porta 3000)
│   ├── .env             # Variáveis de ambiente do backend
│   └── server.js        # Servidor principal
└── whatsapp-baileys-api/ # Servidor WhatsApp (porta 8080)
    ├── server.js        # Servidor WhatsApp Baileys
    └── sessions/        # Sessões do WhatsApp
```

### Ordem de Inicialização Recomendada

1. **Iniciar Backend primeiro**
   ```bash
   cd backend
   npm start
   ```

2. **Depois iniciar WhatsApp Baileys**
   ```bash
   cd whatsapp-baileys-api
   node server.js
   ```

---

## 🔍 Troubleshooting

### Erro: "Cannot find module"
- Execute `npm install` no diretório apropriado
- Verifique se todas as dependências estão instaladas

### Erro: "SUPABASE_URL não definida"
- Verifique se o arquivo `.env` existe
- Verifique se as variáveis estão corretas
- Verifique se o `.env` está sendo carregado

### Erro: "Token inválido"
- Verifique se o `JWT_SECRET` está configurado
- Verifique se o token não expirou
- Verifique se o formato do token está correto (Bearer <token>)

### WhatsApp não conecta
- Limpe o diretório `sessions/`
- Regenere o QR Code
- Verifique conexão com internet
- Verifique se o WhatsApp Web não está conectado em outro lugar

---

## 📚 Referências

- `ROTAS_API.md` - Documentação completa das rotas
- `PROXIMOS_PASSOS.md` - Guia de próximos passos
- `ATUALIZAR_SUPABASE.md` - Como atualizar credenciais do Supabase
