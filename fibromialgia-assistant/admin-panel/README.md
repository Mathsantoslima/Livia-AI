# Painel Administrativo - Assistente de Fibromialgia

Este é o painel administrativo do Assistente de Fibromialgia, uma aplicação web desenvolvida com React e Material-UI para gerenciar o sistema.

## Funcionalidades

- Dashboard com estatísticas do sistema
- Gerenciamento de usuários
- Monitoramento de alertas
- Geração e visualização de relatórios
- Sistema de backup
- Configurações do sistema

## Requisitos

- Node.js 14.x ou superior
- npm 6.x ou superior
- Conta no Supabase

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/fibromialgia-assistant.git
cd fibromialgia-assistant/admin-panel
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

   - Crie um arquivo `.env` na raiz do projeto
   - Adicione as seguintes variáveis:

   ```
   REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
   REACT_APP_SUPABASE_KEY=sua-chave-anon-public
   REACT_APP_API_URL=http://localhost:3000/api
   ```

4. Inicie o servidor de desenvolvimento:

```bash
npm start
```

A aplicação estará disponível em `http://localhost:3000`.

## Estrutura do Projeto

```
admin-panel/
  ├── src/
  │   ├── components/     # Componentes reutilizáveis
  │   ├── contexts/       # Contextos do React
  │   ├── pages/         # Páginas da aplicação
  │   ├── config/        # Configurações
  │   └── App.js         # Componente principal
  ├── public/            # Arquivos estáticos
  ├── package.json       # Dependências e scripts
  └── README.md         # Este arquivo
```

## Scripts Disponíveis

- `npm start`: Inicia o servidor de desenvolvimento
- `npm build`: Cria a versão de produção
- `npm test`: Executa os testes
- `npm eject`: Ejetar configurações do Create React App

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para mais detalhes.
