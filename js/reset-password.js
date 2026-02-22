/**
 * RESET-PASSWORD.JS - SCRIPT DE REDEFINIÇÃO DE SENHA
 * 
 * Responsabilidades:
 * - Validação de código de verificação
 * - Validação de senha forte
 * - Validação de confirmação de senha
 * - Envio de nova senha para API
 * - Tratamento de erros amigável
 * - UX: Loading states, toggle de senha, feedback em tempo real
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
    RESET_PASSWORD_URL: `${API_BASE_URL}/api/auth/reset-password`,
    RESEND_CODE_URL: `${API_BASE_URL}/api/auth/forgot-password`,
    MIN_PASSWORD_LENGTH: 8,
    CODE_LENGTH: 6,
};

// ==========================================
// ELEMENTOS DO DOM
// ==========================================

const elements = {
    form: document.getElementById('reset-password-form'),
    codeInput: document.getElementById('code'),
    passwordInput: document.getElementById('password'),
    confirmPasswordInput: document.getElementById('confirmPassword'),
    codeError: document.getElementById('code-error'),
    passwordError: document.getElementById('password-error'),
    confirmPasswordError: document.getElementById('confirm-password-error'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: document.querySelector('.btn-text'),
    btnLoader: document.querySelector('.btn-loader'),
    togglePassword: document.getElementById('toggle-password'),
    toggleConfirmPassword: document.getElementById('toggle-confirm-password'),
    alertContainer: document.getElementById('alert-container'),
    userEmail: document.getElementById('user-email'),
    resendCodeLink: document.getElementById('resend-code'),
    
    // Requisitos de senha
    passwordRequirements: document.getElementById('password-requirements'),
    reqLength: document.getElementById('req-length'),
    reqUppercase: document.getElementById('req-uppercase'),
    reqLowercase: document.getElementById('req-lowercase'),
    reqNumber: document.getElementById('req-number'),
    reqSpecial: document.getElementById('req-special'),
};

// ==========================================
// ESTADO DA APLICAÇÃO
// ==========================================

let userEmail = '';

// ==========================================
// VALIDAÇÃO
// ==========================================

/**
 * Valida código de 6 dígitos
 */
function validateCode(code) {
    return /^\d{6}$/.test(code);
}

/**
 * Valida requisitos de senha forte
 */
function validatePasswordRequirements(password) {
    return {
        length: password.length >= CONFIG.MIN_PASSWORD_LENGTH,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };
}

/**
 * Valida se senha é forte o suficiente
 */
