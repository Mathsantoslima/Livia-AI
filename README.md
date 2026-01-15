# Fibro.IA - Assistente de Fibromialgia

Sistema completo de assistente de IA para pacientes com fibromialgia, com integração WhatsApp e painel administrativo.

## 🏗️ Arquitetura

- **Backend**: Node.js/Express com múltiplos providers de IA (Gemini, ChatGPT, Claude)
- **Frontend**: React Admin Panel
- **WhatsApp**: Integração via W-API
- **Database**: Supabase (PostgreSQL)

## 📁 Estrutura do Projeto

```
fibro.ia/
├── fibromialgia-assistant/
│   ├── backend/          # API Node.js
│   ├── admin-panel/      # Painel React
│   └── whatsapp-baileys-api/  # Integração WhatsApp
├── vercel.json          # Configuração Vercel
└── README.md
```

## 🚀 Como Rodar Localmente

### Backend

```bash
cd fibromialgia-assistant/backend
npm install
cp .env.example .env  # Configure suas variáveis
npm start
```

### Frontend

```bash
cd fibromialgia-assistant/admin-panel
npm install
npm start
```

## 🔧 Variáveis de Ambiente

### Backend (.env)

```env
# Servidor
PORT=3000
NODE_ENV=development
SERVER_BASE_URL=http://localhost:3000

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-supabase

# IA Providers
GOOGLE_AI_API_KEY=sua-chave-gemini
OPENAI_API_KEY=sua-chave-openai
CLAUDE_API_KEY=sua-chave-claude
GEMINI_MODEL=gemini-1.5-pro-latest

# WhatsApp (W-API)
W_API_URL=https://api.w-api.app
W_API_TOKEN=seu-token-w-api
W_API_INSTANCE_ID=sua-instancia

# JWT
JWT_SECRET=seu-secret-jwt
```

## 📦 Deploy

### Vercel

1. Conecte seu repositório no Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📝 Licença

MIT
