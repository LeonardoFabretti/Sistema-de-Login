/**
 * Serviço de API - Wrapper para chamadas HTTP
 * Centraliza configuração de requisições e tratamento de erros
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Configuração padrão para requisições
 */
const defaultConfig = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include'
};

/**
 * Obtém token de autenticação do storage
 */
const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

/**
 * Processa resposta da API
 */
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    // Extrair mensagem de erro
    const errorMessage = data.error || data.message || `Erro ${response.status}`;
    
    // Criar erro com informações adicionais
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    
    throw error;
  }

  return data;
};

/**
 * Realiza requisição HTTP genérica
 */
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  // Merge configurações
  const config = {
    ...defaultConfig,
    ...options,
    headers: {
      ...defaultConfig.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    // Log de erro (opcional - remover em produção)
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * Métodos HTTP
 */
const apiService = {
  /**
   * GET request
   */
  get: (endpoint, options = {}) => {
    return request(endpoint, {
      ...options,
      method: 'GET'
    });
  },

  /**
   * POST request
   */
  post: (endpoint, body, options = {}) => {
    return request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  /**
   * PUT request
   */
  put: (endpoint, body, options = {}) => {
    return request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  /**
   * DELETE request
   */
  delete: (endpoint, options = {}) => {
    return request(endpoint, {
      ...options,
      method: 'DELETE'
    });
  },

  /**
   * PATCH request
   */
  patch: (endpoint, body, options = {}) => {
    return request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }
};

/**
 * Endpoints específicos de autenticação
 */
export const authAPI = {
  /**
   * Login de usuário
   */
  login: (credentials) => {
    return apiService.post('/auth/login', credentials);
  },

  /**
   * Registro de usuário
   */
  register: (userData) => {
    return apiService.post('/auth/register', userData);
  },

  /**
   * Logout
   */
  logout: () => {
    return apiService.post('/auth/logout');
  },

  /**
   * Verificar autenticação
   */
  checkAuth: () => {
    return apiService.get('/auth/me');
  },

  /**
   * Atualizar perfil
   */
  updateProfile: (updates) => {
    return apiService.put('/auth/profile', updates);
  },

  /**
   * Recuperar senha
   */
  forgotPassword: (email) => {
    return apiService.post('/auth/forgot-password', { email });
  },

  /**
   * Resetar senha
   */
  resetPassword: (token, newPassword) => {
    return apiService.post('/auth/reset-password', { token, password: newPassword });
  }
};

/**
 * Endpoints de usuários
 */
export const userAPI = {
  /**
   * Obter todos usuários (admin)
   */
  getAll: () => {
    return apiService.get('/users');
  },

  /**
   * Obter usuário por ID
   */
  getById: (id) => {
    return apiService.get(`/users/${id}`);
  },

  /**
   * Atualizar usuário
   */
  update: (id, updates) => {
    return apiService.put(`/users/${id}`, updates);
  },

  /**
   * Deletar usuário
   */
  delete: (id) => {
    return apiService.delete(`/users/${id}`);
  }
};

export default apiService;
