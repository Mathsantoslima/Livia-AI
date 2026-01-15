import React, { useState, useEffect } from "react";
import apiService from "../../services/apiService";
import ProviderStats from "./ProviderStats";
import CostStats from "./CostStats";

const AIDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [costStats, setCostStats] = useState(null);
  const [providerStats, setProviderStats] = useState(null);
  const [period, setPeriod] = useState("24h");

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Carregar dados do dashboard, custos e providers em paralelo
      const [dashboard, costs, providers] = await Promise.all([
        apiService.getDashboard(period),
        apiService.getCostStats().catch(() => null),
        apiService.getProviderStats().catch(() => null),
      ]);

      setDashboardData(dashboard);
      setCostStats(costs);
      setProviderStats(providers);
    } catch (err) {
      console.error("Erro ao carregar dados do dashboard:", err);
      setError(err.message || "Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando métricas de IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-red-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erro</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadDashboardData}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Seletor de Período */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">
          Dashboard de Métricas de IA
        </h2>
        <div className="flex gap-2">
          {["24h", "7d", "30d"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {p === "24h" ? "Últimas 24h" : p === "7d" ? "Últimos 7 dias" : "Últimos 30 dias"}
            </button>
          ))}
        </div>
      </div>

      {/* Estatísticas dos Providers */}
      {providerStats && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <ProviderStats stats={{ providers: providerStats }} />
        </div>
      )}

      {/* Estatísticas de Custo */}
      {costStats && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <CostStats costStats={costStats} />
        </div>
      )}

      {/* Resumo Geral do Dashboard */}
      {dashboardData && dashboardData.summary && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Resumo Geral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Status</div>
              <div className="text-xl font-bold text-blue-800">
                {dashboardData.summary.status || "Operacional"}
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">Uso Total</div>
              <div className="text-xl font-bold text-green-800">
                {dashboardData.summary.totalUsage || 0}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">Período</div>
              <div className="text-xl font-bold text-purple-800 capitalize">
                {period}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDashboard;
