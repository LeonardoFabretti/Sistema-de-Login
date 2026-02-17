# 🔐 Integração de Login com API Segura

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Implementação HTML/JavaScript](#implementação-htmljavascript)
3. [Implementação React](#implementação-react)
4. [Tratamento de Erros](#tratamento-de-erros)
5. [Feedback Visual](#feedback-visual)
6. [Segurança no Frontend](#segurança-no-frontend)
7. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

Esta documentação explica como integrar as páginas de login (HTML tradicional e React) com uma API backend segura, seguindo as melhores práticas de segurança e UX.

### Fluxo de Autenticação

```
┌─────────────┐      1. POST /api/auth/login       ┌─────────────┐
│             │  ──────────────────────────────>   │             │
│   Frontend  │     { email, password }            │   Backend   │
│   (Login)   │                                     │   (API)     │
│             │  <──────────────────────────────   │             │
└─────────────┘      2. Response                   └─────────────┘
                     { tokens, user }
                          ↓
                     3. Salvar token
                     (localStorage/sessionStorage)
                          ↓
                     4. Redirecionar /dashboard
```

---

## 🌐 Implementação HTML/JavaScript

### 1. Estrutura do Formulário HTML

```html
<!-- public/login.html -->
<form id="login-form" novalidate>
  <!-- Email -->
  <div class="form-group">
    <label for="email">Email</label>
    <input
      type="email"
      id="email"
      name="email"
      autocomplete="email"
      required
    />
    <span class="error-message" id="email-error"></span>
  </div>

  <!-- Senha -->
  <div class="form-group">
    <label for="password">Senha</label>
    <input
      type="password"
      id="password"
      name="password"
      autocomplete="current-password"
      required
    />
    <span class="error-message" id="password-error"></span>
  </div>

  <!-- Remember Me -->
  <div class="checkbox">
    <input type="checkbox" id="remember-me" name="rememberMe" />
    <label for="remember-me">Lembrar-me</label>
  </div>

  <!-- Submit -->
  <button type="submit" class="btn-primary">
    <span class="btn-text">Entrar</span>
    <span class="spinner" style="display: none;"></span>
  </button>
</form>

<!-- Alert container -->
<div id="alert-container"></div>
```

---

### 2. Função de Login (Vanilla JavaScript)

```javascript
// public/js/auth.js

/**
 * Configuração da API
 */
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Realiza login do usuário
 * @param {Object} credentials - { email, password, rememberMe }
 * @returns {Promise<Object>} Response da API
 */
async function login(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Envia cookies (CSRF token)
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    });

    // Parse JSON
    const data = await response.json();

    // Verifica se houve erro
    if (!response.ok) {
      // Lança erro com mensagem da API
      throw new Error(data.error || data.message || `Erro ${response.status}`);
    }

    return data;
  } catch (error) {
    // Re-lança erro para tratamento no handler
    throw error;
  }
}

/**
 * Salva token no storage
 * @param {string} token - JWT token
 * @param {boolean} remember - Salvar em localStorage (true) ou sessionStorage (false)
 */
function saveToken(token, remember = false) {
  if (remember) {
    localStorage.setItem('authToken', token);
    sessionStorage.removeItem('authToken');
  } else {
    sessionStorage.setItem('authToken', token);
    localStorage.removeItem('authToken');
  }
}

/**
 * Obtém token do storage
 * @returns {string|null} Token ou null
 */
function getToken() {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
}

/**
 * Remove token (logout)
 */
function removeToken() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
}
```

---

### 3. Handler do Formulário

```javascript
// public/js/auth.js (continuação)

/**
 * Inicializa formulário de login
 */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeCheckbox = document.getElementById('remember-me');
  const submitButton = form.querySelector('button[type="submit"]');
  const btnText = submitButton.querySelector('.btn-text');
  const spinner = submitButton.querySelector('.spinner');

  // Validação em tempo real
  emailInput.addEventListener('blur', () => {
    validateEmail(emailInput.value);
  });

  passwordInput.addEventListener('blur', () => {
    validatePassword(passwordInput.value);
  });

  // Submit do formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validação
    const emailValid = validateEmail(emailInput.value);
    const passwordValid = validatePassword(passwordInput.value);

    if (!emailValid || !passwordValid) {
      return; // Não submete se houver erros
    }

    // Desabilita botão (previne double-submit)
    submitButton.disabled = true;
    btnText.textContent = 'Entrando...';
    spinner.style.display = 'inline-block';

    try {
      // Chama API
      const response = await login({
        email: emailInput.value,
        password: passwordInput.value,
        rememberMe: rememberMeCheckbox.checked
      });

      // Extrai token da resposta
      const token = response.data?.tokens?.accessToken;

      if (token) {
        // Salva token
        saveToken(token, rememberMeCheckbox.checked);
      }

      // Feedback de sucesso
      showAlert('success', 'Login realizado com sucesso! Redirecionando...');

      // Limpa formulário
      form.reset();

      // Redireciona após 1.5s
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);

    } catch (error) {
      // Feedback de erro
      showAlert('error', error.message || 'Erro ao fazer login. Tente novamente.');

      // Foca campo de email
      emailInput.focus();
    } finally {
      // Re-habilita botão
      submitButton.disabled = false;
      btnText.textContent = 'Entrar';
      spinner.style.display = 'none';
    }
  });
}

// Inicializa quando DOM carregar
document.addEventListener('DOMContentLoaded', initLoginForm);
```

---

### 4. Validação de Campos

```javascript
// public/js/validators.js

/**
 * Valida email
 * @param {string} email
 * @returns {boolean}
 */
function validateEmail(email) {
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  
  if (!email) {
    showFieldError(emailInput, emailError, 'Email obrigatório');
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFieldError(emailInput, emailError, 'Email inválido');
    return false;
  }
  
  clearFieldError(emailInput, emailError);
  return true;
}

/**
 * Valida senha
 * @param {string} password
 * @returns {boolean}
 */
function validatePassword(password) {
  const passwordInput = document.getElementById('password');
  const passwordError = document.getElementById('password-error');
  
  if (!password) {
    showFieldError(passwordInput, passwordError, 'Senha obrigatória');
    return false;
  }
  
  if (password.length < 8) {
    showFieldError(passwordInput, passwordError, 'Mínimo 8 caracteres');
    return false;
  }
  
  clearFieldError(passwordInput, passwordError);
  return true;
}

/**
 * Mostra erro em campo
 */
function showFieldError(input, errorElement, message) {
  input.classList.add('error');
  errorElement.textContent = message;
  errorElement.style.display = 'block';
  
  // Shake animation
  input.classList.add('shake');
  setTimeout(() => input.classList.remove('shake'), 300);
}

/**
 * Limpa erro de campo
 */
function clearFieldError(input, errorElement) {
  input.classList.remove('error');
  errorElement.textContent = '';
  errorElement.style.display = 'none';
}
```

---

### 5. Sistema de Alertas

```javascript
// public/js/alerts.js

/**
 * Mostra alerta
 * @param {string} type - success, error, warning, info
 * @param {string} message - Mensagem do alerta
 * @param {number} duration - Duração em ms (0 = não auto-fecha)
 */
function showAlert(type, message, duration = 5000) {
  const container = document.getElementById('alert-container');
  
  // Cria elemento de alerta
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  alert.setAttribute('role', 'alert');
  
  // Ícones SVG por tipo
  const icons = {
    success: '<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>',
    error: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    warning: '<svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01M3 12a9 9 0 1 0 18 0"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };
  
  alert.innerHTML = `
    <div class="alert-icon">${icons[type]}</div>
    <div class="alert-message">${message}</div>
    <button class="alert-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  
  // Adiciona ao container
  container.appendChild(alert);
  
  // Animação de entrada
  setTimeout(() => alert.classList.add('show'), 10);
  
  // Botão de fechar
  const closeBtn = alert.querySelector('.alert-close');
  closeBtn.addEventListener('click', () => closeAlert(alert));
  
  // Auto-fecha
  if (duration > 0) {
    setTimeout(() => closeAlert(alert), duration);
  }
}

/**
 * Fecha alerta
 */
function closeAlert(alert) {
  alert.classList.remove('show');
  setTimeout(() => alert.remove(), 300);
}
```

---

## ⚛️ Implementação React

### 1. Componente de Login

```jsx
// src/components/Login/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input/Input';
import Button from '../ui/Button/Button';
import Alert from '../ui/Alert/Alert';
import useForm from '../../hooks/useForm';
import { authAPI } from '../../services/apiService';
import { validateLoginForm } from '../../utils/validators';

const Login = () => {
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);

  const handleLoginSubmit = async (values) => {
    try {
      // Chama API
      const response = await authAPI.login({
        email: values.email,
        password: values.password
      });

      // Salva token
      const token = response.data?.tokens?.accessToken;
      const storage = values.rememberMe ? localStorage : sessionStorage;
      
      if (token) {
        storage.setItem('authToken', token);
      }

      // Feedback sucesso
      setAlert({
        type: 'success',
        message: 'Login realizado com sucesso! Redirecionando...'
      });

      // Redireciona
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (error) {
      // Feedback erro
      setAlert({
        type: 'error',
        message: error.message || 'Erro ao fazer login. Tente novamente.'
      });
    }
  };

  const { getFieldProps, handleSubmit, isSubmitting } = useForm(
    { email: '', password: '', rememberMe: false },
    handleLoginSubmit,
    validateLoginForm
  );

  return (
    <div className={styles.container}>
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}
      
      <form onSubmit={handleSubmit}>
        <Input {...getFieldProps('email')} label="Email" type="email" />
        <Input {...getFieldProps('password')} label="Senha" type="password" showPasswordToggle />
        <Button type="submit" isLoading={isSubmitting}>Entrar</Button>
      </form>
    </div>
  );
};
```

---

### 2. Service de API (React)

```javascript
// src/services/apiService.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Obtém token do storage
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
    const errorMessage = data.error || data.message || `Erro ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

/**
 * Requisição genérica
 */
const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    credentials: 'include',
    ...options
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

/**
 * API de autenticação
 */
export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),
  
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  logout: () => request('/auth/logout', { method: 'POST' }),
  
  checkAuth: () => request('/auth/me')
};
```

---

## ❌ Tratamento de Erros

### Tipos de Erros

```javascript
/**
 * 1. Erros de Validação (400 Bad Request)
 */
{
  status: 400,
  error: "Validação falhou",
  details: {
    email: "Email inválido",
    password: "Senha muito curta"
  }
}

/**
 * 2. Erros de Autenticação (401 Unauthorized)
 */
{
  status: 401,
  error: "Email ou senha incorretos"
}

/**
 * 3. Erros de Servidor (500 Internal Server Error)
 */
{
  status: 500,
  error: "Erro interno do servidor"
}

/**
 * 4. Erros de Rede
 */
{
  name: "TypeError",
  message: "Failed to fetch"
}
```

---

### Tratamento por Tipo

```javascript
async function handleLogin(credentials) {
  try {
    const response = await login(credentials);
    // Sucesso
    showAlert('success', 'Login realizado!');
    
  } catch (error) {
    // 1. Erro de rede
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      showAlert('error', 'Erro de conexão. Verifique sua internet.');
      return;
    }
    
    // 2. Erro de validação (400)
    if (error.status === 400 && error.data?.details) {
      // Mostra erros nos campos
      Object.keys(error.data.details).forEach(field => {
        const fieldError = document.getElementById(`${field}-error`);
        if (fieldError) {
          fieldError.textContent = error.data.details[field];
        }
      });
      return;
    }
    
    // 3. Erro de autenticação (401)
    if (error.status === 401) {
      showAlert('error', 'Email ou senha incorretos');
      // Foca campo de senha
      document.getElementById('password').focus();
      return;
    }
    
    // 4. Erro genérico
    showAlert('error', error.message || 'Erro ao fazer login. Tente novamente.');
  }
}
```

---

### Retry Logic (Tentativas Automáticas)

```javascript
/**
 * Retry com exponential backoff
 */
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Sucesso
      if (response.ok) {
        return await response.json();
      }
      
      // Erro do servidor (5xx) - tenta novamente
      if (response.status >= 500 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000); // 1s, 2s, 4s
        continue;
      }
      
      // Erro do cliente (4xx) - não tenta novamente
      throw new Error(await response.text());
      
    } catch (error) {
      // Última tentativa
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // Aguarda antes de tentar novamente
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
```

---

## 🎨 Feedback Visual

### 1. Estados do Botão

```css
/* Normal */
.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  cursor: pointer;
}

/* Hover */
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

/* Loading */
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  pointer-events: none;
}

/* Success (após login) */
.btn-success {
  background: #10b981;
}

/* Error (após erro) */
.btn-error {
  background: #ef4444;
  animation: shake 0.3s ease;
}
```

---

### 2. Animações de Feedback

```css
/* Shake (erro) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

/* Pulse (loading) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Slide down (alert) */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 3. Progress Bar (Upload)

```html
<div class="progress-bar">
  <div class="progress-fill" id="upload-progress" style="width: 0%"></div>
</div>
```

```javascript
// Simula progresso
let progress = 0;
const interval = setInterval(() => {
  progress += 10;
  document.getElementById('upload-progress').style.width = `${progress}%`;
  
  if (progress >= 100) {
    clearInterval(interval);
  }
}, 200);
```

---

## 🔒 Segurança no Frontend

### 1. HTTPS Obrigatório

```javascript
// Força HTTPS em produção
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
```

---

### 2. Proteção contra XSS

```javascript
/**
 * Sanitiza input do usuário
 */
function sanitizeHTML(str) {
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

// Uso
const userInput = document.getElementById('email').value;
const safe = sanitizeHTML(userInput);
```

**Nunca use `innerHTML` com dados do usuário:**

```javascript
// ❌ PERIGOSO
element.innerHTML = userInput;

// ✅ SEGURO
element.textContent = userInput;
```

---

### 3. Proteção contra CSRF

```javascript
/**
 * Envia CSRF token nos headers
 */
async function login(credentials) {
  const csrfToken = getCookie('csrf_token');
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    credentials: 'include', // Envia cookies
    body: JSON.stringify(credentials)
  });
  
  return response.json();
}

/**
 * Obtém cookie por nome
 */
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```

---

### 4. Armazenamento Seguro de Tokens

```javascript
/**
 * ✅ MELHOR: httpOnly cookie (backend)
 * - Inacessível via JavaScript
 * - Protegido contra XSS
 * - Enviado automaticamente
 */

/**
 * ⚠️ ACEITÁVEL: localStorage/sessionStorage
 * - Acessível via JavaScript (vulnerável a XSS)
 * - Fácil de implementar
 * - Require HTTPS obrigatório
 */
function saveToken(token, remember = false) {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('authToken', token);
}

/**
 * ❌ EVITAR: Cookie sem httpOnly
 * - Acessível via JavaScript
 * - Vulnerável a XSS e CSRF
 */
```

---

### 5. Timeout de Sessão

```javascript
/**
 * Auto-logout após inatividade
 */
class SessionManager {
  constructor(timeoutMinutes = 30) {
    this.timeout = timeoutMinutes * 60 * 1000;
    this.timer = null;
    this.initActivityListeners();
  }

  initActivityListeners() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => this.resetTimer(), true);
    });
    
    this.resetTimer();
  }

  resetTimer() {
    clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.logout();
    }, this.timeout);
  }

  logout() {
    removeToken();
    showAlert('warning', 'Sessão expirada por inatividade');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 2000);
  }
}

