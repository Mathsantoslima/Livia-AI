import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  Provider as ToastProvider,
  Root as ToastRoot,
  Title as ToastTitle,
  Viewport as ToastViewport,
} from "@radix-ui/react-toast";
import {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Close as DialogClose,
} from "@radix-ui/react-dialog";

export default function WhatsAppConnect() {
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    state: "DISCONNECTED",
  });
  const [testMessage, setTestMessage] = useState({
    phone: "",
    message: "Olá! Esta é uma mensagem de teste do sistema.",
  });
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [isMounted, setIsMounted] = useState(false);

  // Buscar status da conexão
  useEffect(() => {
    setIsMounted(true);
    checkConnectionStatus();
    // Verificar a cada 30 segundos
    const interval = setInterval(checkConnectionStatus, 30000);
    return () => {
      clearInterval(interval);
      setIsMounted(false);
    };
  }, []);

  // Verificar status da conexão
  const checkConnectionStatus = async () => {
    try {
      setLoading(true);

      // Verificar se existe alguma instância principal
      const { data: instances, error: instanceError } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("isPrimary", true)
        .limit(1);

      if (instanceError) throw instanceError;

      // Se não houver instância primária, definir como desconectado
      if (!instances || instances.length === 0) {
        setConnectionStatus({
          connected: false,
          state: "DISCONNECTED",
          timestamp: new Date().toISOString(),
        });
        setLoading(false);
        return;
      }

      // Usar a instância primária para verificar o status
      const primaryInstance = instances[0];

      // Obter status atual da instância
      const { data, error } = await supabase.functions.invoke(
        "whatsapp/status",
        {
          body: { instanceName: primaryInstance.instanceName },
        }
      );

      if (error) throw error;

      if (data) {
        setConnectionStatus({
          connected: data.connected,
          state: data.state,
          number: data.number,
          timestamp: new Date().toISOString(),
          rawState: data.rawState, // Armazenar o estado bruto da Evolution API para debug
        });
      }
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setNotification({
        type: "error",
        message: "Erro ao verificar status da conexão",
      });
    } finally {
      setLoading(false);
    }
  };

  // Obter QR code para conexão
  const getQRCode = async () => {
    try {
      setQrLoading(true);

      // Verificar se existe alguma instância principal
      const { data: instances, error: instanceError } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("isPrimary", true)
        .limit(1);

      if (instanceError) throw instanceError;

      // Se não houver instância primária, criar uma
      let instanceName;

      if (!instances || instances.length === 0) {
        // Criar nova instância principal
        const { data: newInstance, error: createError } = await supabase
          .from("whatsapp_instances")
          .insert([
            {
              instanceName: "primary",
              state: "DISCONNECTED",
              connected: false,
              isPrimary: true,
            },
          ])
          .select();

        if (createError) throw createError;
        instanceName = newInstance[0].instanceName;
      } else {
        instanceName = instances[0].instanceName;
      }

      // Obter QR code para a instância
      const { data, error } = await supabase.functions.invoke(
        "whatsapp/connect",
        {
          body: { instanceName },
        }
      );

      if (error) throw error;

      if (data && data.qrcode) {
        setQrCode(data.qrcode);
        // Iniciar verificação de status mais frequente durante a conexão
        const statusInterval = setInterval(checkConnectionStatus, 5000);
        // Limpar o intervalo após 2 minutos (tempo suficiente para escanear o QR)
        setTimeout(() => {
          clearInterval(statusInterval);
        }, 120000);
      } else {
        setNotification({
          type: "error",
          message: "QR code não disponível. Tente novamente.",
        });
      }
    } catch (error) {
      console.error("Erro ao obter QR code:", error);
      setNotification({
        type: "error",
        message: `Erro ao obter QR code: ${error.message}`,
      });
    } finally {
      setQrLoading(false);
    }
  };

  // Enviar mensagem de teste
  const sendTestMessage = async () => {
    try {
      if (!testMessage.phone || !testMessage.message) {
        setNotification({
          type: "error",
          message: "Telefone e mensagem são obrigatórios",
        });
        return;
      }

      setTestSending(true);

      // Verificar se existe alguma instância principal
      const { data: instances, error: instanceError } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .eq("isPrimary", true)
        .limit(1);

      if (instanceError) throw instanceError;

      if (!instances || instances.length === 0) {
        setNotification({
          type: "error",
          message: "Nenhuma instância principal configurada",
        });
        return;
      }

      const instanceName = instances[0].instanceName;

      // Enviar mensagem de teste usando a instância principal
      const { data, error } = await supabase.functions.invoke(
        "whatsapp/send-message",
        {
          body: {
            instanceName,
            phone: testMessage.phone,
            message: testMessage.message,
          },
        }
      );

      if (error) throw error;

      if (data && data.status === "success") {
        setNotification({
          type: "success",
          message: "Mensagem de teste enviada com sucesso!",
        });
      } else {
        setNotification({
          type: "error",
          message: data?.message || "Erro ao enviar mensagem de teste",
        });
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem de teste:", error);
      setNotification({
        type: "error",
        message: `Erro ao enviar mensagem: ${error.message}`,
      });
    } finally {
      setTestSending(false);
    }
  };

  // Componente de notificação
  const NotificationToast = ({ type, message }) => {
    if (!message) return null;

    return (
      <ToastRoot
        className={`fixed bottom-4 right-4 p-4 rounded-md shadow-md z-50 ${
          type === "success" ? "bg-green-600" : "bg-red-600"
        } text-white flex items-center gap-2 min-w-[300px]`}
      >
        <ToastTitle>{message}</ToastTitle>
      </ToastRoot>
    );
  };

  // Exibir notificação e limpar após 5 segundos
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ type: "", message: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.message]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Conexão com WhatsApp</h2>

      <div className="flex items-center mb-6 justify-between">
        <div className="flex items-center">
          <div
            className={`w-4 h-4 rounded-full ${
              connectionStatus.connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="ml-2">
            Status:{" "}
            <span
              className={
                connectionStatus.connected
                  ? "text-green-600 font-medium"
                  : "text-red-600 font-medium"
              }
            >
              {connectionStatus.connected ? "Conectado" : "Desconectado"}
            </span>
          </span>
        </div>

        <div className="flex items-center">
          {!loading && (
            <button
              onClick={checkConnectionStatus}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded mr-2"
            >
              Atualizar
            </button>
          )}

          <DialogRoot>
            <DialogTrigger className="btn-primary text-sm">
              {connectionStatus.connected
                ? "Enviar Mensagem de Teste"
                : "Conectar WhatsApp"}
            </DialogTrigger>
            {isMounted && (
              <DialogPortal>
                <DialogOverlay className="radix-dialog-overlay" />
                <DialogContent className="radix-dialog-content max-w-md w-full">
                  <DialogTitle className="radix-dialog-title">
                    {connectionStatus.connected
                      ? "Enviar Mensagem de Teste"
                      : "Conectar WhatsApp"}
                  </DialogTitle>

                  {connectionStatus.connected ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Telefone (com DDD)
                        </label>
                        <input
                          type="text"
                          value={testMessage.phone}
                          onChange={(e) =>
                            setTestMessage({
                              ...testMessage,
                              phone: e.target.value,
                            })
                          }
                          placeholder="Ex: 11999998888"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Mensagem
                        </label>
                        <textarea
                          value={testMessage.message}
                          onChange={(e) =>
                            setTestMessage({
                              ...testMessage,
                              message: e.target.value,
                            })
                          }
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <DialogClose className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                          Cancelar
                        </DialogClose>
                        <button
                          onClick={sendTestMessage}
                          disabled={testSending}
                          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-blue-400"
                        >
                          {testSending ? "Enviando..." : "Enviar"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {qrLoading ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                          <p className="mt-2 text-gray-600">
                            Gerando QR Code...
                          </p>
                        </div>
                      ) : qrCode ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={qrCode}
                            alt="QR Code para conexão do WhatsApp"
                            className="max-w-full"
                          />
                          <p className="text-sm text-gray-600 mt-2">
                            Escaneie este QR Code com seu WhatsApp
                          </p>
                        </div>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-gray-600 mb-4">
                            Clique em "Gerar QR Code" para conectar seu WhatsApp
                          </p>
                          <button
                            onClick={getQRCode}
                            className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                          >
                            Gerar QR Code
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <DialogClose className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                          Fechar
                        </DialogClose>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </DialogPortal>
            )}
          </DialogRoot>
        </div>
      </div>

      {connectionStatus.connected && connectionStatus.number && (
        <div className="mb-4 text-sm text-gray-600">
          <p>
            <strong>Número conectado:</strong> {connectionStatus.number}
          </p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        <p>
          Última verificação:{" "}
          {connectionStatus.timestamp
            ? new Date(connectionStatus.timestamp).toLocaleString()
            : "Nunca"}
        </p>
      </div>

      <ToastProvider swipeDirection="right">
        <NotificationToast
          type={notification.type}
          message={notification.message}
        />
        <ToastViewport />
      </ToastProvider>
    </div>
  );
}
