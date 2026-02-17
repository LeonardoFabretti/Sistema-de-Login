import { useState, useCallback } from 'react';

/**
 * Hook customizado para autenticação
 * 
 * @param {string} apiUrl - URL da API de autenticação
 * @returns {object} - Estado e métodos de autenticação
 */
const useAuth = (apiUrl = 'http://localhost:5000/api/auth') => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    // Recuperar token do localStorage
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Salva token no storage
   */
  const saveToken = useCallback((token, remember = false) => {
    if (remember) {
      localStorage.setItem('authToken', token);
      sessionStorage.removeItem('authToken');
    } else {
      sessionStorage.setItem('authToken', token);
      localStorage.removeItem('authToken');
    }
    setToken(token);
  }, []);

  /**
   * Remove token do storage
   */
  const removeToken = useCallback(() => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setToken(null);
  }, []);

  /**
   * Login do usuário
   */
  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao fazer login');
      }

      // Salvar token
      if (data.data && data.data.tokens) {
        saveToken(data.data.tokens.accessToken, credentials.rememberMe);
      }

      // Salvar dados do usuário
      if (data.data && data.data.user) {
        setUser(data.data.user);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, saveToken]);

  /**
   * Logout do usuário
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Opcional: chamar endpoint de logout no backend
      if (token) {
        await fetch(`${apiUrl}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      }

      // Limpar estado local
      removeToken();
      setUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      // Mesmo com erro, limpar estado local
      removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token, removeToken]);

  /**
   * Registra novo usuário
   */
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao registrar');
      }

      // Auto-login após registro
      if (data.data && data.data.tokens) {
        saveToken(data.data.tokens.accessToken, false);
      }

      if (data.data && data.data.user) {
        setUser(data.data.user);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, saveToken]);

  /**
   * Verifica se usuário está autenticado
   */
  const checkAuth = useCallback(async () => {
    if (!token) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        removeToken();
        return false;
      }

      const data = await response.json();

      if (data.data && data.data.user) {
        setUser(data.data.user);
      }

      return true;
    } catch (err) {
      setError(err.message);
      removeToken();
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token, removeToken]);

  /**
   * Atualiza perfil do usuário
   */
  const updateProfile = useCallback(async (updates) => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updates)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro ao atualizar perfil');
      }

      if (data.data && data.data.user) {
        setUser(data.data.user);
      }

      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, token]);

  return {
    // Estado
    user,
    token,
    isLoading,
    error,
    isAuthenticated: !!token,
    
    // Métodos
    login,
    logout,
    register,
    checkAuth,
    updateProfile,
    
    // Helpers
    clearError: () => setError(null)
  };
};

export default useAuth;
