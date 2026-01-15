import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import supabaseService from "../services/supabaseService";
import AIDashboard from "../components/Dashboard/AIDashboard";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const DashboardPage = () => {
  const [stats, setStats] = useState({});
  const [sentimentData, setSentimentData] = useState([]);
  const [messagesTrend, setMessagesTrend] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [suggestionStats, setSuggestionStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardStats, sentiment, trends, heatmap, suggestions] =
        await Promise.all([
          supabaseService.getDashboardStats(),
          supabaseService.getSentimentAnalysis(timeRange),
          supabaseService.getMessageTrends(timeRange),
          supabaseService.getHeatmapData(timeRange),
          supabaseService.getSuggestionStats(timeRange),
        ]);

      setStats(dashboardStats);
      setSentimentData(processSentimentData(sentiment));
      setMessagesTrend(trends);
      setHeatmapData(heatmap);
      setSuggestionStats(suggestions);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const processSentimentData = (data) => {
    const sentimentCount = data.reduce((acc, item) => {
      acc[item.classificacao_sentimento] =
        (acc[item.classificacao_sentimento] || 0) + item.total;
      return acc;
    }, {});

    return Object.entries(sentimentCount).map(([name, value]) => ({
      name: name || "Indefinido",
      value,
      color: getSentimentColor(name),
    }));
  };

  const getSentimentColor = (sentiment) => {
    const colors = {
      positive: "#00C49F",
      negative: "#FF8042",
      neutral: "#FFBB28",
      mixed: "#8884D8",
    };
    return colors[sentiment] || "#gray";
  };

  const formatHeatmapData = () => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return hours.map((hour) => {
      const hourData = { hour: `${hour}h` };
      days.forEach((day, dayIndex) => {
        hourData[day] = heatmapData[dayIndex] ? heatmapData[dayIndex][hour] : 0;
      });
      return hourData;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seção de Métricas de IA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🤖 Métricas de Infraestrutura de IA
        </h2>
        <AIDashboard />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Dashboard Analytics - Livia
        </h1>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total de Usuários"
          value={stats.totalUsers || 0}
          icon="👥"
          color="bg-blue-500"
        />
        <StatCard
          title="Usuários Ativos"
          value={stats.activeUsers || 0}
          subtitle={`${(
            (stats.activeUsers / stats.totalUsers) * 100 || 0
          ).toFixed(1)}%`}
          icon="🟢"
          color="bg-green-500"
        />
        <StatCard
          title="Total Mensagens"
          value={stats.totalMessages || 0}
          icon="💬"
          color="bg-purple-500"
        />
        <StatCard
          title="Mensagens Hoje"
          value={stats.todayMessages || 0}
          icon="📩"
          color="bg-orange-500"
        />
        <StatCard
          title="Tempo Médio Resposta"
          value={stats.avgResponseTime || "N/A"}
          icon="⚡"
          color="bg-indigo-500"
        />
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Análise de Sentimentos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Análise de Sentimentos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sentimentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {sentimentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tendência de Mensagens */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tendência de Mensagens</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={messagesTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="mensagens_usuarios"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Usuários"
              />
              <Area
                type="monotone"
                dataKey="mensagens_livia"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Livia"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap de horários de pico */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Horários de Pico de Conversas
        </h3>
        <div className="overflow-x-auto">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={formatHeatmapData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Dom" fill="#8884d8" />
              <Bar dataKey="Seg" fill="#82ca9d" />
              <Bar dataKey="Ter" fill="#ffc658" />
              <Bar dataKey="Qua" fill="#ff7300" />
              <Bar dataKey="Qui" fill="#8dd1e1" />
              <Bar dataKey="Sex" fill="#d084d0" />
              <Bar dataKey="Sáb" fill="#ffb347" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estatísticas de sugestões */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Performance das Sugestões da Livia
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={suggestionStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tipo_sugestao" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Total" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Alertas e notificações */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Alertas do Sistema</h3>
        <div className="space-y-3">
          <Alert
            type="warning"
            message="3 usuários sem atividade há mais de 7 dias"
            action="Ver Usuários Inativos"
          />
          <Alert
            type="info"
            message="Novo padrão detectado: Aumento de sintomas às quintas-feiras"
            action="Ver Análise"
          />
          <Alert
            type="success"
            message="Taxa de engajamento subiu 15% esta semana"
            action="Ver Detalhes"
          />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`${color} rounded-md p-3`}>
            <span className="text-white text-2xl">{icon}</span>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-lg font-medium text-gray-900">
              {typeof value === "number" ? value.toLocaleString() : value}
            </dd>
            {subtitle && <dd className="text-sm text-gray-600">{subtitle}</dd>}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const Alert = ({ type, message, action }) => {
  const colors = {
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`border-l-4 p-4 ${colors[type]}`}>
      <div className="flex justify-between items-center">
        <p className="text-sm">{message}</p>
        <button className="text-sm font-medium underline hover:no-underline">
          {action}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;
