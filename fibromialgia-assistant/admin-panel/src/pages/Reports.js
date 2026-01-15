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
  Root as ToastRoot,
  Title as ToastTitle,
  Viewport as ToastViewport,
} from "@radix-ui/react-toast";
import { Provider as ToastProvider } from "@radix-ui/react-toast";

function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    type: "performance",
    format: "pdf",
    startDate: "",
    endDate: "",
    filters: {},
  });

  useEffect(() => {
    setIsMounted(true);
    fetchReports();
    return () => setIsMounted(false);
  }, [page, rowsPerPage]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Como não temos tabela 'reports' real, vamos gerar relatórios baseados em patterns_detected
      const { data, error } = await supabase
        .from("patterns_detected")
        .select("*")
        .limit(rowsPerPage)
        .order("created_at", { ascending: false });

      if (error) {
        console.log(
          "Tabela patterns_detected não encontrada, usando dados vazios"
        );
        setReports([]);
        return;
      }

      // Converter padrões detectados em formato de relatórios
      const reportsData =
        data?.map((pattern) => ({
          id: pattern.id,
          type: "patterns",
          format: "json",
          status: pattern.ativo ? "completed" : "failed",
          file_name: `Pattern_${pattern.tipo_padrao}_${pattern.id}.json`,
          file_path: `/patterns/${pattern.id}`,
          created_at: pattern.created_at,
          data: {
            tipo_padrao: pattern.tipo_padrao,
            descricao: pattern.descricao,
            relevancia: pattern.relevancia,
            user_id: pattern.user_id,
          },
        })) || [];

      setReports(reportsData);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      setReports([]); // Dados vazios se não houver tabela
      setNotification({
        type: "info",
        message: "Nenhum relatório encontrado - aguardando dados reais",
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

  const handleOpenDialog = () => {
    setFormData({
      type: "performance",
      format: "pdf",
      startDate: "",
      endDate: "",
      filters: {},
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("reports").insert([
        {
          ...formData,
          status: "generating",
        },
      ]);
      if (error) throw error;
      setNotification({
        type: "success",
        message: "Relatório solicitado com sucesso",
      });
      handleCloseDialog();
      fetchReports();
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      setNotification({
        type: "error",
        message: "Erro ao gerar relatório",
      });
    }
  };

  const handleDelete = async (reportId) => {
    if (window.confirm("Tem certeza que deseja excluir este relatório?")) {
      try {
        const { error } = await supabase
          .from("reports")
          .delete()
          .eq("id", reportId);
        if (error) throw error;
        setNotification({
          type: "success",
          message: "Relatório excluído com sucesso",
        });
        fetchReports();
      } catch (error) {
        console.error("Erro ao excluir relatório:", error);
        setNotification({
          type: "error",
          message: "Erro ao excluir relatório",
        });
      }
    }
  };

  const handleDownload = async (report) => {
    try {
      const { data, error } = await supabase.storage
        .from("reports")
        .download(report.file_path);

      if (error) throw error;

      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = report.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar relatório:", error);
      setNotification({
        type: "error",
        message: "Erro ao baixar relatório",
      });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "generating":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "performance":
        return "Desempenho";
      case "users":
        return "Usuários";
      case "alerts":
        return "Alertas";
      default:
        return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <button
          className="btn-primary flex items-center"
          onClick={handleOpenDialog}
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
          Novo Relatório
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
                  Tipo
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Formato
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
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <span className="inline-block animate-spin h-6 w-6 border-2 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nenhum relatório encontrado
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getTypeLabel(report.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.format.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          report.status
                        )}`}
                      >
                        {report.status === "completed"
                          ? "Concluído"
                          : report.status === "generating"
                          ? "Gerando"
                          : "Falhou"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {report.status === "completed" && (
                        <button
                          className="text-brand-600 hover:text-brand-900 mr-2"
                          onClick={() => handleDownload(report)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      )}
                      {report.status === "generating" && (
                        <span className="text-blue-600 mr-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 animate-spin"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(report.id)}
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

      {/* Modal de Criação de Relatório */}
      <DialogRoot open={openDialog} onOpenChange={setOpenDialog}>
        {isMounted && (
          <DialogPortal>
            <DialogOverlay className="fixed inset-0 bg-black/50" />
            <DialogContent className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 focus:outline-none max-w-md w-full">
              <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Novo Relatório
              </DialogTitle>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Relatório
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="performance">Desempenho</option>
                      <option value="users">Usuários</option>
                      <option value="alerts">Alertas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Formato
                    </label>
                    <select
                      value={formData.format}
                      onChange={(e) =>
                        setFormData({ ...formData, format: e.target.value })
                      }
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    >
                      <option value="pdf">PDF</option>
                      <option value="csv">CSV</option>
                      <option value="xlsx">Excel</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Inicial
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            startDate: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Final
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                      />
                    </div>
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
                    Gerar Relatório
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

export default Reports;
