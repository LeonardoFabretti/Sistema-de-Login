/**
 * LOGIN.JS - SCRIPT DE AUTENTICAÇÃO
 * 
 * Responsabilidades:
 * - Validação de formulário em tempo real
 * - Envio de credenciais para API
 * - Tratamento de erros amigável
 * - UX: Loading states, mensagens de feedback
 * - Segurança: Sanitização, rate limiting do lado do cliente
 */

// ==========================================
// CONFIGURAÇÕES
// ==========================================

// Detectar ambiente: localhost ou produção (GitHub Pages)
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:5000' 
  : 'https://empowering-solace-production-c913.up.railway.app';

const CONFIG = {
    API_URL: `${API_BASE_URL}/api/auth/login`,
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutos em ms
    MIN_PASSWORD_LENGTH: 8,
};

// ==========================================
// ELEMENTOS DO DOM
// ==========================================

const elements = {
    form: document.getElementById('login-form'),
    emailInput: document.getElementById('email'),
    passwordInput: document.getElementById('password'),
    emailError: document.getElementById('email-error'),
    passwordError: document.getElementById('password-error'),
    btnLogin: document.getElementById('btn-login'),
    btnText: document.querySelector('.btn-text'),
    btnLoader: document.querySelector('.btn-loader'),
    togglePassword: document.querySelector('.toggle-password'),
    rememberMe: document.getElementById('remember-me'),
    alertContainer: document.getElementById('alert-container'),
};

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================

let loginAttempts = parseInt(localStorage.getItem('loginAttempts') || '0');
let lockoutUntil = parseInt(localStorage.getItem('lockoutUntil') || '0');

// ==========================================
// VALIDAÇÃO
// ==========================================

/**
 * Valida formato de email
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valida senha (comprimento mínimo)
 */
function validatePassword(password) {
    return password.length >= CONFIG.MIN_PASSWORD_LENGTH;
}

/**
 * Mostra erro de campo
 */
function showFieldError(inputElement, errorElement, message) {
    inputElement.classList.add('error');
    errorElement.textContent = message;
    errorElement.classList.add('visible');
}

/**
 * Limpa erro de campo
 */
function clearFieldError(inputElement, errorElement) {
    inputElement.classList.remove('error');
    errorElement.textContent = '';
    errorElement.classList.remove('visible');
}

/**
 * Valida campo de email em tempo real
 */
function validateEmailField() {
    const email = elements.emailInput.value.trim();
    
    if (!email) {
        showFieldError(elements.emailInput, elements.emailError, 'Email é obrigatório');
        return false;
    }
    
    if (!validateEmail(email)) {
        showFieldError(elements.emailInput, elements.emailError, 'Email inválido');
        return false;
    }
    
    clearFieldError(elements.emailInput, elements.emailError);
    return true;
}

/**
 * Valida campo de senha em tempo real
 */
function validatePasswordField() {
    const password = elements.passwordInput.value;
    
    if (!password) {
        showFieldError(elements.passwordInput, elements.passwordError, 'Senha é obrigatória');
        return false;
    }
    
    if (!validatePassword(password)) {
        showFieldError(
            elements.passwordInput, 
            elements.passwordError, 
            `Senha deve ter no mínimo ${CONFIG.MIN_PASSWORD_LENGTH} caracteres`
        );
        return false;
    }
    
    clearFieldError(elements.passwordInput, elements.passwordError);
    return true;
}

// ==========================================
// ALERTAS
// ==========================================

/**
 * Mostra alerta global
 */