// Inicializa
const sessionManager = new SessionManager(30); // 30 minutos
```

---

### 6. Rate Limiting (Frontend)

```javascript
/**
 * Limita tentativas de login
 */
class LoginThrottle {
  constructor(maxAttempts = 5, lockoutMinutes = 15) {
    this.maxAttempts = maxAttempts;
    this.lockoutTime = lockoutMinutes * 60 * 1000;
    this.attempts = this.getAttempts();
  }

  getAttempts() {
    const data = localStorage.getItem('loginAttempts');
    return data ? JSON.parse(data) : { count: 0, lockedUntil: null };
  }

  saveAttempts() {
    localStorage.setItem('loginAttempts', JSON.stringify(this.attempts));
  }

  isLocked() {
    if (this.attempts.lockedUntil && Date.now() < this.attempts.lockedUntil) {
      return true;
    }
    
    // Desbloqueou
    if (this.attempts.lockedUntil && Date.now() >= this.attempts.lockedUntil) {
      this.reset();
    }
    
    return false;
  }

  recordAttempt() {
    this.attempts.count++;
    
    if (this.attempts.count >= this.maxAttempts) {
      this.attempts.lockedUntil = Date.now() + this.lockoutTime;
    }
    
    this.saveAttempts();
  }

  reset() {
    this.attempts = { count: 0, lockedUntil: null };
    this.saveAttempts();
  }

