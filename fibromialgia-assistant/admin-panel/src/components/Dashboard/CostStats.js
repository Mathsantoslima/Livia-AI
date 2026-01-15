import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CostStats = ({ costStats }) => {
  if (!costStats || !costStats.summary) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhuma estatística de custo disponível
      </div>
    );
  }

  const { summary, projected, daily } = costStats || {};

  const formatCurrency = (value) => {
    if (!value || value === 0) return "$0.0000";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  // Preparar dados do gráfico
  const chartData = summary?.total
    ? Object.entries(summary.total)
        .filter(([key]) => key !== "all")
        .map(([provider, cost]) => ({
          provider: provider.charAt(0).toUpperCase() + provider.slice(1),
          cost: typeof cost === "number" ? cost : 0,
        }))
    : [];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Estatísticas de Custo
      </h3>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Custo Total</div>
          <div className="text-2xl font-bold text-gray-800">
            {formatCurrency(summary?.total?.all || summary?.total || 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Projeção Mensal</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(projected?.monthly || 0)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="text-sm text-gray-600 mb-1">Custo Hoje</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary?.today || daily?.today || 0)}
          </div>
        </div>
      </div>

      {/* Gráfico de Custos por Provider */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h4 className="text-md font-semibold text-gray-700 mb-4">
            Custo por Provider
          </h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="provider" />
              <YAxis tickFormatter={(value) => `$${value.toFixed(4)}`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="cost" fill="#3b82f6" name="Custo (USD)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela Detalhada */}
      {summary?.total && Object.keys(summary.total).filter(key => key !== "all").length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-md font-semibold text-gray-700">
              Detalhamento por Provider
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Total
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Custo Hoje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(summary.total)
                  .filter(([key]) => key !== "all")
                  .map(([provider, cost]) => (
                    <tr key={provider}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                        {provider}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(typeof cost === "number" ? cost : 0)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(
                          summary?.today?.[provider] || daily?.[provider] || 0
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostStats;
