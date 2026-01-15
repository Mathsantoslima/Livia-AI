import React from "react";

const ProviderStats = ({ stats }) => {
  if (!stats || !stats.providers) {
    return (
      <div className="text-center text-gray-500 py-8">
        Nenhuma estatística de provider disponível
      </div>
    );
  }

  const providers = stats.providers;

  const getHealthColor = (isHealthy) => {
    return isHealthy ? "text-green-600" : "text-red-600";
  };

  const getHealthBadge = (isHealthy) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${
          isHealthy
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {isHealthy ? "Ativo" : "Inativo"}
      </span>
    );
  };

  const formatLatency = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSuccessRate = (success, total) => {
    if (total === 0) return "0%";
    return `${((success / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Estatísticas dos Providers
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(providers).map(([providerName, providerStats]) => (
          <div
            key={providerName}
            className="bg-white rounded-lg shadow p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 capitalize">
                {providerName}
              </h4>
              {getHealthBadge(providerStats.healthy)}
            </div>

            <div className="space-y-2 text-sm">
              {providerStats.model && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Modelo:</span>
                  <span className="font-medium">{providerStats.model}</span>
                </div>
              )}

              {providerStats.successRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Sucesso:</span>
                  <span className="font-medium">
                    {typeof providerStats.successRate === "number"
                      ? `${(providerStats.successRate * 100).toFixed(1)}%`
                      : providerStats.successRate}
                  </span>
                </div>
              )}

              {providerStats.avgLatency !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Latência Média:</span>
                  <span className="font-medium">
                    {formatLatency(
                      typeof providerStats.avgLatency === "number"
                        ? providerStats.avgLatency
                        : parseFloat(providerStats.avgLatency) || 0
                    )}
                  </span>
                </div>
              )}

              {providerStats.configured !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Configurado:</span>
                  <span
                    className={`font-medium ${
                      providerStats.configured ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {providerStats.configured ? "Sim" : "Não"}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProviderStats;
