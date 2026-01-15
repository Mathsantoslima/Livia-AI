# 🤖 Infraestrutura Completa de Agentes de IA - Múltiplos Providers

## 📋 Visão Geral

A infraestrutura agora suporta **múltiplos providers de IA** com fallback automático:
- ✅ **Gemini** (Google AI)
- ✅ **ChatGPT** (OpenAI)
- ✅ **Claude** (Anthropic)

## 🏗️ Arquitetura

### Estrutura de Providers

```
src/core/providers/
├── BaseProvider.js          # Interface base
├── GeminiProvider.js        # Adaptador Google Gemini
├── ChatGPTProvider.js       # Adaptador OpenAI
├── ClaudeProvider.js        # Adaptador Anthropic
├── ProviderManager.js       # Gerencia múltiplos providers
└── index.js                 # Exportações
```

### Componentes Principais

1. **BaseProvider**: Interface unificada para todos os providers
2. **ProviderManager**: Gerencia múltiplos providers com:
   - Fallback automático
   - Load balancing (round-robin)
   - Seleção por melhor performance
   - Health checks
   - Estatísticas de uso

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Configure no arquivo `.env`:

```env
# Google Gemini (Recomendado como padrão)
GOOGLE_AI_API_KEY=sua-chave-gemini
GEMINI_MODEL=gemini-1.5-pro

# OpenAI ChatGPT (Opcional)
OPENAI_API_KEY=sua-chave-openai
OPENAI_MODEL=gpt-4o-mini

# Anthropic Claude (Opcional)
CLAUDE_API_KEY=sua-chave-claude
CLAUDE_MODEL=claude-3-sonnet-20240229
```

### 2. Configuração Básica (Fallback Automático)

```javascript
const { getAIInfrastructure } = require('./src/ai-infra');

// Usa todos os providers disponíveis com fallback automático
const aiInfra = getAIInfrastructure({
  providerStrategy: "fallback", // Padrão
  fallbackOrder: ["gemini", "chatgpt", "claude"],
});
```

### 3. Configuração Avançada

```javascript
const { getAIInfrastructure } = require('./src/ai-infra');

const aiInfra = getAIInfrastructure({
  // Configurar providers específicos
  providers: {
    gemini: {
      apiKey: process.env.GOOGLE_AI_API_KEY,
      model: "gemini-1.5-pro",
    },
    chatgpt: {
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4o-mini",
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      model: "claude-3-sonnet-20240229",
    },
  },
  
  // Estratégia de seleção
  providerStrategy: "best-performance", // fallback, round-robin, best-performance
  
  // Provider preferido (opcional)
  preferredProvider: "gemini", // null = usar estratégia
  
  // Ordem de fallback
  fallbackOrder: ["gemini", "chatgpt", "claude"],
});
```

## 🎯 Estratégias de Seleção

### 1. Fallback (Padrão)
- Usa provider padrão (gemini)
- Se falhar, tenta providers na ordem especificada
- Mais simples e confiável

```javascript
providerStrategy: "fallback"
```

### 2. Round-Robin
- Distribui requisições entre providers
- Útil para balanceamento de carga

```javascript
providerStrategy: "round-robin"
```

### 3. Best Performance
- Seleciona provider com melhor taxa de sucesso e menor latência
- Requer coleta de estatísticas

```javascript
providerStrategy: "best-performance"
```

## 📊 Uso

### Exemplo Básico

```javascript
const { getAIInfrastructure } = require('./src/ai-infra');

const aiInfra = getAIInfrastructure();

// Processar mensagem (usa fallback automático se necessário)
const response = await aiInfra.processMessage(
  "5511999999999",
  "Oi, estou com dor hoje"
);

console.log(response.text); // Resposta
console.log(response.metadata.provider); // Provider usado
console.log(response.metadata.fallbackUsed); // Se usou fallback
```

### Usar Provider Específico

```javascript
// No LiviaAgent
const agent = new LiviaAgent({
  preferredProvider: "claude", // Usa Claude se disponível
  providers: {
    claude: { apiKey: process.env.CLAUDE_API_KEY },
  },
});
```

### Obter Estatísticas

