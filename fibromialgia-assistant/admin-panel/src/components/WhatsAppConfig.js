import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  TextField,
  Typography,
  Alert,
  Paper,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import QRCode from "qrcode.react";
import axios from "axios";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import ReplayIcon from "@mui/icons-material/Replay";

// URL base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const WhatsAppConfig = () => {
  // Estados para gerenciar a instância do WhatsApp
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [instanceStatus, setInstanceStatus] = useState("disconnected");
  const [instanceName, setInstanceName] = useState("fibromialgia");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [eventLog, setEventLog] = useState([]);

  // Função para adicionar evento ao log
  const addEvent = (type, message) => {
    const newEvent = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString(),
    };

    setEventLog((prevEvents) => [newEvent, ...prevEvents].slice(0, 10));
  };

  // Efeito para carregar o status inicial e configurar temporizador
  useEffect(() => {
    // Carregar o status inicial
    checkInstanceStatus();

    // Configurar verificação periódica de status (a cada 5 segundos)
    const interval = setInterval(() => {
      checkInstanceStatus(false); // false para não adicionar ao log a cada verificação periódica
    }, 5000);

    setStatusCheckInterval(interval);
    addEvent("info", "Iniciando configuração do WhatsApp");

    // Limpeza ao desmontar o componente
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [checkInstanceStatus, statusCheckInterval]);

  // Função para criar instância
  const createInstance = async () => {
    try {
      setLoading(true);
      setError("");
      addEvent("info", `Criando instância "${instanceName}"...`);

      const response = await axios.post(`${API_BASE_URL}/api/instances`, {
        instanceName,
        webhookUrl: webhookUrl || null,
      });

      setSuccess("Instância criada com sucesso!");
      setShowSnackbar(true);
      addEvent("success", `Instância "${instanceName}" criada com sucesso`);
      connectInstance();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erro ao criar instância";
      setError(errorMsg);
      setShowSnackbar(true);
      addEvent("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função para conectar instância
  const connectInstance = async () => {
    try {
      setLoading(true);
      setError("");
      addEvent("info", `Conectando instância "${instanceName}"...`);

      await axios.post(`${API_BASE_URL}/api/instances/${instanceName}/connect`);

      // Após conectar, precisamos verificar o QR code
      getQrCode();
      setSuccess("Conexão iniciada. Escaneie o QR code.");
      setShowSnackbar(true);
      addEvent(
        "success",
        "Conexão iniciada. Aguardando escaneamento do QR code"
      );
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Erro ao conectar instância";
      setError(errorMsg);
      setShowSnackbar(true);
      addEvent("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função para obter o QR code
  const getQrCode = async () => {
    try {
      setLoading(true);
      setError("");
      addEvent("info", "Obtendo QR code...");

      const response = await axios.get(
        `${API_BASE_URL}/api/instances/${instanceName}/qrcode`
      );

      if (response.data.status === "success" && response.data.data.qrcode) {
        setQrCodeData(response.data.data.qrcode);
        addEvent(
          "success",
          "QR code gerado com sucesso. Escaneie com seu celular"
        );
      } else {
        setError("QR code não disponível");
        setShowSnackbar(true);
        addEvent("error", "QR code não disponível");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Erro ao obter QR code";
      setError(errorMsg);
      setShowSnackbar(true);
      addEvent("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar o status da instância
  const checkInstanceStatus = async (logEvent = true) => {
    try {
      if (logEvent) {
        addEvent(
          "info",
          `Verificando status da instância "${instanceName}"...`
        );
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/instances/${instanceName}/status`
      );

      if (response.data.status === "success") {
        const newStatus = response.data.data.state;

        // Se o status mudou, registramos o evento
        if (newStatus !== instanceStatus) {
          setInstanceStatus(newStatus);

          if (newStatus === "open") {
            setQrCodeData("");
            if (logEvent) {
              addEvent("success", "WhatsApp conectado com sucesso!");
            }
          } else if (logEvent) {
            addEvent("info", `Status alterado para: ${newStatus}`);
          }
        }
      }
    } catch (err) {
      console.error("Erro ao verificar status:", err);
      // Não exibimos erro no snackbar para não interromper o usuário
      if (logEvent) {
        addEvent("error", "Erro ao verificar status da instância");
      }
    }
  };

  // Função para desconectar instância
  const disconnectInstance = async () => {
    try {
      setLoading(true);
      setError("");
      addEvent("info", `Desconectando instância "${instanceName}"...`);

      await axios.post(
        `${API_BASE_URL}/api/instances/${instanceName}/disconnect`
      );

      setInstanceStatus("disconnected");
      setQrCodeData("");
      setSuccess("Instância desconectada com sucesso");
      setShowSnackbar(true);
      addEvent("success", "Instância desconectada com sucesso");
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Erro ao desconectar instância";
      setError(errorMsg);
      setShowSnackbar(true);
      addEvent("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função para reiniciar instância
  const restartInstance = async () => {
    try {
      setLoading(true);
      setError("");
      addEvent("info", `Reiniciando instância "${instanceName}"...`);

      await axios.post(`${API_BASE_URL}/api/instances/${instanceName}/restart`);

      setSuccess("Instância reiniciada com sucesso");
      setShowSnackbar(true);
      addEvent("success", "Instância reiniciada com sucesso");

      // Após reiniciar, atualizar status
      setTimeout(() => {
        checkInstanceStatus();
        getQrCode();
      }, 2000);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Erro ao reiniciar instância";
      setError(errorMsg);
      setShowSnackbar(true);
      addEvent("error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função para fechar o snackbar
  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  // Renderizar o status da instância com cor correspondente
  const renderStatus = () => {
    let color = "info.main";
    let statusText = "Desconhecido";

    switch (instanceStatus) {
      case "open":
        color = "success.main";
        statusText = "Conectado";
        break;
      case "connecting":
        color = "warning.main";
        statusText = "Conectando";
        break;
      case "disconnected":
        color = "error.main";
        statusText = "Desconectado";
        break;
      case "restarting":
        color = "warning.main";
        statusText = "Reiniciando";
        break;
      default:
        color = "info.main";
        statusText = instanceStatus || "Desconhecido";
    }

    return (
      <Typography variant="h6" color={color}>
        Status: {statusText}
      </Typography>
    );
  };

  // Renderizar ícone de acordo com o tipo de evento
  const renderEventIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircleIcon color="success" />;
      case "error":
        return <ErrorIcon color="error" />;
      case "info":
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="info" />;
    }
  };

  // Formatar a data do evento
  const formatEventTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch (e) {
      return "";
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Configuração do WhatsApp
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Configurar Instância
            </Typography>

            <TextField
              fullWidth
              label="Nome da Instância"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              margin="normal"
              disabled={loading || instanceStatus === "open"}
              helperText="Nome único para identificar esta instância"
            />

            <TextField
              fullWidth
              label="URL do Webhook (opcional)"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              margin="normal"
              disabled={loading}
              helperText="URL para receber notificações de mensagens"
            />

            <Box mt={3} display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                color="primary"
                onClick={createInstance}
                disabled={loading || !instanceName || instanceStatus === "open"}
              >
                {loading ? <CircularProgress size={24} /> : "Criar Instância"}
              </Button>

              <Button
                variant="contained"
                color="secondary"
                onClick={connectInstance}
                disabled={loading || !instanceName || instanceStatus === "open"}
              >
                Conectar
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={disconnectInstance}
                disabled={
                  loading || !instanceName || instanceStatus === "disconnected"
                }
              >
                Desconectar
              </Button>

              <Button
                variant="outlined"
                onClick={restartInstance}
                disabled={loading || !instanceName}
              >
                Reiniciar
              </Button>
            </Box>

            <Box mt={3}>{renderStatus()}</Box>

            {instanceStatus === "open" && (
              <Alert severity="success" sx={{ mt: 2 }}>
                WhatsApp conectado com sucesso! O assistente está pronto para
                enviar e receber mensagens.
              </Alert>
            )}

            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Histórico de Eventos
                <Button
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={() => checkInstanceStatus()}
                  sx={{ ml: 2 }}
                >
                  Atualizar
                </Button>
              </Typography>

              <Paper
                variant="outlined"
                sx={{ maxHeight: 200, overflow: "auto" }}
              >
                {eventLog.length > 0 ? (
                  <List dense>
                    {eventLog.map((event) => (
                      <ListItem key={event.id}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {renderEventIcon(event.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={event.message}
                          secondary={formatEventTime(event.timestamp)}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box p={2} textAlign="center">
                    <Typography color="text.secondary">
                      Nenhum evento registrado
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              QR Code
            </Typography>

            <Paper
              elevation={3}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                p: 3,
                minHeight: 300,
                bgcolor: "grey.100",
              }}
            >
              {loading ? (
                <CircularProgress />
              ) : qrCodeData ? (
                <>
                  <QRCode value={qrCodeData} size={256} />
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Escaneie este QR code com o WhatsApp no seu celular
                  </Typography>
                </>
              ) : instanceStatus === "open" ? (
                <Alert severity="success" sx={{ width: "100%" }}>
                  WhatsApp já está conectado. Não é necessário escanear o QR
                  code.
                </Alert>
              ) : (
                <Box textAlign="center">
                  <Typography variant="subtitle1" color="text.secondary">
                    Nenhum QR code disponível
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={getQrCode}
                    sx={{ mt: 2 }}
                    disabled={loading || instanceStatus === "open"}
                  >
                    Gerar QR Code
                  </Button>
                </Box>
              )}
            </Paper>

            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Para conectar o WhatsApp, clique em "Conectar" e depois escaneie
                o QR code com o aplicativo WhatsApp no seu celular. Mantenha
                esta janela aberta durante o processo.
              </Typography>
            </Box>

            <Box mt={4}>
              <Alert severity="info">
                <Typography variant="subtitle2">
                  Passos para conectar:
                </Typography>
                <ol style={{ marginTop: 8, paddingLeft: 16 }}>
                  <li>
                    Clique em "Criar Instância" (se esta for a primeira
                    configuração)
                  </li>
                  <li>Clique em "Conectar" para iniciar o processo</li>
                  <li>Escaneie o QR code com o WhatsApp no seu celular</li>
                  <li>Aguarde o status mudar para "Conectado"</li>
                </ol>
              </Alert>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default WhatsAppConfig;
