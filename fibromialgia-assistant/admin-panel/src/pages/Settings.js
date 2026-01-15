import React, { useState, useEffect } from "react";
import { supabase } from "../config/supabaseClient";
import {
  Root as SwitchRoot,
  Thumb as SwitchThumb,
} from "@radix-ui/react-switch";
import {
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Content as SelectContent,
  Item as SelectItem,
} from "@radix-ui/react-select";
import {
  Provider as ToastProvider,
  Root as ToastRoot,
  Title as ToastTitle,
  Viewport as ToastViewport,
} from "@radix-ui/react-toast";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import WhatsAppConnect from "../components/WhatsAppConnect";
import WhatsAppInstanceManager from "../components/WhatsAppInstanceManager";

function Settings() {
  const [tabValue, setTabValue] = useState("geral");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [settings, setSettings] = useState({
    system: {
      maintenance: false,
      debug: false,
      logLevel: "info",
    },
    notifications: {
      email: true,
      whatsapp: true,
      push: true,
    },
    api: {
      openai: {
        enabled: true,
        apiKey: "",
        model: "gpt-4",
      },
      claude: {
        enabled: true,
        apiKey: "",
        model: "claude-3-opus",
      },
      whatsapp: {
        url: "",
        apiKey: "",
        senderId: "",
      },
    },
    backup: {
      autoBackup: true,
      frequency: "daily",
      retention: 30,
    },
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      setError("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase.from("settings").upsert([
        {
          id: 1,
          settings,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      setSuccess("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      setError("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Configurações</h1>

      {/* Toast de sucesso/erro */}
      <ToastProvider>
        {success && (
          <ToastRoot open={!!success} onOpenChange={() => setSuccess("")}>
            <ToastTitle>{success}</ToastTitle>
          </ToastRoot>
        )}
        {error && (
          <ToastRoot open={!!error} onOpenChange={() => setError("")}>
            <ToastTitle>{error}</ToastTitle>
          </ToastRoot>
        )}
        <ToastViewport />
      </ToastProvider>

      <form onSubmit={handleSubmit} className="space-y-8">
        <TabsPrimitive.Root
          value={tabValue}
          onValueChange={setTabValue}
          className="w-full"
        >
          <TabsPrimitive.List className="flex border-b border-gray-200 mb-6">
            <TabsPrimitive.Trigger
              value="geral"
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                tabValue === "geral"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Geral
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger
              value="apis"
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                tabValue === "apis"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              APIs
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger
              value="whatsapp"
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                tabValue === "whatsapp"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              WhatsApp
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger
              value="instancias"
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                tabValue === "instancias"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Instâncias
            </TabsPrimitive.Trigger>
            <TabsPrimitive.Trigger
              value="backup"
              className={`px-4 py-2 font-medium text-sm focus:outline-none ${
                tabValue === "backup"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Backup
            </TabsPrimitive.Trigger>
          </TabsPrimitive.List>

          <TabsPrimitive.Content value="geral" className="p-4">
            {/* Sistema */}
            <section>
              <h2 className="text-xl font-semibold mb-2">Sistema</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="maintenance-switch">Modo de Manutenção</label>
                  <SwitchRoot
                    id="maintenance-switch"
                    checked={settings.system.maintenance}
                    onCheckedChange={(checked) =>
                      handleChange("system", "maintenance", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="debug-switch">Modo Debug</label>
                  <SwitchRoot
                    id="debug-switch"
                    checked={settings.system.debug}
                    onCheckedChange={(checked) =>
                      handleChange("system", "debug", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="logLevel-select">Nível de Log</label>
                  <SelectRoot
                    value={settings.system.logLevel}
                    onValueChange={(value) =>
                      handleChange("system", "logLevel", value)
                    }
                  >
                    <SelectTrigger id="logLevel-select" />
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </SelectRoot>
                </div>
              </div>
            </section>

            {/* Notificações */}
            <section className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Notificações</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="email-switch">Notificações por Email</label>
                  <SwitchRoot
                    id="email-switch"
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      handleChange("notifications", "email", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="whatsapp-switch">
                    Notificações por WhatsApp
                  </label>
                  <SwitchRoot
                    id="whatsapp-switch"
                    checked={settings.notifications.whatsapp}
                    onCheckedChange={(checked) =>
                      handleChange("notifications", "whatsapp", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="push-switch">Notificações Push</label>
                  <SwitchRoot
                    id="push-switch"
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      handleChange("notifications", "push", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
              </div>
            </section>
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="apis" className="p-4">
            {/* OpenAI */}
            <section>
              <h2 className="text-xl font-semibold mb-2">OpenAI</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="openai-enabled">Habilitado</label>
                  <SwitchRoot
                    id="openai-enabled"
                    checked={settings.api.openai.enabled}
                    onCheckedChange={(checked) =>
                      handleChange("api.openai", "enabled", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="openai-apiKey">API Key</label>
                  <input
                    type="password"
                    id="openai-apiKey"
                    value={settings.api.openai.apiKey}
                    onChange={(e) =>
                      handleChange("api.openai", "apiKey", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="openai-model">Modelo</label>
                  <select
                    id="openai-model"
                    value={settings.api.openai.model}
                    onChange={(e) =>
                      handleChange("api.openai", "model", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Claude */}
            <section className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Claude</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="claude-enabled">Habilitado</label>
                  <SwitchRoot
                    id="claude-enabled"
                    checked={settings.api.claude.enabled}
                    onCheckedChange={(checked) =>
                      handleChange("api.claude", "enabled", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="claude-apiKey">API Key</label>
                  <input
                    type="password"
                    id="claude-apiKey"
                    value={settings.api.claude.apiKey}
                    onChange={(e) =>
                      handleChange("api.claude", "apiKey", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="claude-model">Modelo</label>
                  <select
                    id="claude-model"
                    value={settings.api.claude.model}
                    onChange={(e) =>
                      handleChange("api.claude", "model", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  >
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku">Claude 3 Haiku</option>
                  </select>
                </div>
              </div>
            </section>
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="whatsapp" className="p-4">
            {/* WhatsApp API */}
            <section>
              <h2 className="text-xl font-semibold mb-2">API do WhatsApp</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="whatsapp-url">URL da API</label>
                  <input
                    type="text"
                    id="whatsapp-url"
                    value={settings.api.whatsapp.url}
                    onChange={(e) =>
                      handleChange("api.whatsapp", "url", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                    placeholder="http://localhost:8080"
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp-apiKey">API Key</label>
                  <input
                    type="password"
                    id="whatsapp-apiKey"
                    value={settings.api.whatsapp.apiKey}
                    onChange={(e) =>
                      handleChange("api.whatsapp", "apiKey", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="whatsapp-senderId">ID do Remetente</label>
                  <input
                    type="text"
                    id="whatsapp-senderId"
                    value={settings.api.whatsapp.senderId}
                    onChange={(e) =>
                      handleChange("api.whatsapp", "senderId", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                    placeholder="5511987654321"
                  />
                </div>
              </div>
            </section>

            {/* WhatsApp Connect */}
            <section className="mt-6">
              <h2 className="text-xl font-semibold mb-2">Conectar WhatsApp</h2>
              <WhatsAppConnect />
            </section>
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="instancias" className="p-4">
            {/* WhatsApp Instances */}
            <section>
              <h2 className="text-xl font-semibold mb-2">
                Gerenciar Instâncias
              </h2>
              <WhatsAppInstanceManager />
            </section>
          </TabsPrimitive.Content>

          <TabsPrimitive.Content value="backup" className="p-4">
            {/* Backup */}
            <section>
              <h2 className="text-xl font-semibold mb-2">
                Configurações de Backup
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="autoBackup-switch">Backup Automático</label>
                  <SwitchRoot
                    id="autoBackup-switch"
                    checked={settings.backup.autoBackup}
                    onCheckedChange={(checked) =>
                      handleChange("backup", "autoBackup", checked)
                    }
                    className="block mt-1"
                  >
                    <SwitchThumb className="block w-6 h-6 bg-blue-500 rounded-full" />
                  </SwitchRoot>
                </div>
                <div>
                  <label htmlFor="frequency-select">Frequência</label>
                  <select
                    id="frequency-select"
                    value={settings.backup.frequency}
                    onChange={(e) =>
                      handleChange("backup", "frequency", e.target.value)
                    }
                    className="w-full p-2 border rounded mt-1"
                    disabled={!settings.backup.autoBackup}
                  >
                    <option value="hourly">A cada hora</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="retention-input">Retenção (dias)</label>
                  <input
                    type="number"
                    id="retention-input"
                    value={settings.backup.retention}
                    onChange={(e) =>
                      handleChange(
                        "backup",
                        "retention",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full p-2 border rounded mt-1"
                    disabled={!settings.backup.autoBackup}
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </section>
          </TabsPrimitive.Content>
        </TabsPrimitive.Root>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            disabled={saving}
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