function validatePasswordStrength(password) {
    const requirements = validatePasswordRequirements(password);
    return Object.values(requirements).every(Boolean);
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
 * Valida campo de código
 */
function validateCodeField() {
    const code = elements.codeInput.value.trim();
    
    if (!code) {
        showFieldError(elements.codeInput, elements.codeError, 'Código é obrigatório');
        return false;
    }
    
    if (!validateCode(code)) {
        showFieldError(elements.codeInput, elements.codeError, 'Código deve ter 6 dígitos');
        return false;
    }
    
    clearFieldError(elements.codeInput, elements.codeError);
    return true;
}

/**
 * Valida campo de senha
 */
function validatePasswordField() {
    const password = elements.passwordInput.value;
    
    if (!password) {
        showFieldError(elements.passwordInput, elements.passwordError, 'Senha é obrigatória');
        return false;
    }
    
    if (!validatePasswordStrength(password)) {
        showFieldError(elements.passwordInput, elements.passwordError, 'Senha não atende aos requisitos');
        return false;
    }
    
    clearFieldError(elements.passwordInput, elements.passwordError);
    return true;
}

/**
 * Valida campo de confirmação de senha
 */
function validateConfirmPasswordField() {
    const password = elements.passwordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;
    
    if (!confirmPassword) {
        showFieldError(elements.confirmPasswordInput, elements.confirmPasswordError, 'Confirme sua senha');
        return false;
    }
    
    if (password !== confirmPassword) {
        showFieldError(elements.confirmPasswordInput, elements.confirmPasswordError, 'As senhas não coincidem');
        return false;
    }
    
    clearFieldError(elements.confirmPasswordInput, elements.confirmPasswordError);
    return true;
}

/**
 * Atualiza requisitos visuais de senha
 */
function updatePasswordRequirements(password) {
    const requirements = validatePasswordRequirements(password);
    
    // Atualizar cada requisito
    updateRequirement(elements.reqLength, requirements.length);
    updateRequirement(elements.reqUppercase, requirements.uppercase);
    updateRequirement(elements.reqLowercase, requirements.lowercase);
    updateRequirement(elements.reqNumber, requirements.number);
    updateRequirement(elements.reqSpecial, requirements.special);
}

/**
 * Atualiza estado visual de um requisito
 */
function updateRequirement(element, isMet) {
    if (isMet) {
        element.classList.add('met');
        element.querySelector('.req-icon').innerHTML = `
            <circle cx="8" cy="8" r="7" fill="#10B981" stroke="#10B981" stroke-width="1.5"/>
            <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    } else {
        element.classList.remove('met');
        element.querySelector('.req-icon').innerHTML = `
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>
        `;
    }
}

// ==========================================
// ALERTAS
// ==========================================

/**
 * Mostra alerta de sucesso
 */
function showSuccessAlert(message) {
    elements.alertContainer.innerHTML = `
        <div class="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.1"/>
                <path d="M6 10L9 13L14 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div class="alert-content">
                <strong>Sucesso!</strong>
                <span>${message}</span>
            </div>
        </div>
    `;
}

/**
 * Mostra alerta de erro
 */
function showErrorAlert(message) {
    elements.alertContainer.innerHTML = `
        <div class="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.1"/>
                <path d="M10 6V10M10 14H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="alert-content">
                <strong>Erro</strong>
                <span>${message}</span>
            </div>
        </div>
    `;
}

/**
 * Mostra alerta de informação
 */
function showInfoAlert(message) {
    elements.alertContainer.innerHTML = `
        <div class="alert alert-info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.1"/>
                <path d="M10 10V14M10 6H10.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div class="alert-content">
                <strong>Atenção</strong>
                <span>${message}</span>
            </div>
        </div>
    `;
}

/**
 * Limpa alertas
 */
function clearAlerts() {
    elements.alertContainer.innerHTML = '';
}

// ==========================================
// UI HELPERS
// ==========================================

/**
 * Ativa estado de loading no botão
 */
function setLoadingState(isLoading) {
    if (isLoading) {
        elements.submitBtn.disabled = true;
        elements.btnText.style.display = 'none';
        elements.btnLoader.style.display = 'flex';
    } else {
        elements.submitBtn.disabled = false;
        elements.btnText.style.display = 'inline';
        elements.btnLoader.style.display = 'none';
    }
}

/**
 * Toggle visibilidade de senha
 */
function setupPasswordToggle(toggleButton, passwordInput) {
    toggleButton.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        
        // Atualizar ícone
        const eyeOpen = toggleButton.querySelectorAll('.eye-open');
        const eyeClosed = toggleButton.querySelectorAll('.eye-closed');
        
        if (type === 'text') {
            eyeOpen.forEach(el => el.style.display = 'none');
            eyeClosed.forEach(el => el.style.display = 'block');
            toggleButton.setAttribute('aria-label', 'Ocultar senha');
        } else {
            eyeOpen.forEach(el => el.style.display = 'block');
            eyeClosed.forEach(el => el.style.display = 'none');
            toggleButton.setAttribute('aria-label', 'Mostrar senha');
        }
    });
}

// ==========================================
// API
// ==========================================

/**
 * Redefine a senha
 */
async function resetPassword(email, code, newPassword) {
    try {
        const response = await fetch(CONFIG.RESET_PASSWORD_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ 
                email, 
                code, 
                newPassword 
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao redefinir senha');
        }

        return data;
    } catch (error) {
        console.error('[RESET PASSWORD] Erro na requisição:', error);
        throw error;
    }
}

/**
 * Reenvia código de verificação
 */
async function resendCode(email) {
    try {
        const response = await fetch(CONFIG.RESEND_CODE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao reenviar código');
        }

        return data;
    } catch (error) {
        console.error('[RESET PASSWORD] Erro ao reenviar código:', error);
        throw error;
    }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

/**
 * Handler de submit do formulário
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('[RESET PASSWORD] Iniciando envio...');
    
    // Limpar alertas anteriores
    clearAlerts();
    
    // Validar todos os campos
    const isCodeValid = validateCodeField();
    const isPasswordValid = validatePasswordField();
    const isConfirmValid = validateConfirmPasswordField();
    
    if (!isCodeValid || !isPasswordValid || !isConfirmValid) {
        console.log('[RESET PASSWORD] Validação falhou');
        return;
    }
    
    const code = elements.codeInput.value.trim();
    const newPassword = elements.passwordInput.value;
    
    // Ativar loading
    setLoadingState(true);
    
    try {
        console.log('[RESET PASSWORD] Enviando requisição...');
        
        // Redefinir senha
        const data = await resetPassword(userEmail, code, newPassword);
        
        console.log('[RESET PASSWORD] Senha redefinida com sucesso!');
        
        // Mostrar mensagem de sucesso
        showSuccessAlert(data.message || 'Senha redefinida com sucesso!');
        
        // Limpar email do localStorage
        localStorage.removeItem('resetEmail');
        
        // Redirecionar para login após 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('[RESET PASSWORD] Erro:', error);
        
        // Mostrar erro
        showErrorAlert(error.message || 'Erro ao redefinir senha. Verifique o código e tente novamente.');
        
    } finally {
        // Desativar loading
        setLoadingState(false);
    }
}

/**
 * Handler de reenvio de código
 */
async function handleResendCode(e) {
    e.preventDefault();
    
    if (!userEmail) {
        showErrorAlert('Email não encontrado. Por favor, inicie o processo novamente.');
        return;
    }
    
    try {
        showInfoAlert('Reenviando código...');
        
        await resendCode(userEmail);
        
        showSuccessAlert('Código reenviado com sucesso! Verifique seu email.');
    } catch (error) {
        showErrorAlert(error.message || 'Erro ao reenviar código.');
    }
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Formulário
elements.form.addEventListener('submit', handleSubmit);

// Validação em tempo real
elements.codeInput.addEventListener('blur', validateCodeField);
elements.codeInput.addEventListener('input', () => {
    // Apenas números
    elements.codeInput.value = elements.codeInput.value.replace(/\D/g, '');
    
    if (elements.codeInput.classList.contains('error')) {
        validateCodeField();
    }
});

elements.passwordInput.addEventListener('input', () => {
    updatePasswordRequirements(elements.passwordInput.value);
    
    if (elements.passwordInput.classList.contains('error')) {
        validatePasswordField();
    }
    
    // Revalidar confirmação se já foi preenchida
    if (elements.confirmPasswordInput.value) {
        validateConfirmPasswordField();
    }
});

elements.passwordInput.addEventListener('blur', validatePasswordField);

elements.confirmPasswordInput.addEventListener('input', () => {
    if (elements.confirmPasswordInput.classList.contains('error')) {
        validateConfirmPasswordField();
    }
});

elements.confirmPasswordInput.addEventListener('blur', validateConfirmPasswordField);

// Toggle de visibilidade de senha
setupPasswordToggle(elements.togglePassword, elements.passwordInput);
setupPasswordToggle(elements.toggleConfirmPassword, elements.confirmPasswordInput);

// Reenviar código
elements.resendCodeLink.addEventListener('click', handleResendCode);

// ==========================================
// INICIALIZAÇÃO
// ==========================================

/**
 * Inicializa a página
 */
function init() {
    // Recuperar email do localStorage
    userEmail = localStorage.getItem('resetEmail');
    
    if (!userEmail) {
        // Se não tem email, redirecionar para forgot-password
        showErrorAlert('Sessão expirada. Por favor, solicite um novo código.');
        setTimeout(() => {
            window.location.href = 'esqueceu-a-senha.html';
        }, 2000);
        return;
    }
    
    // Mostrar email na página (mascarado)
    const maskedEmail = userEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3');
    elements.userEmail.textContent = maskedEmail;
    
    // Inicializar requisitos de senha
    updatePasswordRequirements('');
    
    // Configurar ícones de eye (inicialmete closed escondido)
    document.querySelectorAll('.eye-closed').forEach(el => el.style.display = 'none');
    
    // Focus no campo de código
    elements.codeInput.focus();
    
    console.log('[RESET PASSWORD] Script inicializado');
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
