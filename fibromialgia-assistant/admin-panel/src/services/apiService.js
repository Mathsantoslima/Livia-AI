/**
 * Serviço para comunicação com a API do Backend
 */

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
const AUTH_STORAGE_KEY = "fibroia_user";

class ApiService {
  /**
   * Obtém o token de autenticação do localStorage
   */
  getToken() {
    const user = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    return user?.token || null;
  }

  /**
   * Faz uma requisição autenticada
   */
  async request(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${API_URL}${endpoint}`;

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          window.dispatchEvent(new Event("fibroia:unauthorized"));
        }
        const error = await response.json().catch(() => ({
          error: "Erro desconhecido",
          message: response.statusText,
        }));
        throw new Error(error.message || error.error || "Erro na requisição");
      }

      return await response.json();
    } catch (error) {
      console.error(`Erro na requisição ${endpoint}:`, error);
      throw error;
    }
  }

  // ================================
  // AUTENTICAÇÃO
  // ================================

  async login(email, password) {
    // Login é uma rota pública, não precisa de token
    const url = `${API_URL}/admin/auth/login`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Erro desconhecido",
        message: response.statusText,
      }));
      throw new Error(error.message || error.error || "Credenciais inválidas");
    }

    const data = await response.json();

    // Salvar token no localStorage
    if (data.token && data.admin) {
      const userData = {
        ...data.admin,
        token: data.token,
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    }

    return data;
  }

  async logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  // ================================
  // DASHBOARD / MÉTRICAS DE IA
  // ================================

  /**
   * Obtém dashboard completo de métricas
   * @param {string} period - Período: '24h', '7d', '30d'
   */
  async getDashboard(period = "24h") {
    return this.request(`/dashboard?period=${period}`);
  }

  /**
   * Obtém estatísticas de custo
   */
  async getCostStats() {
    return this.request("/dashboard/costs");
  }

  /**
   * Obtém estatísticas dos providers
   */
  async getProviderStats() {
    return this.request("/dashboard/providers");
  }

  // ================================
  // MONITORAMENTO
  // ================================

  /**
   * Verifica saúde do sistema
   */
  async getSystemHealth() {
    return this.request("/admin/monitoring/health");
  }

  /**
   * Verifica desempenho do sistema
   */
  async getSystemPerformance() {
    return this.request("/admin/monitoring/performance");
  }

  /**
   * Obtém todas as métricas do sistema
   */
  async getAllMetrics() {
    return this.request("/admin/monitoring/metrics");
  }

  // ================================
  // USUÁRIOS
  // ================================

  /**
   * Lista todos os usuários
   */
  async getUsers(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams
      ? `/users?${queryParams}`
      : "/users";
    return this.request(endpoint);
  }

  /**
   * Obtém um usuário por ID
   */
  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  // ================================
  // WHATSAPP
  // ================================

  /**
   * Envia mensagem via WhatsApp
   */
  async sendWhatsAppMessage(to, message) {
    return this.request("/whatsapp/send", {
      method: "POST",
      body: JSON.stringify({ to, message }),
    });
  }
}

export default new ApiService();
