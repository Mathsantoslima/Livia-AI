import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import WhatsAppInstance from "../components/WhatsAppInstance";
import axios from "axios";

const WhatsAppPage = () => {
  const [instance, setInstance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  // Função para mostrar notificação temporária
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Buscar status do WhatsApp do servidor Baileys
  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError("");

      // Verificar se nosso servidor Baileys está funcionando
      const baileysUrl = "http://localhost:8080/status";

      const response = await axios.get(baileysUrl);

      if (response.data && response.data.status === "success") {
        const data = response.data.data;

        setInstance({
          state: data.connection,
          connected: data.connection === "connected",
          number: data.phone || "Aguardando conexão",
          hasQr: data.hasQr,
          qrTime: data.qrTime,
        });

        if (data.connection === "connected") {
          showNotification(
            `WhatsApp conectado - Número: ${data.phone}`,
            "success"
          );
        } else if (data.connection === "qr") {
          showNotification(
            "QR Code gerado - Escaneie com seu WhatsApp",
            "info"
          );
        }
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err) {
      console.error("Erro ao buscar status do WhatsApp:", err);
      setError(
        "Servidor Baileys offline. Execute: node baileys-whatsapp-server.js na porta 8080"
      );
      setInstance({
        state: "disconnected",
        connected: false,
        number: "Servidor offline",
        hasQr: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar status ao carregar a página
  useEffect(() => {
    fetchStatus();
    // Configurar intervalo para atualizar o status a cada 10 segundos
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Atualizar status da instância
  const handleStatusChange = (newStatus, number) => {
    setInstance((prev) => ({
      ...prev,
      state: newStatus,
      connected: newStatus === "CONNECTED",
      number: number || prev.number,
    }));

    const statusText = newStatus === "CONNECTED" ? "Conectado" : "Desconectado";
    showNotification(
      `Status alterado para ${statusText}`,
      newStatus === "CONNECTED" ? "success" : "warning"
    );
  };

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gerenciamento de WhatsApp
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Conecte seu WhatsApp para comunicação com os pacientes.
        </Typography>
      </Box>

      {/* Mensagem de alerta sobre ambiente real */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Sistema WhatsApp:</strong> Esta interface conecta diretamente ao
        WhatsApp Web. Todas as mensagens são processadas em tempo real e salvas
        no banco de dados com análise automática.
      </Alert>

      {/* Status do servidor */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Erro:</strong> {error}
          </Typography>
          <Box mt={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchStatus}
              disabled={loading}
            >
              Tentar Novamente
            </Button>
          </Box>
        </Alert>
      )}

      {/* Lista de instâncias */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Status do WhatsApp
        </Typography>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 6,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Verificando status...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            {instance && (
              <WhatsAppInstance
                instance={instance}
                onStatusChange={handleStatusChange}
                onRefresh={fetchStatus}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Notificação */}
      {notification.show && (
        <Alert
          severity={notification.type}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1300,
            minWidth: 300,
          }}
        >
          {notification.message}
        </Alert>
      )}
    </Container>
  );
};

export default WhatsAppPage;
