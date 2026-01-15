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

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    severity: "medium",
    status: "active",
    type: "system",
  });

  useEffect(() => {
    setIsMounted(true);
    fetchAlerts();
    return () => setIsMounted(false);
  }, [page, rowsPerPage]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);

      // Como não temos tabela 'alerts' real, vamos usar dados do engagement_logs
      const { data, error } = await supabase
        .from("engagement_logs")
        .select("*")
        .limit(rowsPerPage)
        .order("timestamp", { ascending: false });

      if (error) {
        console.log(
          "Tabela engagement_logs não encontrada, usando dados vazios"
        );
        setAlerts([]);
        return;
      }

      // Converter logs de engajamento em formato de alertas
      const alertsData =
        data?.map((log) => ({
          id: log.id,
          title: `Evento de Engajamento: ${log.evento}`,
          description: `Usuário ${log.user_id} - ${JSON.stringify(
            log.detalhes
          )}`,
          severity: log.evento === "mensagem_usuario" ? "low" : "medium",
          status: "active",
          type: "engagement",
          created_at: log.timestamp,
        })) || [];

      setAlerts(alertsData);
    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
      setAlerts([]); // Dados vazios se não houver tabela
      setNotification({
        type: "info",
        message: "Nenhum alerta encontrado - aguardando dados reais",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (value) => {
    setRowsPerPage(parseInt(value, 10));
    setPage(0);
  };

  const handleOpenDialog = (alert = null) => {
    if (alert) {
      setSelectedAlert(alert);
      setFormData({
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        type: alert.type,
      });
    } else {
      setSelectedAlert(null);
      setFormData({
        title: "",
        description: "",
        severity: "medium",
        status: "active",
        type: "system",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAlert(null);
    setFormData({
      title: "",
      description: "",
      severity: "medium",
      status: "active",
      type: "system",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAlert) {
        const { error } = await supabase
          .from("alerts")
          .update(formData)
          .eq("id", selectedAlert.id);
        if (error) throw error;
        setNotification({
          type: "success",
          message: "Alerta atualizado com sucesso",
        });
      } else {
        const { error } = await supabase.from("alerts").insert([formData]);
        if (error) throw error;
        setNotification({
          type: "success",
          message: "Alerta criado com sucesso",
        });
      }
      handleCloseDialog();
      fetchAlerts();
    } catch (error) {
      console.error("Erro ao salvar alerta:", error);
      setNotification({
        type: "error",
        message: "Erro ao salvar alerta",
      });
    }
  };

  const handleDelete = async (alertId) => {
    if (window.confirm("Tem certeza que deseja excluir este alerta?")) {
      try {
        const { error } = await supabase
          .from("alerts")
          .delete()
          .eq("id", alertId);
        if (error) throw error;
        setNotification({
          type: "success",
          message: "Alerta excluído com sucesso",
        });
        fetchAlerts();
      } catch (error) {
        console.error("Erro ao excluir alerta:", error);
        setNotification({
          type: "error",
          message: "Erro ao excluir alerta",
        });
      }
    }
  };

  const handleResolve = async (alertId) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ status: "resolved" })
        .eq("id", alertId);
      if (error) throw error;
      setNotification({
        type: "success",
        message: "Alerta resolvido com sucesso",
      });
      fetchAlerts();
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
      setNotification({
        type: "error",
        message: "Erro ao resolver alerta",
      });
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Alertas</h1>
        <button
          className="btn-primary flex items-center"
          onClick={() => handleOpenDialog()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Novo Alerta
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Título
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Descrição
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Severidade
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Tipo
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Data de Criação
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <span className="inline-block animate-spin h-6 w-6 border-2 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></span>
                    </div>
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nenhum alerta encontrado
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {alert.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityClass(
                          alert.severity
                        )}`}
                      >
                        {alert.severity === "high"
                          ? "Alta"
                          : alert.severity === "medium"
                          ? "Média"
                          : "Baixa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          alert.status
                        )}`}
                      >
                        {alert.status === "active" ? "Ativo" : "Resolvido"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {alert.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(alert.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {alert.status === "active" && (
                        <button
                          className="text-green-600 hover:text-green-900 mr-2"
                          onClick={() => handleResolve(alert.id)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        className="text-brand-600 hover:text-brand-900 mr-2"
                        onClick={() => handleOpenDialog(alert)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">Linhas por página:</span>
            <select
              className="bg-white border border-gray-300 rounded-md shadow-sm py-1 pl-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              value={rowsPerPage}
              onChange={(e) => handleChangeRowsPerPage(e.target.value)}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 0}
              className={`relative inline-flex items-center px-2 py-1 rounded-md border ${
                page === 0
                  ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="sr-only">Anterior</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={() => handleChangePage(page + 1)}
              className="relative inline-flex items-center px-2 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              <span className="sr-only">Próxima</span>
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Edição/Criação */}
      <DialogRoot open={openDialog} onOpenChange={setOpenDialog}>
        {isMounted && (
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/50" />
            <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 focus:outline-none max-w-md w-full">
              <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
                {selectedAlert ? "Editar Alerta" : "Novo Alerta"}
              </DialogTitle>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severidade
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) =>
                        setFormData({ ...formData, severity: e.target.value })
                      }
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="active">Ativo</option>
                      <option value="resolved">Resolvido</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="mt-5 flex justify-end space-x-3">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancelar
                    </button>
                  </DialogClose>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
                  >
                    Salvar
                  </button>
                </div>
              </form>
              <DialogClose asChild>
                <button
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-500"
                  aria-label="Close"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </DialogClose>
            </DialogContent>
          </DialogPortal>
        )}
      </DialogRoot>

      {/* Toast de notificação */}
      <ToastProvider>
        {notification.message && (
          <ToastRoot
            open={!!notification.message}
            onOpenChange={() => setNotification({ type: "", message: "" })}
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg border ${
              notification.type === "error"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-200"
            }`}
          >
            <ToastTitle
              className={`font-medium ${
                notification.type === "error"
                  ? "text-red-800"
                  : "text-green-800"
              }`}
            >
              {notification.message}
            </ToastTitle>
          </ToastRoot>
        )}
        <ToastViewport className="fixed bottom-0 right-0 p-6 max-w-md z-50" />
      </ToastProvider>
    </div>
  );
}

export default Alerts;
