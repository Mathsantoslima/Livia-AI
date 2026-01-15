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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
} from "recharts";
import supabaseService from "../services/supabaseService";

const AnalyticsPage = () => {
  const [globalPatterns, setGlobalPatterns] = useState([]);
  const [sentimentTrends, setSentimentTrends] = useState([]);
  const [checkinStats, setCheckinStats] = useState([]);
  const [suggestionPerformance, setSuggestionPerformance] = useState([]);
  const [engagementData, setEngagementData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      const [patterns, sentiment, checkins, suggestions, engagement, heatmap] =
        await Promise.all([
          supabaseService.getGlobalPatterns(50),
          supabaseService.getSentimentAnalysis(timeRange),
          supabaseService.getGlobalCheckinStats(timeRange),
          supabaseService.getSuggestionStats(timeRange),
          supabaseService.getGlobalEngagementStats(timeRange),
          supabaseService.getHeatmapData(timeRange),
        ]);

      setGlobalPatterns(patterns);
      setSentimentTrends(processSentimentTrends(sentiment));
      setCheckinStats(processCheckinStats(checkins));
      setSuggestionPerformance(suggestions);
      setEngagementData(processEngagementData(engagement));
      setHeatmapData(heatmap);
    } catch (error) {
      console.error("Erro ao carregar analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const processSentimentTrends = (data) => {
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.data;
      if (!acc[date]) {
        acc[date] = {
          data: date,
          positive: 0,
          negative: 0,
          neutral: 0,
          mixed: 0,
        };
      }
      acc[date][item.classificacao_sentimento] = item.total;
      return acc;
    }, {});

    return Object.values(groupedByDate).sort(
      (a, b) => new Date(a.data) - new Date(b.data)
    );
  };

  const processCheckinStats = (data) => {
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.data;
      if (!acc[date]) {
        acc[date] = {
          data: date,
          dor: [],
          humor: [],
          energia: [],
          sono: [],
        };
      }

      if (item.nivel_dor) acc[date].dor.push(item.nivel_dor);
      if (item.nivel_humor) acc[date].humor.push(item.nivel_humor);
      if (item.nivel_energia) acc[date].energia.push(item.nivel_energia);
      if (item.qualidade_sono) acc[date].sono.push(item.qualidade_sono);

      return acc;
    }, {});

    return Object.values(groupedByDate)
      .map((day) => ({
        data: day.data,
        dor_media: day.dor.length
          ? (day.dor.reduce((a, b) => a + b, 0) / day.dor.length).toFixed(1)
          : 0,
        humor_media: day.humor.length
          ? (day.humor.reduce((a, b) => a + b, 0) / day.humor.length).toFixed(1)
          : 0,
        energia_media: day.energia.length
          ? (
              day.energia.reduce((a, b) => a + b, 0) / day.energia.length
            ).toFixed(1)
          : 0,
        sono_media: day.sono.length
          ? (day.sono.reduce((a, b) => a + b, 0) / day.sono.length).toFixed(1)
          : 0,
        total_checkins: day.dor.length,
      }))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  };

  const processEngagementData = (data) => {
    const eventCounts = data.reduce((acc, item) => {
      acc[item.evento] = (acc[item.evento] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(eventCounts).map(([evento, count]) => ({
      evento,
      count,
    }));
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

  const getInsights = () => {
    const insights = [];

    // Análise de padrões mais comuns
    if (globalPatterns.length > 0) {
      const topPattern = globalPatterns[0];
      insights.push({
        type: "pattern",
        title: "Padrão Mais Comum",
        description: `${topPattern.tipo_padrao}: ${topPattern.descricao}`,
        impact: "high",
      });
    }

    // Análise de sentimentos
    const totalSentiments = sentimentTrends.reduce(
      (acc, day) => {
        acc.positive += day.positive || 0;
        acc.negative += day.negative || 0;
        acc.neutral += day.neutral || 0;
        return acc;
      },
      { positive: 0, negative: 0, neutral: 0 }
    );

    const totalMessages =
      totalSentiments.positive +
      totalSentiments.negative +
      totalSentiments.neutral;
    if (totalMessages > 0) {
      const positivePercent = (
        (totalSentiments.positive / totalMessages) *
        100
      ).toFixed(1);
      insights.push({
        type: "sentiment",
        title: "Análise de Humor Geral",
        description: `${positivePercent}% das mensagens têm sentimento positivo`,
        impact: positivePercent > 50 ? "positive" : "negative",
      });
    }

    // Análise de check-ins
    if (checkinStats.length > 0) {
      const avgPain =
        checkinStats.reduce((acc, day) => acc + parseFloat(day.dor_media), 0) /
        checkinStats.length;
      insights.push({
        type: "health",
        title: "Nível Médio de Dor",
        description: `Média de ${avgPain.toFixed(
          1
        )}/10 nos últimos ${timeRange} dias`,
        impact: avgPain > 6 ? "high" : avgPain > 4 ? "medium" : "low",
      });
    }

    return insights;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Inteligência Coletiva - Análise Global
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
            onClick={loadAnalyticsData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Atualizar
          </button>
        </div>
      </div>

      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {getInsights().map((insight, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-2">
              <div
                className={`w-3 h-3 rounded-full mr-3 ${
                  insight.impact === "high"
                    ? "bg-red-500"
                    : insight.impact === "medium"
                    ? "bg-yellow-500"
                    : insight.impact === "positive"
                    ? "bg-green-500"
                    : "bg-blue-500"
                }`}
              ></div>
              <h3 className="text-lg font-semibold text-gray-900">
                {insight.title}
              </h3>
            </div>
            <p className="text-gray-600">{insight.description}</p>
          </div>
        ))}
      </div>

      {/* Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendências de Sentimento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Tendências de Sentimento
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={sentimentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="positive"
                stackId="1"
                stroke="#00C49F"
                fill="#00C49F"
                name="Positivo"
              />
              <Area
                type="monotone"
                dataKey="neutral"
                stackId="1"
                stroke="#FFBB28"
                fill="#FFBB28"
                name="Neutro"
              />
              <Area
                type="monotone"
                dataKey="negative"
                stackId="1"
                stroke="#FF8042"
                fill="#FF8042"
                name="Negativo"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Estatísticas de Check-ins */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Evolução dos Sintomas (Média Global)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={checkinStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="dor_media"
                stroke="#FF8042"
                name="Dor Média"
              />
              <Line
                type="monotone"
                dataKey="humor_media"
                stroke="#00C49F"
                name="Humor Médio"
              />
              <Line
                type="monotone"
                dataKey="energia_media"
                stroke="#FFBB28"
                name="Energia Média"
              />
              <Line
                type="monotone"
                dataKey="sono_media"
                stroke="#8884D8"
                name="Sono Médio"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap de atividade */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Mapa de Calor - Horários de Maior Atividade
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

      {/* Análises adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance das Sugestões */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Performance das Sugestões da Livia
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={suggestionPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tipo_sugestao" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Total de Sugestões" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Eventos de Engajamento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Eventos de Engajamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={engagementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ evento, percent }) =>
                  `${evento} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {engagementData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${index * 45}, 70%, 60%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Padrões Globais */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Padrões Mais Comuns Detectados
        </h3>
        <div className="space-y-3">
          {globalPatterns.slice(0, 10).map((pattern, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 className="font-medium text-gray-900">
                  {pattern.tipo_padrao}
                </h4>
                <p className="text-sm text-gray-600">{pattern.descricao}</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-indigo-600">
                  {pattern.count}
                </span>
                <p className="text-xs text-gray-500">ocorrências</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