function showAlert(message, type = 'error') {
    const alertHTML = `
        <div class="alert alert-${type}" role="alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${type === 'error' 
                    ? '<path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM11 14H9V12H11V14ZM11 10H9V6H11V10Z" fill="currentColor"/>'
                    : '<path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM8 14L4 10L5.41 8.59L8 11.17L14.59 4.58L16 6L8 14Z" fill="currentColor"/>'
                }
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    elements.alertContainer.innerHTML = alertHTML;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        elements.alertContainer.innerHTML = '';
    }, 5000);
}

/**
 * Limpa todos os alertas
 */
function clearAlerts() {
    elements.alertContainer.innerHTML = '';
}

// ==========================================
// RATE LIMITING DO LADO DO CLIENTE
// ==========================================

/**
 * Verifica se usuário está bloqueado
 */
function isLockedOut() {
    const now = Date.now();
    
    if (lockoutUntil > now) {
        const remainingMinutes = Math.ceil((lockoutUntil - now) / 60000);
        showAlert(
            `Muitas tentativas falhas. Tente novamente em ${remainingMinutes} minuto(s).`,
            'error'
        );
        return true;
    }
    
    // Limpar lockout se expirou
    if (lockoutUntil > 0 && lockoutUntil <= now) {
        lockoutUntil = 0;
        loginAttempts = 0;
        localStorage.removeItem('lockoutUntil');
        localStorage.setItem('loginAttempts', '0');
    }
    
    return false;
}

/**
 * Registra tentativa de login falha
 */
function recordFailedAttempt() {
    loginAttempts++;
    localStorage.setItem('loginAttempts', loginAttempts.toString());
    
    if (loginAttempts >= CONFIG.MAX_LOGIN_ATTEMPTS) {
        lockoutUntil = Date.now() + CONFIG.LOCKOUT_DURATION;
        localStorage.setItem('lockoutUntil', lockoutUntil.toString());
        showAlert(
            `Limite de tentativas excedido. Aguarde ${CONFIG.LOCKOUT_DURATION / 60000} minutos.`,
            'error'
        );
    } else {
        const remaining = CONFIG.MAX_LOGIN_ATTEMPTS - loginAttempts;
        showAlert(
            `Email ou senha incorretos. ${remaining} tentativa(s) restante(s).`,
            'error'
        );
    }
}

/**
 * Reseta tentativas após login bem-sucedido
 */
function resetAttempts() {
    loginAttempts = 0;
    lockoutUntil = 0;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutUntil');
}

// ==========================================
// LOADING STATE
// ==========================================

/**
 * Ativa estado de loading
 */
function setLoadingState(isLoading) {
    elements.btnLogin.disabled = isLoading;
    
    if (isLoading) {
        elements.btnText.style.display = 'none';
        elements.btnLoader.style.display = 'block';
    } else {
        elements.btnText.style.display = 'block';
        elements.btnLoader.style.display = 'none';
    }
}

// ==========================================
// SUBMISSÃO DE FORMULÁRIO
// ==========================================

/**
 * Envia credenciais para API
 */
async function submitLogin(email, password) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Incluir cookies
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Login bem-sucedido
            resetAttempts();
            showAlert('✓ Logado com Sucesso!', 'success');
            
            // Animar cadeado abrindo
            const lockLogo = document.getElementById('lock-logo');
            if (lockLogo) {
                lockLogo.classList.add('unlocked');
            }
            
            // Salvar dados do usuário e token
            const storage = elements.rememberMe.checked ? localStorage : sessionStorage;
            storage.setItem('accessToken', data.data.accessToken);
            storage.setItem('userData', JSON.stringify(data.data.user));
            
            // Redirecionar após 1.5 segundos (tempo para ver a animação)
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
            
        } else {
            // Login falhou
            recordFailedAttempt();
            
            // Mensagem personalizada baseada no erro
            let errorMessage = 'Email ou senha incorretos';
            
            if (response.status === 429) {
                errorMessage = 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
            } else if (response.status === 500) {
                errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
            } else if (data.error && data.error.message) {
                // NÃO revelar se email existe ou não (segurança)
                errorMessage = 'Email ou senha incorretos';
            }
            
            showAlert(errorMessage, 'error');
        }
        
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showAlert('Erro de conexão. Verifique sua internet e tente novamente.', 'error');
    }
}

/**
 * Handler de submissão do formulário
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    // Verificar lockout
    if (isLockedOut()) {
        return;
    }
    
    // Limpar alertas anteriores
    clearAlerts();
    
    // Validar campos
    const isEmailValid = validateEmailField();
    const isPasswordValid = validatePasswordField();
    
    if (!isEmailValid || !isPasswordValid) {
        return;
    }
    
    // Obter valores
    const email = elements.emailInput.value.trim().toLowerCase();
    const password = elements.passwordInput.value;
    
    // Ativar loading
    setLoadingState(true);
    
    // Enviar para API
    await submitLogin(email, password);
    
    // Desativar loading
    setLoadingState(false);
}

// ==========================================
// TOGGLE PASSWORD VISIBILITY
// ==========================================

/**
 * Alterna visibilidade da senha
 */
function togglePasswordVisibility() {
    const type = elements.passwordInput.getAttribute('type');
    
    if (type === 'password') {
        elements.passwordInput.setAttribute('type', 'text');
        elements.togglePassword.setAttribute('aria-label', 'Ocultar senha');
    } else {
        elements.passwordInput.setAttribute('type', 'password');
        elements.togglePassword.setAttribute('aria-label', 'Mostrar senha');
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

/**
 * Inicializa event listeners
 */
function initEventListeners() {
    // Submissão do formulário
    elements.form.addEventListener('submit', handleSubmit);
    
    // Validação em tempo real
    elements.emailInput.addEventListener('blur', validateEmailField);
    elements.passwordInput.addEventListener('blur', validatePasswordField);
    
    // Limpar erros ao digitar
    elements.emailInput.addEventListener('input', () => {
        if (elements.emailError.classList.contains('visible')) {
            clearFieldError(elements.emailInput, elements.emailError);
        }
    });
    
    elements.passwordInput.addEventListener('input', () => {
        if (elements.passwordError.classList.contains('visible')) {
            clearFieldError(elements.passwordInput, elements.passwordError);
        }
    });
    
    // Toggle password visibility
    elements.togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // Enter para submit (acessibilidade)
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

/**
 * Inicializa a aplicação
 */
function init() {
    // Verificar se já está autenticado
    /*
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (token) {
        // Redirecionar para dashboard (usuário já está logado)
        window.location.href = '/dashboard.html';
        return;
    }
    */
    
    // Verificar lockout ao carregar
    if (isLockedOut()) {
        elements.btnLogin.disabled = true;
    }
    
    // Inicializar listeners
    initEventListeners();
    
    // Focar no campo de email
    elements.emailInput.focus();
    
    console.log('✅ Login page initialized');
}

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
