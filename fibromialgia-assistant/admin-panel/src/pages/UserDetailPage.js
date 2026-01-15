import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import supabaseService from "../services/supabaseService";

const UserDetailPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [sentimentHistory, setSentimentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      const [
        userData,
        messagesData,
        checkinsData,
        patternsData,
        suggestionsData,
        sentimentData,
      ] = await Promise.all([
        supabaseService.getUserById(userId),
        supabaseService.getUserMessages(userId, 100),
        supabaseService.getUserCheckins(userId),
        supabaseService.getUserPatterns(userId),
        supabaseService.getUserSuggestions(userId),
        supabaseService.getUserSentimentHistory(userId),
      ]);

      setUser(userData);
      setMessages(messagesData);
      setCheckins(checkinsData);
      setPatterns(patternsData);
      setSuggestions(suggestionsData);
      setSentimentHistory(sentimentData);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-green-100 text-green-800", label: "Ativo" },
      inactive: { color: "bg-yellow-100 text-yellow-800", label: "Inativo" },
      blocked: { color: "bg-red-100 text-red-800", label: "Bloqueado" },
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
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

  const processSentimentData = () => {
    const sentimentCount = sentimentHistory.reduce((acc, item) => {
      acc[item.classificacao_sentimento] =
        (acc[item.classificacao_sentimento] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(sentimentCount).map(([name, value]) => ({
      name: name || "Indefinido",
      value,
      fill: getSentimentColor(name),
    }));
  };

  const processCheckinTrends = () => {
    return checkins
      .map((checkin) => ({
        data: checkin.data,
        dor: checkin.nivel_dor,
        humor: checkin.nivel_humor,
        energia: checkin.nivel_energia,
        sono: checkin.qualidade_sono,
      }))
      .reverse();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Usuário não encontrado.</p>
        <button
          onClick={() => navigate("/users")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Voltar para Usuários
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/users")}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Voltar
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.name || "Usuário sem nome"}
          </h1>
          {getStatusBadge(user.status)}
        </div>
        <button
          onClick={loadUserData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Atualizar
        </button>
      </div>

      {/* Informações básicas */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Telefone</h3>
            <p className="text-lg font-semibold text-gray-900">{user.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Primeiro Contato
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(user.primeiro_contato)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Último Contato
            </h3>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(user.ultimo_contato)}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Engajamento</h3>
            <p className="text-lg font-semibold text-gray-900">
              {(user.nivel_engajamento * 100 || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Total de Mensagens
          </h3>
          <p className="text-2xl font-bold text-purple-600">
            {messages.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Check-ins Realizados
          </h3>
          <p className="text-2xl font-bold text-blue-600">{checkins.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Padrões Detectados
          </h3>
          <p className="text-2xl font-bold text-green-600">{patterns.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">
            Sugestões Recebidas
          </h3>
          <p className="text-2xl font-bold text-orange-600">
            {suggestions.length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: "overview", label: "Visão Geral" },
              { id: "messages", label: "Mensagens" },
              { id: "checkins", label: "Check-ins" },
              { id: "patterns", label: "Padrões" },
              { id: "suggestions", label: "Sugestões" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Análise de Sentimentos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Análise de Sentimentos
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={processSentimentData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        dataKey="value"
                      >
                        {processSentimentData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Tendências de Check-ins */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Evolução dos Sintomas
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={processCheckinTrends()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="data" />
                      <YAxis domain={[0, 10]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="dor"
                        stroke="#FF8042"
                        name="Dor"
                      />
                      <Line
                        type="monotone"
                        dataKey="humor"
                        stroke="#00C49F"
                        name="Humor"
                      />
                      <Line
                        type="monotone"
                        dataKey="energia"
                        stroke="#FFBB28"
                        name="Energia"
                      />
                      <Line
                        type="monotone"
                        dataKey="sono"
                        stroke="#8884D8"
                        name="Sono"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "messages" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Histórico de Mensagens</h3>
              <div className="max-h-96 overflow-y-auto space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.tipo === "user"
                        ? "bg-blue-50 border-l-4 border-blue-500"
                        : "bg-green-50 border-l-4 border-green-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span
                        className={`text-sm font-medium ${
                          message.tipo === "user"
                            ? "text-blue-700"
                            : "text-green-700"
                        }`}
                      >
                        {message.tipo === "user" ? "Usuário" : "Livia"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-800">{message.mensagem}</p>
                    {message.classificacao_sentimento && (
                      <div className="mt-2 flex space-x-2">
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          Sentimento: {message.classificacao_sentimento}
                        </span>
                        {message.categoria && (
                          <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                            Categoria: {message.categoria}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "checkins" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Check-ins Diários</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Dor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Humor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Energia
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sono
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Sintomas
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {checkins.map((checkin) => (
                      <tr key={checkin.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(checkin.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {checkin.nivel_dor}/10
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {checkin.nivel_humor}/5
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {checkin.nivel_energia}/5
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {checkin.qualidade_sono}/5
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {checkin.sintomas?.join(", ") || "Nenhum"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "patterns" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Padrões Detectados</h3>
              <div className="space-y-3">
                {patterns.map((pattern) => (
                  <div key={pattern.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">
                        {pattern.tipo_padrao}
                      </h4>
                      <span className="text-sm text-gray-500">
                        Relevância: {(pattern.relevancia * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-gray-700">{pattern.descricao}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Última ocorrência: {formatDate(pattern.ultima_ocorrencia)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "suggestions" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Sugestões da Livia</h3>
              <div className="space-y-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-gray-50 p-4 rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900">
                        {suggestion.tipo_sugestao}
                      </h4>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          suggestion.feedback === "aceita"
                            ? "bg-green-100 text-green-800"
                            : suggestion.feedback === "rejeitada"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {suggestion.feedback || "Sem resposta"}
                      </span>
                    </div>
                    <p className="text-gray-700">{suggestion.conteudo}</p>
                    <div className="mt-2 text-xs text-gray-500">
                      Sugerido em: {formatDate(suggestion.data_sugestao)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;
