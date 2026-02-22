/**
 * FORGOT-PASSWORD.JS - SCRIPT DE RECUPERAÇÃO DE SENHA
 * 
 * Responsabilidades:
 * - Validação de email
 * - Envio de solicitação de código de recuperação
 * - Tratamento de erros amigável
 * - UX: Loading states, mensagens de feedback
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
    API_URL: `${API_BASE_URL}/api/auth/forgot-password`,
};

// ==========================================
// ELEMENTOS DO DOM
// ==========================================

const elements = {
    form: document.getElementById('forgot-password-form'),
    emailInput: document.getElementById('email'),
    emailError: document.getElementById('email-error'),
    submitBtn: document.getElementById('submit-btn'),
    btnText: document.querySelector('.btn-text'),
    btnLoader: document.querySelector('.btn-loader'),
    alertContainer: document.getElementById('alert-container'),
};

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
 * Valida campo de email
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

// ==========================================
// API
// ==========================================

/**
 * Envia solicitação de código de recuperação
 */
async function requestPasswordReset(email) {
    try {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao solicitar recuperação de senha');
        }

        return data;
    } catch (error) {
        console.error('[FORGOT PASSWORD] Erro na requisição:', error);
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
    
    console.log('[FORGOT PASSWORD] Iniciando envio...');
    
    // Limpar alertas anteriores
    clearAlerts();
    
    // Validar email
    if (!validateEmailField()) {
        console.log('[FORGOT PASSWORD] Validação falhou');
        return;
    }
    
    const email = elements.emailInput.value.trim();
    
    // Ativar loading
    setLoadingState(true);
    
    try {
        console.log('[FORGOT PASSWORD] Enviando requisição...');
        
        // Enviar solicitação
        const data = await requestPasswordReset(email);
        
        console.log('[FORGOT PASSWORD] Código enviado com sucesso!');
        
        // Mostrar mensagem de sucesso
        showSuccessAlert(data.message || 'Código enviado para seu email!');
        
        // Salvar email no localStorage para usar na próxima página
        localStorage.setItem('resetEmail', email);
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = 'reset-password.html';
        }, 2000);
        
    } catch (error) {
        console.error('[FORGOT PASSWORD] Erro:', error);
        
        // Mostrar erro
        showErrorAlert(error.message || 'Erro ao enviar código. Tente novamente.');
        
    } finally {
        // Desativar loading
        setLoadingState(false);
    }
}

/**
 * Validação em tempo real do email
 */
elements.emailInput.addEventListener('blur', validateEmailField);
elements.emailInput.addEventListener('input', () => {
    if (elements.emailInput.classList.contains('error')) {
        validateEmailField();
    }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

// Event listener do formulário
elements.form.addEventListener('submit', handleSubmit);

// Focus no campo de email ao carregar
elements.emailInput.focus();

console.log('[FORGOT PASSWORD] Script inicializado');