  getRemainingTime() {
    if (!this.attempts.lockedUntil) return 0;
    return Math.ceil((this.attempts.lockedUntil - Date.now()) / 60000); // minutos
  }
}

// Uso
const throttle = new LoginThrottle(5, 15);

async function handleLogin(credentials) {
  // Verifica se está bloqueado
  if (throttle.isLocked()) {
    const minutes = throttle.getRemainingTime();
    showAlert('error', `Muitas tentativas. Tente novamente em ${minutes} minutos.`);
    return;
  }

  try {
    const response = await login(credentials);
    throttle.reset(); // Sucesso = reseta contador
    // ...
  } catch (error) {
    throttle.recordAttempt(); // Erro = incrementa contador
    // ...
  }
}
```

---

### 7. Validação Dupla (Client + Server)

```javascript
/**
 * ✅ Validação Client-Side (UX - feedback rápido)
 */
function validateEmail(email) {
  if (!email) return 'Email obrigatório';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email inválido';
  return null;
}

/**
 * ✅ Validação Server-Side (Segurança - NUNCA confie no cliente)
 */
// Backend faz validação novamente mesmo que o frontend tenha validado
```

---

## 🚀 Boas Práticas

### 1. Loading States

```javascript
// ✅ CERTO
button.disabled = true;
buttonText.textContent = 'Carregando...';
spinner.style.display = 'block';

