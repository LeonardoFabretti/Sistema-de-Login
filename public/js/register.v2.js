/**
 * REGISTER PAGE JAVASCRIPT
 * 
 * Funcionalidades:
 * - Validação de nome completo
 * - Validação de email
 * - Validação de força de senha (uppercase, lowercase, number, special)
 * - Feedback visual de força de senha
 * - Validação de confirmação de senha
 * - Validação de checkbox de termos
 * - Autenticação via API
 * - Toggle de visibilidade de senha
 * - Feedback visual em tempo real
 */

/* ===================================
   1. CONFIGURAÇÃO
   =================================== */

const CONFIG = {
  API_URL: 'https://empowering-solace-production-c913.up.railway.app/auth/register',
  MIN_NAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 8,
};

/* ===================================
   2. ELEMENTOS DOM
   =================================== */

const elements = {
  // Formulário
  form: document.getElementById('register-form'),
  
  // Inputs
  nameInput: document.getElementById('name'),
  emailInput: document.getElementById('email'),
  passwordInput: document.getElementById('password'),
  confirmPasswordInput: document.getElementById('confirm-password'),
  termsCheckbox: document.getElementById('terms'),
  
  // Errors
  nameError: document.getElementById('name-error'),
  emailError: document.getElementById('email-error'),
  passwordError: document.getElementById('password-error'),
  confirmPasswordError: document.getElementById('confirm-password-error'),
  termsError: document.getElementById('terms-error'),
  
  // Botões
  btnRegister: document.getElementById('btn-register'),
  btnText: document.getElementById('btn-text'),
  btnLoader: document.getElementById('btn-loader'),
  togglePassword: document.getElementById('toggle-password'),
  toggleConfirmPassword: document.getElementById('toggle-confirm-password'),
  
  // Password strength
  passwordStrengthFill: document.getElementById('password-strength-fill'),
  passwordStrengthText: document.getElementById('password-strength-text'),
  passwordRequirements: document.getElementById('password-requirements'),
  requirementLength: document.getElementById('requirement-length'),
  requirementUppercase: document.getElementById('requirement-uppercase'),
  requirementLowercase: document.getElementById('requirement-lowercase'),
  requirementNumber: document.getElementById('requirement-number'),
  requirementSpecial: document.getElementById('requirement-special'),
  
  // Alertas
  alertContainer: document.getElementById('alert-container'),
};

/* ===================================
   3. VALIDAÇÃO DE CAMPOS
   =================================== */

/**
 * Valida nome completo
 * @param {string} name - Nome a validar
 * @returns {boolean} - True se válido
 */
function validateName(name) {
  if (!name || name.trim().length === 0) {
    return false;
  }
  
  // Mínimo 3 caracteres e pelo menos um espaço (nome + sobrenome)
  const trimmedName = name.trim();
  return trimmedName.length >= CONFIG.MIN_NAME_LENGTH && /\s/.test(trimmedName);
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True se válido
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida requisitos de senha forte
 * @param {string} password - Senha a validar
 * @returns {object} - Objeto com requisitos atendidos
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
 * Calcula força da senha
 * @param {string} password - Senha a analisar
 * @returns {object} - {level: string, score: number}
 */
function calculatePasswordStrength(password) {
  if (!password) {
    return { level: '', score: 0 };
  }
  
  const requirements = validatePasswordRequirements(password);
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  if (metRequirements <= 2) {
    return { level: 'weak', score: 1 };
  } else if (metRequirements === 3) {
    return { level: 'fair', score: 2 };
  } else if (metRequirements === 4) {
    return { level: 'good', score: 3 };
  } else {
    return { level: 'strong', score: 4 };
  }
}

/**
 * Valida se senha é forte o suficiente
 * @param {string} password - Senha a validar
 * @returns {boolean} - True se forte
 */
function validatePasswordStrength(password) {
  const requirements = validatePasswordRequirements(password);
  return Object.values(requirements).every(Boolean);
}

/**
 * Valida se senhas coincidem
 * @param {string} password - Senha original
 * @param {string} confirmPassword - Confirmação
 * @returns {boolean} - True se iguais
 */
function validatePasswordMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0;
}

/* ===================================
   4. FEEDBACK VISUAL DE ERROS
   =================================== */

