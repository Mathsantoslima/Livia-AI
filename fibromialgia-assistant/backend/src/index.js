require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const schedulerService = require("./services/schedulerService");
const logger = require("./utils/logger");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.use("/api", routes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ status: "ok", message: "Fibromialgia Assistant API" });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: "error",
    message: err.message,
  });
});

// Iniciar serviço de agendamento
schedulerService.initScheduledTasks();

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