try {
  await login(credentials);
} finally {
  // SEMPRE re-habilita (mesmo com erro)
  button.disabled = false;
  buttonText.textContent = 'Entrar';
  spinner.style.display = 'none';
}
```

---

### 2. Prevenir Double Submit

```javascript
let isSubmitting = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Previne múltiplos submits
  if (isSubmitting) return;
  isSubmitting = true;

  try {
    await login(credentials);
  } finally {
    isSubmitting = false;
  }
});
```

---

### 3. Autocomplete Correto

```html
<!-- Login -->
<input type="email" autocomplete="email" />
<input type="password" autocomplete="current-password" />

<!-- Registro -->
<input type="password" autocomplete="new-password" />
```

---

### 4. Mensagens de Erro Genéricas

```javascript
// ❌ ERRADO (vaza informação)
if (userNotFound) {
  return 'Email não encontrado';
}
if (passwordWrong) {
  return 'Senha incorreta';
}

// ✅ CERTO (não vaza se email existe)
return 'Email ou senha incorretos';
```

---

### 5. CORS Configurado

```javascript
// Backend deve ter CORS configurado
app.use(cors({
  origin: 'https://seu-dominio.com',
  credentials: true // Permite cookies
}));
```

---

### 6. Timeouts

```javascript
/**
 * Adiciona timeout às requisições
 */