```javascript
const providerManager = aiInfra.getAgent("Livia").providerManager;

// Estatísticas gerais
const stats = providerManager.getStats();
console.log(stats);

// Info de cada provider
const providersInfo = providerManager.getProvidersInfo();
console.log(providersInfo);

// Testar todos os providers
const health = await providerManager.testAllProviders();
console.log(health);
```

## 🧪 Testar Providers

Execute o script de teste:

```bash
cd fibromialgia-assistant/backend
node src/ai-infra/test-providers.js
```

O script vai:
- ✅ Testar conexão com cada provider
- ✅ Testar geração de resposta
- ✅ Mostrar estatísticas
- ✅ Verificar fallback automático

## 🔄 Fallback Automático

### Como Funciona

1. Tenta usar provider padrão/preferido
2. Se falhar, tenta providers na ordem `fallbackOrder`
3. Retorna resposta do primeiro provider que funcionar
4. Registra estatísticas de sucesso/erro

### Exemplo de Fallback

```javascript
// Gemini falha → Tenta ChatGPT → Funciona!
const response = await providerManager.generate(...);

// Resposta inclui:
response.providerUsed = "chatgpt"
response.fallbackUsed = true
response.originalProvider = "gemini"
```

## 📈 Health Checks

O sistema monitora automaticamente a saúde de cada provider:

- ✅ Testa conexão periodicamente
- ✅ Marca providers como saudáveis/não saudáveis
- ✅ Evita usar providers com problemas
- ✅ Cache de status (5 minutos)

## 💡 Casos de Uso

### 1. Redundância e Confiabilidade
```javascript
// Sempre ter backup se um provider falhar
fallbackOrder: ["gemini", "chatgpt", "claude"]
```

### 2. Balanceamento de Carga
```javascript
// Distribuir requisições entre providers
providerStrategy: "round-robin"
```

### 3. Otimização de Performance
```javascript
// Usar provider com melhor performance
providerStrategy: "best-performance"
```

### 4. Comparação de Modelos
```javascript
// Testar diferentes modelos para mesma requisição
for (const provider of ["gemini", "chatgpt", "claude"]) {
  const response = await providerManager.generate(..., provider);
  console.log(`${provider}: ${response.text}`);
}
```

## 🔧 Adicionar Novo Provider

Para adicionar um novo provider:

1. **Criar classe do provider:**
```javascript
// src/core/providers/MeuProvider.js
const BaseProvider = require("./BaseProvider");

class MeuProvider extends BaseProvider {
  constructor(config) {
    super({ name: "MeuProvider", ...config });
    // Inicializar cliente da API
  }

  async generate(systemPrompt, messages, options) {
    // Implementar geração
  }
}
```

2. **Adicionar ao ProviderManager:**
```javascript
// Em ProviderManager.js
const MeuProvider = require("./MeuProvider");

// Na função _initializeProviders
if (config.meuProvider) {
  const provider = new MeuProvider(config.meuProvider);
  this.providers.set("meuProvider", provider);
}
```

## 📚 API Reference

### ProviderManager

#### `generate(systemPrompt, messages, options, preferredProvider)`
Gera resposta usando provider selecionado.

#### `testAllProviders()`
Testa conexão com todos os providers.

#### `getStats()`
Retorna estatísticas de uso.

#### `getProvidersInfo()`
Retorna informações de todos os providers.

#### `listProviders()`
Lista nomes dos providers disponíveis.

## 🐛 Troubleshooting

### Erro: "Nenhum provider configurado"
- Verifique se pelo menos uma chave API está configurada
- Confira variáveis de ambiente no `.env`

### Provider sempre falha
- Teste conexão individual: `node test-providers.js`
- Verifique chave API
- Verifique limites/quota

### Fallback não funciona
- Confirme que múltiplos providers estão configurados
- Verifique ordem no `fallbackOrder`

## ✅ Checklist

- [ ] Configurei pelo menos uma chave API
- [ ] Testei cada provider individualmente
- [ ] Configurei fallback order
- [ ] Escolhi estratégia apropriada
- [ ] Testei fallback automático
- [ ] Monitorei estatísticas de uso

## 🎉 Benefícios

✅ **Redundância**: Sempre tem backup
✅ **Confiança**: Menos falhas
✅ **Performance**: Melhor provider automaticamente
✅ **Flexibilidade**: Troca entre providers facilmente
✅ **Extensibilidade**: Fácil adicionar novos providers