/**
 * Mostra erro em um campo
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error message element
 * @param {string} message - Mensagem de erro
 */
function showFieldError(input, errorElement, message) {
  input.classList.add('error');
  input.classList.remove('success');
  errorElement.textContent = message;
  errorElement.classList.add('visible');
}

/**
 * Limpa erro de um campo
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error message element
 */
function clearFieldError(input, errorElement) {
  input.classList.remove('error');
  errorElement.textContent = '';
  errorElement.classList.remove('visible');
}

/**
 * Marca campo como válido
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error message element
 */
function markFieldSuccess(input, errorElement) {
  input.classList.remove('error');
  input.classList.add('success');
  clearFieldError(input, errorElement);
}

/* ===================================
   5. VALIDAÇÃO DE CAMPOS INDIVIDUAIS
   =================================== */

/**
 * Valida campo de nome
 */
function validateNameField() {
  const name = elements.nameInput.value.trim();
  
  if (!name) {
    showFieldError(elements.nameInput, elements.nameError, 'Digite seu nome completo');
    return false;
  }
  
  if (!validateName(name)) {
    if (name.length < CONFIG.MIN_NAME_LENGTH) {
      showFieldError(elements.nameInput, elements.nameError, 'Nome muito curto (mínimo 3 caracteres)');
    } else if (!/\s/.test(name)) {
      showFieldError(elements.nameInput, elements.nameError, 'Digite nome e sobrenome');
    } else {
      showFieldError(elements.nameInput, elements.nameError, 'Nome inválido');
    }
    return false;
  }
  
  markFieldSuccess(elements.nameInput, elements.nameError);
  return true;
}

/**
 * Valida campo de email
 */
function validateEmailField() {
  const email = elements.emailInput.value.trim().toLowerCase();
  
  if (!email) {
    showFieldError(elements.emailInput, elements.emailError, 'Digite seu email');
    return false;
  }
  
  if (!validateEmail(email)) {
    showFieldError(elements.emailInput, elements.emailError, 'Digite um email válido');
    return false;
  }
  
  markFieldSuccess(elements.emailInput, elements.emailError);
  return true;
}

/**
 * Valida campo de senha
 */
function validatePasswordField() {
  const password = elements.passwordInput.value;
  
  if (!password) {
    showFieldError(elements.passwordInput, elements.passwordError, 'Digite uma senha');
    return false;
  }
  
  if (!validatePasswordStrength(password)) {
    showFieldError(elements.passwordInput, elements.passwordError, 'Senha não atende todos os requisitos');
    return false;
  }
  
  markFieldSuccess(elements.passwordInput, elements.passwordError);
  
  // Revalidar confirmação se já foi preenchida
  if (elements.confirmPasswordInput.value) {
    validateConfirmPasswordField();
  }
  
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
  
  if (!validatePasswordMatch(password, confirmPassword)) {
    showFieldError(elements.confirmPasswordInput, elements.confirmPasswordError, 'As senhas não coincidem');
    return false;
  }
  
  markFieldSuccess(elements.confirmPasswordInput, elements.confirmPasswordError);
  return true;
}

/**
 * Valida checkbox de termos
 */
function validateTermsField() {
  if (!elements.termsCheckbox.checked) {
    showFieldError(elements.termsCheckbox, elements.termsError, 'Você deve aceitar os termos de uso');
    return false;
  }
  
  clearFieldError(elements.termsCheckbox, elements.termsError);
  return true;
}

/* ===================================
   6. FEEDBACK DE FORÇA DE SENHA
   =================================== */

/**
 * Atualiza indicador visual de força de senha
 * @param {string} password - Senha atual
 */
function updatePasswordStrength(password) {
  const { level, score } = calculatePasswordStrength(password);
  
  // Remover classes anteriores
  elements.passwordStrengthFill.classList.remove('weak', 'fair', 'good', 'strong');
  elements.passwordStrengthText.classList.remove('weak', 'fair', 'good', 'strong');
  
  if (!password) {
    elements.passwordStrengthText.textContent = '';
    return;
  }
  
  // Adicionar nova classe
  elements.passwordStrengthFill.classList.add(level);
  elements.passwordStrengthText.classList.add(level);
  
  // Textos de feedback
  const strengthTexts = {
    weak: 'Senha fraca',
    fair: 'Senha razoável',
    good: 'Senha boa',
    strong: 'Senha forte',
  };
  
  elements.passwordStrengthText.textContent = strengthTexts[level] || '';
}

