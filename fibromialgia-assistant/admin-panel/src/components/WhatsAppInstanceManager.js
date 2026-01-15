import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Close as DialogClose,
} from "@radix-ui/react-dialog";
import {
  Provider as ToastProvider,
  Root as ToastRoot,
  Title as ToastTitle,
  Viewport as ToastViewport,
} from "@radix-ui/react-toast";

export default function WhatsAppInstanceManager() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchInstances();
    return () => setIsMounted(false);
  }, []);

  // Buscar todas as instâncias
  const fetchInstances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("whatsapp_instances")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error("Erro ao buscar instâncias:", error);
      setNotification({
        type: "error",
        message: "Erro ao buscar instâncias",
      });
    } finally {
      setLoading(false);
    }
  };

  // Criar nova instância
  const createInstance = async () => {
    try {
      if (!newInstanceName.trim()) {
        setNotification({
          type: "error",
          message: "Nome da instância é obrigatório",
        });
        return;
      }

      setCreating(true);

      // Verificar se já existe uma instância com o mesmo nome
      const { data: existingInstance } = await supabase
        .from("whatsapp_instances")
        .select("instanceName")
        .eq("instanceName", newInstanceName)
        .single();

      if (existingInstance) {
        setNotification({
          type: "error",
          message: "Já existe uma instância com este nome",
        });
        setCreating(false);
        return;
      }

      const { data, error } = await supabase
        .from("whatsapp_instances")
        .insert([
          {
            instanceName: newInstanceName,
            state: "DISCONNECTED",
            connected: false,
            number: "",
          },
        ])
        .select();

      if (error) throw error;

      setNotification({
        type: "success",
        message: "Instância criada com sucesso",
      });

      setNewInstanceName("");
      fetchInstances();
    } catch (error) {
      console.error("Erro ao criar instância:", error);
      setNotification({
        type: "error",
        message: "Erro ao criar instância",
      });
    } finally {
      setCreating(false);
    }
  };

  // Conectar instância
  const connectInstance = async (instanceName) => {
    try {
      setQrLoading(true);
      setSelectedInstance(instanceName);

      const { data, error } = await supabase.functions.invoke(
        "whatsapp/connect",
        {
          body: { instanceName },
        }
      );

      if (error) throw error;

      if (data && data.qrcode) {
        setQrCode(data.qrcode);

        // Verificar status a cada 5 segundos até estar conectado ou falhar
        const statusCheckInterval = setInterval(async () => {
          try {
            const { data: statusData, error: statusError } =
              await supabase.functions.invoke("whatsapp/status", {
                body: { instanceName },
              });

            if (statusError) throw statusError;

            if (statusData && statusData.connected) {
              clearInterval(statusCheckInterval);

              // Atualizar a lista de instâncias
              const updatedInstances = instances.map((instance) =>
                instance.instanceName === instanceName
                  ? {
                      ...instance,
                      connected: statusData.connected,
                      state: statusData.state,
                      number: statusData.number || instance.number,
                    }
                  : instance
              );

              setInstances(updatedInstances);

              setNotification({
                type: "success",
                message: "Dispositivo conectado com sucesso!",
              });
            }
          } catch (err) {
            console.error("Erro ao verificar status:", err);
          }
        }, 5000);

        // Parar de verificar após 2 minutos (evitar loop infinito)
        setTimeout(() => {
          clearInterval(statusCheckInterval);
        }, 120000);
      }

      setNotification({
        type: "success",
        message: "Conexão iniciada com sucesso. Escaneie o QR code.",
      });
    } catch (error) {
      console.error("Erro ao conectar instância:", error);
      setNotification({
        type: "error",
        message: `Erro ao iniciar conexão: ${error.message}`,
      });
    } finally {
      setQrLoading(false);
    }
  };

  // Verificar status da instância
  const checkInstanceStatus = async (instanceName) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "whatsapp/status",
        {
          body: { instanceName },
        }
      );

      if (error) throw error;

      // Atualizar o status da instância na lista
      if (data) {
        const updatedInstances = instances.map((instance) =>
          instance.instanceName === instanceName
            ? {
                ...instance,
                connected: data.connected,
                state: data.state,
                number: data.number || instance.number,
              }
            : instance
        );

        setInstances(updatedInstances);
      }

      setNotification({
        type: "success",
        message: "Status verificado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao verificar status:", error);
      setNotification({
        type: "error",
        message: `Erro ao verificar status: ${error.message}`,
      });
    }
  };

  // Desconectar instância
  const disconnectInstance = async (instanceName) => {
    try {
      const { error } = await supabase.functions.invoke("whatsapp/disconnect", {
        body: { instanceName },
      });

      if (error) throw error;

      // Atualizar o status da instância na lista
      const updatedInstances = instances.map((instance) =>
        instance.instanceName === instanceName
          ? { ...instance, connected: false, state: "DISCONNECTED" }
          : instance
      );

      setInstances(updatedInstances);

      setNotification({
        type: "success",
        message: "Instância desconectada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao desconectar instância:", error);
      setNotification({
        type: "error",
        message: "Erro ao desconectar instância",
      });
    }
  };

  // Excluir instância
  const deleteInstance = async (instanceName) => {
    try {
      if (
        window.confirm(
          `Tem certeza que deseja excluir a instância ${instanceName}?`
        )
      ) {
        // Primeiro verificar se a instância está conectada
        const instance = instances.find((i) => i.instanceName === instanceName);

        if (instance && instance.connected) {
          // Desconectar primeiro usando a API
          const { error: disconnectError } = await supabase.functions.invoke(
            "whatsapp/disconnect",
            {
              body: { instanceName },
            }
          );

          if (disconnectError) {
            console.warn("Erro ao desconectar instância:", disconnectError);
            // Continuar com a exclusão mesmo se houver erro na desconexão
          }
        }

        // Depois excluir do banco de dados
        const { error } = await supabase
          .from("whatsapp_instances")
          .delete()
          .eq("instanceName", instanceName);

        if (error) throw error;

        // Atualizar a lista local removendo a instância
        const updatedInstances = instances.filter(
          (instance) => instance.instanceName !== instanceName
        );

        setInstances(updatedInstances);

        setNotification({
          type: "success",
          message: "Instância excluída com sucesso",
        });
      }
    } catch (error) {
      console.error("Erro ao excluir instância:", error);
      setNotification({
        type: "error",
        message: `Erro ao excluir instância: ${error.message}`,
      });
    }
  };

  // Reiniciar instância
  const restartInstance = async (instanceName) => {
    try {
      setNotification({
        type: "info",
        message: "Reiniciando instância...",
      });

      const { data, error } = await supabase.functions.invoke(
        "whatsapp/restart",
        {
          body: { instanceName },
        }
      );

      if (error) throw error;

      // Atualizar o status da instância na lista com base na resposta
      if (data) {
        const updatedInstances = instances.map((instance) =>
          instance.instanceName === instanceName
            ? {
                ...instance,
                connected: data.connected,
                state: data.state,
                number: data.number || instance.number,
              }
            : instance
        );

        setInstances(updatedInstances);
      }

      setNotification({
        type: "success",
        message: "Instância reiniciada com sucesso",
      });
    } catch (error) {
      console.error("Erro ao reiniciar instância:", error);
      setNotification({
        type: "error",
        message: `Erro ao reiniciar instância: ${error.message}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Gerenciamento de Instâncias WhatsApp
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={fetchInstances}
            className="btn-secondary text-sm flex items-center"
            disabled={loading}
          >
            {loading ? (
              <span className="inline-block animate-spin h-4 w-4 border-2 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full mr-2"></span>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            Atualizar
          </button>
        </div>
      </div>

      {/* Formulário para criar nova instância */}
      <div className="card p-4">
        <h3 className="text-md font-medium mb-3">Nova Instância</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newInstanceName}
            onChange={(e) => setNewInstanceName(e.target.value)}
            placeholder="Nome da instância"
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            onClick={createInstance}
            disabled={creating || !newInstanceName.trim()}
            className="btn-primary"
          >
            {creating ? (
              <span className="inline-block animate-spin h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full mr-2"></span>
            ) : null}
            Criar
          </button>
        </div>
      </div>

      {/* Lista de instâncias */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4">
          <h3 className="text-md font-medium">Instâncias Disponíveis</h3>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <span className="inline-block animate-spin h-6 w-6 border-2 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></span>
          </div>
        ) : instances.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma instância encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Número</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((instance) => (
                  <tr key={instance.instanceName} className="border-t">
                    <td className="p-4 font-medium">{instance.instanceName}</td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div
                          className={`w-3 h-3 rounded-full mr-2 ${
                            instance.state === "CONNECTED"
                              ? "bg-green-500"
                              : instance.state === "CONNECTING"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        ></div>
                        <span>
                          {instance.state === "CONNECTED"
                            ? "Conectado"
                            : instance.state === "CONNECTING"
                            ? "Conectando"
                            : "Desconectado"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{instance.number || "-"}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {instance.state !== "CONNECTED" ? (
                          <DialogRoot>
                            <DialogTrigger className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">
                              Conectar
                            </DialogTrigger>
                            {isMounted && (
                              <DialogPortal>
                                <DialogOverlay className="radix-dialog-overlay" />
                                <DialogContent className="radix-dialog-content max-w-md w-full">
                                  <DialogTitle className="radix-dialog-title">
                                    Conectar WhatsApp
                                  </DialogTitle>
                                  <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                      Escaneie o QR code abaixo com seu WhatsApp
                                      para conectar:
                                    </p>
                                    <div className="flex flex-col items-center justify-center">
                                      {qrLoading ? (
                                        <div className="h-64 w-64 flex items-center justify-center">
                                          <span className="inline-block animate-spin h-10 w-10 border-4 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></span>
                                        </div>
                                      ) : qrCode ? (
                                        <img
                                          src={qrCode}
                                          alt="QR Code para conexão"
                                          className="h-64 w-64"
                                        />
                                      ) : (
                                        <div className="h-64 w-64 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                          <p className="text-gray-400 text-center">
                                            QR Code não disponível
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex justify-end space-x-3 mt-4">
                                      <DialogClose className="btn-secondary">
                                        Fechar
                                      </DialogClose>
                                      <button
                                        onClick={() =>
                                          connectInstance(instance.instanceName)
                                        }
                                        disabled={qrLoading}
                                        className="btn-primary"
                                      >
                                        {qrLoading ? (
                                          <span className="inline-block animate-spin h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full mr-2"></span>
                                        ) : null}
                                        Gerar QR Code
                                      </button>
                                    </div>
                                  </div>
                                  <DialogClose asChild>
                                    <button
                                      className="absolute top-4 right-4 inline-flex items-center justify-center rounded-full p-1"
                                      aria-label="Close"
                                    >
                                      <svg
                                        width="15"
                                        height="15"
                                        viewBox="0 0 15 15"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                      >
                                        <path
                                          d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                                          fill="currentColor"
                                          fillRule="evenodd"
                                          clipRule="evenodd"
                                        ></path>
                                      </svg>
                                    </button>
                                  </DialogClose>
                                </DialogContent>
                              </DialogPortal>
                            )}
                          </DialogRoot>
                        ) : (
                          <button
                            onClick={() =>
                              disconnectInstance(instance.instanceName)
                            }
                            className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded"
                          >
                            Desconectar
                          </button>
                        )}

                        <button
                          onClick={() => restartInstance(instance.instanceName)}
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        >
                          Reiniciar
                        </button>

                        <button
                          onClick={() =>
                            checkInstanceStatus(instance.instanceName)
                          }
                          className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded"
                        >
                          Verificar
                        </button>

                        <button
                          onClick={() => deleteInstance(instance.instanceName)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Toast de notificação */}
      <ToastProvider>
        {notification.message && (
          <ToastRoot
            open={!!notification.message}
            onOpenChange={() => setNotification({ type: "", message: "" })}
            className={`radix-toast-root ${
              notification.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <ToastTitle
              className={`radix-toast-title ${
                notification.type === "error"
                  ? "text-red-800"
                  : "text-green-800"
              }`}
            >
              {notification.message}
            </ToastTitle>
          </ToastRoot>
        )}
        <ToastViewport className="radix-toast-viewport" />
      </ToastProvider>
    </div>
  );
}
