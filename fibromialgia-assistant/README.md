# FibroIA - Assistente para Fibromialgia

Um assistente virtual especializado para ajudar pacientes com fibromialgia, oferecendo suporte, monitoramento de sintomas e educação sobre a condição.

## Estrutura do Projeto

O projeto é dividido em duas partes principais:

1. **Assistente FibroIA** - O assistente virtual que interage diretamente com os pacientes via WhatsApp
2. **Painel Administrativo** - Interface para administradores gerenciarem o assistente, usuários e visualizar dados

## Requisitos

- Node.js (v16+)
- NPM ou Yarn
- Docker e Docker Compose (para desenvolvimento local)
- Conta no Supabase (para banco de dados e autenticação)

## Funcionalidades do Assistente

O assistente virtual FibroIA possui as seguintes capacidades:

- **Onboarding de Pacientes**: Processo inicial para coleta de informações básicas
- **Monitoramento de Dor**: Acompanhamento da intensidade e localização da dor
- **Registro de Medicamentos**: Cadastro e lembretes de medicações
- **Recomendações de Exercícios**: Sugestões de atividades físicas adequadas
- **Orientações sobre Sono**: Dicas para melhorar a qualidade do sono
- **Educação sobre Fibromialgia**: Informações confiáveis sobre a condição

## Configuração do Ambiente

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/fibroia.git
cd fibroia
```

### 2. Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com) se ainda não tiver uma
2. Crie um novo projeto no Supabase
3. Acesse "Settings > API" e copie a URL, a chave anon/public e a chave de serviço
4. Acesse "SQL Editor" e execute os scripts SQL localizados em:
   - `backend/supabase/migrations/20231015120000_whatsapp_tables.sql`
   - `backend/supabase/migrations/20231020120000_patient_tables.sql`

### 3. Configuração do Backend

1. Vá para o diretório do backend:

```bash
cd backend
```

2. Crie um arquivo `.env` com as seguintes variáveis:

```
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
SUPABASE_SERVICE_KEY=sua_chave_service_do_supabase
PORT=3000
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_KEY=sua_chave_api
WEBHOOK_ENABLED=true
WEBHOOK_URL=http://localhost:3000/api/webhooks/whatsapp
NODE_ENV=development
```

3. Instale as dependências e inicie o servidor:

```bash
npm install
npm start
```

### 4. Configuração do Painel Administrativo

1. Vá para o diretório do painel administrativo:

```bash
cd ../admin-panel
```

2. Crie um arquivo `.env` com as seguintes variáveis:

```
REACT_APP_SUPABASE_URL=sua_url_do_supabase
REACT_APP_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
```

3. Instale as dependências e inicie o servidor de desenvolvimento:

```bash
npm install
npm start
```

4. O painel administrativo estará disponível em `http://localhost:3000`

### 5. Configuração do Assistente Virtual

1. Na raiz do projeto, configure o arquivo `.env` com as credenciais necessárias:

```bash
cp .env.example .env
nano .env  # Edite com suas credenciais
```

2. Execute o script de inicialização:

```bash
./scripts/start-assistant.sh
```

Este script irá iniciar tanto a API do WhatsApp quanto o Assistente Virtual.

## Configuração da Integração com WhatsApp

Para uma integração completa com WhatsApp, use uma das opções abaixo:

### Opção 1: Baileys (Recomendado para Desenvolvimento)

O projeto já está configurado para usar a biblioteca [Baileys](https://github.com/WhiskeySockets/Baileys) para conexão com o WhatsApp.

1. Execute o script para iniciar a API do Baileys:

```bash
./start-whatsapp-baileys.sh
```

2. Use o painel administrativo para escanear o código QR e conectar uma instância do WhatsApp.

### Opção 2: WhatsApp Web.js (Alternativa para Desenvolvimento)

1. Execute o script para iniciar a API baseada em whatsapp-web.js:

```bash
./start-whatsapp-no-docker.sh
```

2. Siga o mesmo processo de escaneamento do QR code.

### Opção 3: WhatsApp Business API (Recomendado para Produção)

1. Registre-se como parceiro de negócios do Facebook
2. Solicite acesso à API do WhatsApp Business
3. Configure o webhook no seu backend
4. Atualize as funções Supabase para usar a API oficial

## Acesso ao Painel Administrativo

1. Crie um usuário administrador no Supabase (ou use o criado automaticamente):

   - Email: admin@fibroia.com
   - Senha: admin123 (altere imediatamente após o primeiro login)

2. Acesse o painel administrativo em `http://localhost:3000`

## Scripts Úteis

O projeto inclui vários scripts para facilitar o desenvolvimento e manutenção:

- `./scripts/start-assistant.sh` - Inicia o assistente e suas dependências
- `./reset-db.sh` - Reset do banco de dados (preserva usuários admin)
- `./start-whatsapp-baileys.sh` - Inicia apenas a API do WhatsApp com Baileys
- `./start-whatsapp-no-docker.sh` - Inicia apenas a API do WhatsApp com whatsapp-web.js

## Fluxo de Interação com Pacientes

1. **Primeiro Contato** - O paciente inicia uma conversa via WhatsApp
2. **Onboarding** - O assistente coleta informações básicas (nome, diagnóstico)
3. **Avaliação Inicial** - Coleta de informações sobre nível de dor e sintomas
4. **Interação Contínua** - Monitoramento e suporte baseado nas necessidades do paciente

## Recursos do Painel Administrativo

- **Dashboard** - Visão geral das interações e estatísticas
- **Gerenciamento de Pacientes** - Lista de pacientes e detalhes
- **Conexão WhatsApp** - Gerenciamento da conexão e QR code
- **Histórico de Mensagens** - Visualização de conversas com pacientes
- **Alertas** - Configuração de alertas para situações críticas
- **Relatórios** - Geração de relatórios de uso e tendências

## Licença

Este projeto está licenciado sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

---

© 2023 FibroIA - Todos os direitos reservados