function fetchWithTimeout(url, options, timeout = 30000) {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
}

// Uso
try {
  const response = await fetchWithTimeout(
    `${API_BASE_URL}/auth/login`,
    { method: 'POST', body: JSON.stringify(credentials) },
    10000 // 10 segundos
  );
} catch (error) {
  if (error.message === 'Timeout') {
    showAlert('error', 'Tempo de conexão esgotado. Tente novamente.');
  }
}
```

---

## 📋 Checklist de Segurança

- [ ] **HTTPS obrigatório** em produção
- [ ] **Validação dupla** (client + server)
- [ ] **Sanitização** de inputs (XSS)
- [ ] **CSRF protection** (tokens)
- [ ] **Rate limiting** (throttle)
- [ ] **Session timeout** (auto-logout)
- [ ] **Mensagens genéricas** (não vaza info)
- [ ] **Autocomplete correto** (HTML5)
- [ ] **CORS configurado** (backend)
- [ ] **Timeouts** configurados
- [ ] **Error handling** completo
- [ ] **Loading states** em todas ações
- [ ] **Prevenir double submit**
- [ ] **Token em httpOnly cookie** (ideal)
- [ ] **Content Security Policy** (CSP headers)

---

## 🎯 Exemplo Completo

```javascript
// Implementação completa de login seguro

class SecureLoginManager {
  constructor() {
    this.API_URL = 'https://api.seu-dominio.com';
    this.throttle = new LoginThrottle(5, 15);
    this.sessionManager = new SessionManager(30);
    this.initForm();
  }

  initForm() {
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(e) {
    e.preventDefault();

    // 1. Verifica throttle
    if (this.throttle.isLocked()) {
      this.showError(`Bloqueado. Aguarde ${this.throttle.getRemainingTime()} min.`);
      return;
    }

    // 2. Validação client-side
    const credentials = this.getCredentials();
    const errors = this.validate(credentials);
    if (errors) {
      this.showValidationErrors(errors);
      return;
    }

    // 3. Sanitização
    credentials.email = this.sanitize(credentials.email);

    // 4. Loading state
    this.setLoading(true);

    try {
      // 5. Requisição com timeout
      const response = await this.loginWithTimeout(credentials, 10000);

      // 6. Sucesso
      this.throttle.reset();
      this.saveToken(response.token, credentials.rememberMe);
      this.showSuccess('Login realizado!');
      
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1500);

    } catch (error) {
      // 7. Erro
      this.throttle.recordAttempt();
      this.handleError(error);
    } finally {
      // 8. Loading state
      this.setLoading(false);
    }
  }

  async loginWithTimeout(credentials, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': this.getCsrfToken()
        },
        credentials: 'include',
        signal: controller.signal,
        body: JSON.stringify(credentials)
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer login');
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Outros métodos: validate, sanitize, showError, etc.
}

// Inicializa
new SecureLoginManager();
```

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN - Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

**🔐 Documentação criada para garantir autenticação segura e robusta**
