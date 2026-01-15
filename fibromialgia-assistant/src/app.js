require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const alertRoutes = require("./routes/alertRoutes");
const reportRoutes = require("./routes/reportRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const backupRoutes = require("./routes/backupRoutes");
const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const config = require("./config");

// Importar serviço do assistente
const assistantService = require("./services/assistantService");

// Configuração do Express
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Rotas da API
app.use("/api/users", userRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/backups", backupRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/webhooks", webhookRoutes);

// Rota de saúde
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Inicialização do servidor
const PORT = config.server.port;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${config.server.env}`);

  // Mensagem sobre o assistente
  console.log("Assistente Virtual para Fibromialgia inicializado");
  console.log(`API do WhatsApp configurada para: ${config.whatsapp.apiUrl}`);
  console.log(
    `Webhook ${config.whatsapp.webhook.enabled ? "habilitado" : "desabilitado"}`
  );
});

// Exporta para uso em testes
module.exports = app;
