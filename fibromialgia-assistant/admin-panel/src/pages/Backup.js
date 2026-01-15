import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  Provider as ToastProvider,
  Root as ToastRoot,
  Title as ToastTitle,
  Viewport as ToastViewport,
} from "@radix-ui/react-toast";

function Backup() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [notification, setNotification] = useState({ type: "", message: "" });
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, [page, rowsPerPage]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("backups")
        .select("*")
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBackups(data);
    } catch (error) {
      console.error("Erro ao buscar backups:", error);
      setNotification({
        type: "error",
        message: "Erro ao carregar backups",
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

  const handleCreateBackup = async () => {
    setCreating(true);
    setNotification({ type: "", message: "" });

    try {
      const { error } = await supabase.customFunctions.invoke("create-backup", {
        body: { type: "full" },
      });

      if (error) throw error;

      setNotification({
        type: "success",
        message: "Backup iniciado com sucesso!",
      });
      fetchBackups();
    } catch (error) {
      console.error("Erro ao criar backup:", error);
      setNotification({
        type: "error",
        message: "Erro ao criar backup",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (backup) => {
    if (
      !window.confirm(
        "Tem certeza que deseja restaurar este backup? Esta ação não pode ser desfeita."
      )
    )
      return;

    setRestoring(true);
    setNotification({ type: "", message: "" });

    try {
      const { error } = await supabase.customFunctions.invoke(
        "restore-backup",
        {
          body: { backupId: backup.id },
        }
      );

      if (error) throw error;

      setNotification({
        type: "success",
        message: "Restauração iniciada com sucesso!",
      });
      fetchBackups();
    } catch (error) {
      console.error("Erro ao restaurar backup:", error);
      setNotification({
        type: "error",
        message: "Erro ao restaurar backup",
      });
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = async (backupId) => {
    if (
      !window.confirm(
        "Tem certeza que deseja excluir este backup? Esta ação não pode ser desfeita."
      )
    )
      return;

    try {
      const { error } = await supabase
        .from("backups")
        .delete()
        .eq("id", backupId);

      if (error) throw error;

      setNotification({
        type: "success",
        message: "Backup excluído com sucesso!",
      });
      fetchBackups();
    } catch (error) {
      console.error("Erro ao excluir backup:", error);
      setNotification({
        type: "error",
        message: "Erro ao excluir backup",
      });
    }
  };

  const handleDownload = async (backup) => {
    try {
      const { data, error } = await supabase.storage
        .from("backups")
        .download(backup.file_path);

      if (error) throw error;

      // Criar URL do blob e fazer download
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = backup.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar backup:", error);
      setNotification({
        type: "error",
        message: "Erro ao baixar backup",
      });
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "in_progress":
        return "Em Progresso";
      case "failed":
        return "Falhou";
      default:
        return status;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading && backups.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="inline-block animate-spin h-10 w-10 border-4 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Backup e Restauração</h1>
        <button
          className="btn-primary flex items-center"
          onClick={handleCreateBackup}
          disabled={creating}
        >
          {creating ? (
            <>
              <span className="inline-block animate-spin h-4 w-4 border-2 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full mr-2"></span>
              Criando...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z" />
                <path d="M9 13h2v5a1 1 0 11-2 0v-5z" />
              </svg>
              Novo Backup
            </>
          )}
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
                  Nome do Arquivo
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
                  Tamanho
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
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <span className="inline-block animate-spin h-6 w-6 border-2 border-t-brand-600 border-r-brand-600 border-b-transparent border-l-transparent rounded-full"></span>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nenhum backup encontrado
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {backup.file_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(backup.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                          backup.status
                        )}`}
                      >
                        {getStatusLabel(backup.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(backup.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {backup.status === "completed" && (
                        <>
                          <button
                            className="text-brand-600 hover:text-brand-900 mr-2"
                            onClick={() => handleDownload(backup)}
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
                          <button
                            className="text-green-600 hover:text-green-900 mr-2"
                            onClick={() => handleRestore(backup)}
                            disabled={restoring}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDelete(backup.id)}
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

export default Backup;
