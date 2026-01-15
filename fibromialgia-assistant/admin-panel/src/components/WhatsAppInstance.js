import React, { useState, useEffect } from "react";
import axios from "axios";

// Componente limpo e simples para gerenciar WhatsApp
const WhatsAppInstance = ({ instance, onStatusChange, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState("");

  // URL da API
  const API_BASE = "http://localhost:8080";

  // Buscar QR Code
  const fetchQRCode = async () => {
    try {
      setError("");
      const response = await axios.get(`${API_BASE}/qr`);
      if (response.data.success && response.data.qr) {
        setQrCode(response.data.qr);
        setConnectionStatus("qr");
      }
    } catch (error) {
      setError("Erro ao conectar. Verifique se o sistema está ativo.");
    }
  };

  // Buscar status da conexão
  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE}/status`);
      const data = response.data;

      setConnectionStatus(data.status || "disconnected");
      setPhoneNumber(data.phone || null);
      setError("");

      if (data.status === "qr" && data.qr_available && !qrCode) {
        fetchQRCode();
      } else if (data.status === "connected") {
        setQrCode(null);
      }

      if (onStatusChange) {
        onStatusChange(
          data.connected ? "CONNECTED" : "DISCONNECTED",
          data.phone
        );
      }
    } catch (error) {
      setConnectionStatus("disconnected");
      setError("Sistema WhatsApp offline");
    }
  };

  // Conectar WhatsApp
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError("");
      setConnectionStatus("connecting");

      await axios.post(`${API_BASE}/connect`);
      setTimeout(fetchQRCode, 2000);
    } catch (error) {
      setError("Erro ao conectar WhatsApp");
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  // Desconectar WhatsApp
  const handleDisconnect = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/logout`);

      setConnectionStatus("disconnected");
      setPhoneNumber(null);
      setQrCode(null);

      if (onStatusChange) onStatusChange("DISCONNECTED", null);
    } catch (error) {
      setError("Erro ao desconectar");
    } finally {
      setLoading(false);
    }
  };

  // Polling para atualizar status
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = connectionStatus === "connected";
  const isConnecting =
    connectionStatus === "connecting" || connectionStatus === "reconnecting";
  const needsQR = connectionStatus === "qr";

  return (
    <div className="bg-white p-6 rounded-lg shadow border">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div
            className={`w-4 h-4 rounded-full mr-3 ${
              isConnected
                ? "bg-green-500"
                : needsQR || isConnecting
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
          />
          <div>
            <h3 className="text-xl font-semibold text-gray-800">WhatsApp</h3>
            <p className="text-sm text-gray-600">
              {isConnected
                ? `Conectado ${phoneNumber ? `• ${phoneNumber}` : ""}`
                : isConnecting
                ? "Conectando..."
                : needsQR
                ? "Aguardando escaneamento"
                : "Desconectado"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {!isConnected && !isConnecting && (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              Conectar
            </button>
          )}

          {(isConnected || needsQR) && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 font-medium"
            >
              Desconectar
            </button>
          )}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* QR Code */}
      {needsQR && (
        <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-medium mb-4 text-blue-800">
            Escaneie com seu WhatsApp
          </h4>

          {qrCode ? (
            <div>
              <div className="inline-block p-3 bg-white rounded-lg shadow-sm">
                <img src={qrCode} alt="QR Code" className="w-56 h-56" />
              </div>
              <p className="mt-3 text-sm text-blue-700">
                Use a câmera do WhatsApp para escanear
              </p>
            </div>
          ) : (
            <div className="py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3"></div>
              <p className="text-blue-700">Gerando código...</p>
            </div>
          )}
        </div>
      )}

      {/* Conectando */}
      {isConnecting && (
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mx-auto mb-3"></div>
          <p className="text-yellow-800">Estabelecendo conexão...</p>
        </div>
      )}

      {/* Conectado */}
      {isConnected && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✓</span>
            WhatsApp conectado e funcionando
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppInstance;