/**
 * Atualiza requisitos visuais de senha
 * @param {string} password - Senha atual
 */
function updatePasswordRequirements(password) {
  const requirements = validatePasswordRequirements(password);
  
  // Atualizar cada requisito
  updateRequirement(elements.requirementLength, requirements.length);
  updateRequirement(elements.requirementUppercase, requirements.uppercase);
  updateRequirement(elements.requirementLowercase, requirements.lowercase);
  updateRequirement(elements.requirementNumber, requirements.number);
  updateRequirement(elements.requirementSpecial, requirements.special);
}

/**
 * Atualiza estado visual de um requisito
 * @param {HTMLElement} element - Elemento do requisito
 * @param {boolean} met - Se requisito foi atendido
 */
function updateRequirement(element, met) {
  if (met) {
    element.classList.add('met');
  } else {
    element.classList.remove('met');
  }
}

/* ===================================
   7. ALERTAS GLOBAIS
   =================================== */

/**
 * Mostra alerta global
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: 'error', 'success', 'info'
 */
function showAlert(message, type = 'error') {
  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  const icon = type === 'error' 
    ? '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>'
    : type === 'success'
    ? '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>'
    : '<svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>';
  
  alert.innerHTML = `${icon}<span>${message}</span>`;
  
  elements.alertContainer.appendChild(alert);
  
  // Auto-remover após 5 segundos
  setTimeout(() => {
    alert.style.opacity = '0';
    setTimeout(() => alert.remove(), 300);
  }, 5000);
}

/**
 * Limpa todos os alertas
 */
function clearAlerts() {
  elements.alertContainer.innerHTML = '';
}

/* ===================================
   8. LOADING STATE
   =================================== */

/**
 * Define estado de loading do botão
 * @param {boolean} isLoading - Se está carregando
 */
function setLoadingState(isLoading) {
  if (isLoading) {
    elements.btnRegister.disabled = true;
    elements.btnText.style.display = 'none';
    elements.btnLoader.style.display = 'flex';
  } else {
    elements.btnRegister.disabled = false;
    elements.btnText.style.display = 'block';
    elements.btnLoader.style.display = 'none';
  }
}

/* ===================================
   9. AUTENTICAÇÃO (API)
   =================================== */

/**
 * Envia dados de cadastro para API
 * @param {object} data - Dados do formulário
 */
async function submitRegister(data) {
  try {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Sucesso
      showAlert('✓ Conta criada com sucesso! Redirecionando...', 'success');
      
     showAlert('✓ Conta criada com sucesso! Faça login para continuar.', 'success');

setTimeout(() => {
  window.location.href = 'index.html'; // página de login
}, 1500);

      
    } else {
      // Erro do servidor
      const errorMessage = result.error || result.message || 'Erro ao criar conta';
      
      // Mensagens específicas
      if (response.status === 409) {
        showAlert('❌ Este email já está cadastrado', 'error');
      } else if (response.status === 400) {
        showAlert(`❌ ${errorMessage}`, 'error');
      } else if (response.status === 500) {
        showAlert('❌ Erro no servidor. Tente novamente mais tarde', 'error');
      } else {
        showAlert(`❌ ${errorMessage}`, 'error');
      }
    }
    
  } catch (error) {
    console.error('Erro ao cadastrar:', error);
    showAlert('❌ Erro de conexão. Verifique sua internet e tente novamente', 'error');
  }
}

/* ===================================
   10. SUBMIT DO FORMULÁRIO
   =================================== */

/**
 * Processa submit do formulário
 * @param {Event} e - Evento de submit
 */
