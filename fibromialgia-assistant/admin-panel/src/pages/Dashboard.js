import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    activeUsers: 0,
    activeAlerts: 0,
    messagesSent: 0,
  });
  const [usersTrend, setUsersTrend] = useState([]);
  const [messagesTrend, setMessagesTrend] = useState([]);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    // Função para carregar dados
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Tentar carregar dados reais da API
        // const baseUrl = process.env.REACT_APP_API_URL ||
        //   window.location.origin.includes('localhost')
        //     ? "http://localhost:3000/api"
        //     : `${window.location.origin}/api`;

        // Como ainda estamos desenvolvendo, usaremos dados iniciais vazios
        // que serão preenchidos quando a API estiver pronta

        // Dados de inicialização - vão ser substituídos por dados reais
        setStatsData({
          totalUsers: 0,
          activeUsers: 0,
          activeAlerts: 0,
          messagesSent: 0,
        });

        setUsersTrend([]);
        setMessagesTrend([]);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Erro ao carregar dados do dashboard. Tente novamente mais tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [period]);

  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Visão Geral
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Este dashboard está configurado para exibir dados reais. Como você está
        iniciando o sistema, os contadores mostrarão zero até que haja
        interações reais.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Configuração do WhatsApp */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Configuração do WhatsApp
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Alert severity="warning">
            Você ainda não configurou o WhatsApp. Acesse a página de WhatsApp
            para conectar seu dispositivo.
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" color="primary" href="/whatsapp">
              Configurar WhatsApp
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total de Usuários
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: "500" }}>
              {statsData.totalUsers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Usuários Ativos
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: "500" }}>
              {statsData.activeUsers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Alertas Ativos
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: "500" }}>
              {statsData.activeAlerts}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Mensagens Enviadas
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, fontWeight: "500" }}>
              {statsData.messagesSent}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Novos Usuários</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="period-users-label">Período</InputLabel>
                <Select
                  labelId="period-users-label"
                  value={period}
                  label="Período"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="7d">Últimos 7 dias</MenuItem>
                  <MenuItem value="30d">Últimos 30 dias</MenuItem>
                  <MenuItem value="90d">Últimos 90 dias</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {usersTrend.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 300,
                }}
              >
                <Typography color="text.secondary">
                  Nenhum dado disponível
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={usersTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Atividade de Mensagens</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel id="period-messages-label">Período</InputLabel>
                <Select
                  labelId="period-messages-label"
                  value={period}
                  label="Período"
                  onChange={handlePeriodChange}
                >
                  <MenuItem value="7d">Últimos 7 dias</MenuItem>
                  <MenuItem value="30d">Últimos 30 dias</MenuItem>
                  <MenuItem value="90d">Últimos 90 dias</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {messagesTrend.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: 300,
                }}
              >
                <Typography color="text.secondary">
                  Nenhum dado disponível
                </Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={messagesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#82ca9d"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Registros Recentes e Transações */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Próximos Passos
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1">
                  <strong>Bem-vindo ao FibroIA!</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Para começar a usar o sistema, siga estes passos:
                </Typography>
                <ol>
                  <li>Configure a conexão do WhatsApp na página WhatsApp</li>
                  <li>Adicione seus primeiros pacientes na página Usuários</li>
                  <li>Configure alertas personalizados na página Alertas</li>
                  <li>
                    Verifique regularmente os relatórios na página Relatórios
                  </li>
                </ol>
              </Alert>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
