import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  Container,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

// QR Code simulado
const MOCK_QR_CODE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAMAAAC8EZcfAAAA21BMVEUAAAD////7+/vy8vLr6+vj4+Pb29vT09PLy8vDw8O7u7uzs7Orq6ujnZ2bm5uUlJSMjIyEhIR8fHx0dHRsbGxkZGRcXFxUVFRMTExERERCQkI5OTk2NjYzMzMuLi4qKiomJiYiIiIeHh4aGhoWFhYSEhIODg4KCgoGBgb9/Py4q6r18/Pq5OOnl5aNe3todHQmLzAYIiIA//8A9PQA7OwA5OQA3NwA1NQAzMwAxMQAvLwAtLQArKwApKQAnJwAlJQAjIwAhIQAfHwAdHQAbGwAZGQAXFwAVFQATEwAREQAAABN+1IMAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH5QsJDTMHGP+iRwAAAqdJREFUeNrt3FluwjAARmHAEMbgnUaIUJmaoQWJiBkJM05P+x5KL9ALt1h1pMoCieUnCEYxewr+QAAkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQAIkQALsW2vFCRF/HbHcDQfcSUiAFKJ1H/AOuAMOJMG2rSUgGfEOuAMOxE0MoDRiujXgXvqt64wB94Ik2MkToBrzvT4kMR1y//kMkxJROgaS9UsDVnEbUHkYGlEBxhogbXgbUCr9pu8hpUjpD0QSx+qcDYZL33C59E6o3J1uWEtCFPqcO2HSjzLRwQ6lMEWJxKCNjlJ44TsWghxKr9sBLlQBTgRhJC/+OxAWXbzTEYa1ZGrAQgGepAELL0B4AcJ/B4yKKMCLAnjI+uiI1K9E4xc18qPRdDQC1gKYqFfoIzfAicPkRmUv6Zi9SCTZOEznGvBsAKSXY/rOK3UMzNXhpA9MRSCWz59ELWAm9YCoALfDqX86KRnpQE3i/mXqALAATtw/1gOyb+c2gZ3twOy9G5cY0N0OnHnACQGGBDgiwDEBTvqkJ0Blj/cENOG7vQPNd0ESq0U7YHY/JdEXRG6Ap+UdEDmugCcCHD8DE5cv7Br4fQckuyiXwO8fMcSXTIHWFY+Zu0VE+sGx+T44/9xMgE+VG+Dpdrt9rNwAaRf+Urkq6/e7Jycy6HRZ+uuicAIsH5ELJNoCq3J5qywqN0/Zn++yKN0AewHwg5aAJwIcE+BoX4CTQfQAJD8k4K6dvQD7UQIkQAIkQAIkQAIkQAIkQAK8AtxtaWR1a0N+AAAAAElFTkSuQmCC";

const WhatsAppOnboarding = () => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState({
    connected: false,
    state: "DISCONNECTED",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Verificar se já está conectado ao iniciar
    checkInstanceStatus();

    // Se estiver no passo de escaneamento, verificar status periodicamente
    if (activeStep === 2) {
      const interval = setInterval(() => {
        checkInstanceStatus();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [activeStep]);

  // Verificar status da instância (simulado)
  const checkInstanceStatus = () => {
    // Se estiver no passo 2 (escaneamento) e o status ainda for DISCONNECTED
    if (activeStep === 2 && status.state === "DISCONNECTED") {
      // Simular conexão após alguns segundos
      setTimeout(() => {
        setStatus({
          connected: true,
          state: "CONNECTED",
        });
        setActiveStep(3); // Avançar para o passo final
      }, 5000);
    }
    // Se já estava conectado, manter no último passo
    else if (status.connected) {
      setActiveStep(3);
    }
  };

  // Iniciar processo de conexão (simulado)
  const startConnection = () => {
    setLoading(true);
    setError("");

    // Simulação para desenvolvimento
    setTimeout(() => {
      setQrCode(MOCK_QR_CODE);
      setActiveStep(2); // Avançar para o passo de escaneamento
      setLoading(false);
    }, 2000);
  };

  // Reiniciar processo
  const handleReset = () => {
    setActiveStep(0);
    setQrCode("");
    setError("");
    setStatus({
      connected: false,
      state: "DISCONNECTED",
    });
  };

  // Definição dos passos
  const steps = [
    {
      label: "Configuração Inicial",
      description:
        "Iniciaremos a configuração da integração com o WhatsApp para permitir comunicação com seus pacientes.",
    },
    {
      label: "Conectando",
      description:
        "Estamos preparando tudo para a conexão com o WhatsApp. Este processo pode levar alguns instantes.",
    },
    {
      label: "Escaneie o QR Code",
      description:
        "Abra o WhatsApp no seu celular, acesse Configurações > WhatsApp Web e escaneie o código QR exibido abaixo.",
    },
    {
      label: "Conectado com Sucesso",
      description:
        "Sua conexão com WhatsApp foi estabelecida com sucesso! Agora você pode enviar e receber mensagens através do sistema.",
    },
  ];

  // Determinar o status para exibição
  const getConnectionStatusDisplay = () => {
    switch (status.state) {
      case "CONNECTED":
        return {
          label: "Conectado",
          color: theme.palette.success.main,
          icon: (
            <CheckCircleIcon sx={{ fontSize: 20, mr: 1 }} color="success" />
          ),
        };
      case "DISCONNECTED":
        return {
          label: "Desconectado",
          color: theme.palette.error.main,
          icon: <WhatsAppIcon sx={{ fontSize: 20, mr: 1 }} color="error" />,
        };
      default:
        return {
          label: status.state || "Desconhecido",
          color: theme.palette.info.main,
          icon: <WhatsAppIcon sx={{ fontSize: 20, mr: 1 }} color="info" />,
        };
    }
  };

  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          backgroundColor: "white",
          boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Configuração do WhatsApp
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, mt: 4 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            backgroundColor: "rgba(0,0,0,0.02)",
          }}
        >
          <Typography variant="body1" gutterBottom>
            {steps[activeStep].description}
          </Typography>

          {error && (
            <Box
              sx={{
                p: 2,
                mt: 2,
                borderRadius: 1,
                backgroundColor: "#FFF4E5",
                display: "flex",
                alignItems: "center",
              }}
            >
              <ErrorOutlineIcon
                sx={{ color: "#F57C00", mr: 1, fontSize: 20 }}
              />
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            </Box>
          )}

          {activeStep === 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 3,
              }}
            >
              <Button
                variant="contained"
                color="primary"
                onClick={startConnection}
                disabled={loading}
                sx={{ minWidth: 150 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Iniciar Configuração"
                )}
              </Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                mt: 3,
              }}
            >
              <CircularProgress size={60} sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Estabelecendo conexão...
              </Typography>
            </Box>
          )}

          {activeStep === 2 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
                mt: 3,
              }}
            >
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code para conexão WhatsApp"
                  style={{
                    width: 264,
                    height: 264,
                    border: "10px solid white",
                    borderRadius: 4,
                  }}
                />
              ) : (
                <CircularProgress size={60} />
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Aguardando escaneamento...
              </Typography>
            </Box>
          )}

          {activeStep === 3 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mt: 3,
              }}
            >
              <CheckCircleIcon
                sx={{ fontSize: 60, color: "success.main", mb: 2 }}
              />
              <Typography variant="body1" sx={{ mb: 2 }}>
                Telefone conectado: <strong>+5511******1234</strong>
              </Typography>
              <Button variant="outlined" onClick={handleReset}>
                Reiniciar Configuração
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default WhatsAppOnboarding;