async function handleSubmit(e) {
  e.preventDefault();
  
  clearAlerts();
  
  // Validar todos os campos
  const isNameValid = validateNameField();
  const isEmailValid = validateEmailField();
  const isPasswordValid = validatePasswordField();
  const isConfirmPasswordValid = validateConfirmPasswordField();
  const areTermsAccepted = validateTermsField();
  
  if (!isNameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !areTermsAccepted) {
    showAlert('❌ Por favor, corrija os erros no formulário', 'error');
    
    // Focar no primeiro campo com erro
    if (!isNameValid) {
      elements.nameInput.focus();
    } else if (!isEmailValid) {
      elements.emailInput.focus();
    } else if (!isPasswordValid) {
      elements.passwordInput.focus();
    } else if (!isConfirmPasswordValid) {
      elements.confirmPasswordInput.focus();
    }
    
    return;
  }
  
  // Obter valores
  const name = elements.nameInput.value.trim();
  const email = elements.emailInput.value.trim().toLowerCase();
  const password = elements.passwordInput.value;
  
  // Ativar loading
  setLoadingState(true);
  
  // Enviar para API
  await submitRegister({ name, email, password });
  
  // Desativar loading
  setLoadingState(false);
}

/* ===================================
   11. TOGGLE VISIBILIDADE DE SENHA
   =================================== */

/**
 * Toggle visibilidade da senha principal
 */
function togglePasswordVisibility() {
  const currentType = elements.passwordInput.getAttribute('type');
  const newType = currentType === 'password' ? 'text' : 'password';
  
  elements.passwordInput.setAttribute('type', newType);
  elements.togglePassword.setAttribute(
    'aria-label',
    newType === 'password' ? 'Mostrar senha' : 'Ocultar senha'
  );
}

/**
 * Toggle visibilidade da confirmação de senha
 */
function toggleConfirmPasswordVisibility() {
  const currentType = elements.confirmPasswordInput.getAttribute('type');
  const newType = currentType === 'password' ? 'text' : 'password';
  
  elements.confirmPasswordInput.setAttribute('type', newType);
  elements.toggleConfirmPassword.setAttribute(
    'aria-label',
    newType === 'password' ? 'Mostrar confirmação de senha' : 'Ocultar confirmação de senha'
  );
}

/* ===================================
   12. EVENT LISTENERS
   =================================== */

/**
 * Inicializa todos os event listeners
 */
function initEventListeners() {
  // Submit do formulário
  elements.form.addEventListener('submit', handleSubmit);
  
  // Validação em blur
  elements.nameInput.addEventListener('blur', validateNameField);
  elements.emailInput.addEventListener('blur', validateEmailField);
  elements.passwordInput.addEventListener('blur', validatePasswordField);
  elements.confirmPasswordInput.addEventListener('blur', validateConfirmPasswordField);
  elements.termsCheckbox.addEventListener('change', validateTermsField);
  
  // Limpar erros em input
  elements.nameInput.addEventListener('input', () => {
    if (elements.nameError.classList.contains('visible')) {
      clearFieldError(elements.nameInput, elements.nameError);
    }
  });
  
  elements.emailInput.addEventListener('input', () => {
    if (elements.emailError.classList.contains('visible')) {
      clearFieldError(elements.emailInput, elements.emailError);
    }
  });
  
  elements.passwordInput.addEventListener('input', (e) => {
    if (elements.passwordError.classList.contains('visible')) {
      clearFieldError(elements.passwordInput, elements.passwordError);
    }
    updatePasswordStrength(e.target.value);
    updatePasswordRequirements(e.target.value);
  });
  
  elements.confirmPasswordInput.addEventListener('input', () => {
    if (elements.confirmPasswordError.classList.contains('visible')) {
      clearFieldError(elements.confirmPasswordInput, elements.confirmPasswordError);
    }
  });
  
  // Toggle senha
  elements.togglePassword.addEventListener('click', togglePasswordVisibility);
  elements.toggleConfirmPassword.addEventListener('click', toggleConfirmPasswordVisibility);
  
  // Enter no último campo
  elements.confirmPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  });
}

/* ===================================
   13. INICIALIZAÇÃO
   =================================== */

/**
 * Inicializa a página
 */
function init() {
  console.log('📝 Página de cadastro carregada');
  
  // Verificar se já está logado
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
if (token) {
  window.location.href = 'dashboard.html';
  return;
}

  
  // Inicializar event listeners
  initEventListeners();
  
  // Focar no campo de nome
  elements.nameInput.focus();
}

// Executar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
