/**
 * =========================================
 * PROVIDERS - EXPORTAR TODOS OS PROVIDERS
 * =========================================
 */

const BaseProvider = require("./BaseProvider");
const GeminiProvider = require("./GeminiProvider");
const ChatGPTProvider = require("./ChatGPTProvider");
const ClaudeProvider = require("./ClaudeProvider");
const ProviderManager = require("./ProviderManager");

module.exports = {
  BaseProvider,
  GeminiProvider,
  ChatGPTProvider,
  ClaudeProvider,
  ProviderManager,
};
