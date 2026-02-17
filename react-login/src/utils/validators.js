/**
 * Funções de validação para formulários
 */

/**
 * Valida formato de email
 * @param {string} email - Email para validar
 * @returns {boolean} - true se válido
 */
export const validateEmail = (email) => {
  if (!email) return false;
  
  // Regex RFC 5322 simplificado
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida força de senha
 * @param {string} password - Senha para validar
 * @returns {object} - { isValid, errors, strength }
 */
export const validatePassword = (password) => {
  const errors = [];
  let strength = 0;

  if (!password) {
    return { isValid: false, errors: ['Senha obrigatória'], strength: 0 };
  }

  // Mínimo 8 caracteres
  if (password.length < 8) {
    errors.push('Mínimo 8 caracteres');
  } else {
    strength += 1;
  }

  // Contém letra minúscula
  if (!/[a-z]/.test(password)) {
    errors.push('Deve conter letra minúscula');
  } else {
    strength += 1;
  }

  // Contém letra maiúscula
  if (!/[A-Z]/.test(password)) {
    errors.push('Deve conter letra maiúscula');
  } else {
    strength += 1;
  }

  // Contém número
  if (!/\d/.test(password)) {
    errors.push('Deve conter número');
  } else {
    strength += 1;
  }

  // Contém caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Deve conter caractere especial');
  } else {
    strength += 1;
  }

  // Bonus: comprimento extra
  if (password.length >= 12) {
    strength += 1;
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength: Math.min(strength, 5) // 0-5
  };
};

/**
 * Obtém label de força da senha
 * @param {number} strength - Força (0-5)
 * @returns {string} - Label da força
 */
export const getPasswordStrengthLabel = (strength) => {
  if (strength <= 1) return 'Muito fraca';
  if (strength === 2) return 'Fraca';
  if (strength === 3) return 'Média';
  if (strength === 4) return 'Forte';
  return 'Muito forte';
};

/**
 * Valida nome completo
 * @param {string} name - Nome para validar
 * @returns {boolean} - true se válido
 */
export const validateName = (name) => {
  if (!name) return false;
  
  // Mínimo 2 caracteres, apenas letras e espaços
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;
  return nameRegex.test(name.trim());
};

/**
 * Valida CPF
 * @param {string} cpf - CPF para validar
 * @returns {boolean} - true se válido
 */
export const validateCPF = (cpf) => {
  if (!cpf) return false;
  
  // Remove formatação
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

/**
 * Valida telefone brasileiro
 * @param {string} phone - Telefone para validar
 * @returns {boolean} - true se válido
 */
export const validatePhone = (phone) => {
  if (!phone) return false;
  
  // Remove formatação
  phone = phone.replace(/[^\d]/g, '');
  
  // Aceita 10 ou 11 dígitos (com ou sem 9º dígito)
  return /^[1-9]{2}9?[0-9]{8}$/.test(phone);
};

/**
 * Valida URL
 * @param {string} url - URL para validar
 * @returns {boolean} - true se válido
 */
export const validateUrl = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida data no formato DD/MM/YYYY
 * @param {string} date - Data para validar
 * @returns {boolean} - true se válido
 */
export const validateDate = (date) => {
  if (!date) return false;
  
  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = date.match(dateRegex);
  
  if (!match) return false;
  
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  
  // Verifica range básico
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Verifica data válida
  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
};

/**
 * Valida idade mínima
 * @param {string} birthdate - Data de nascimento (DD/MM/YYYY)
 * @param {number} minAge - Idade mínima
 * @returns {boolean} - true se válido
 */
export const validateMinAge = (birthdate, minAge = 18) => {
  if (!validateDate(birthdate)) return false;
  
  const [day, month, year] = birthdate.split('/').map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= minAge;
};

/**
 * Validação de formulário de login
 * @param {object} values - Valores do formulário
 * @returns {object} - Objeto com erros
 */
export const validateLoginForm = (values) => {
  const errors = {};
  
  // Email
  if (!values.email) {
    errors.email = 'Email obrigatório';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }
  
  // Senha
  if (!values.password) {
    errors.password = 'Senha obrigatória';
  } else if (values.password.length < 8) {
    errors.password = 'Mínimo 8 caracteres';
  }
  
  return errors;
};

/**
 * Validação de formulário de registro
 * @param {object} values - Valores do formulário
 * @returns {object} - Objeto com erros
 */
export const validateRegisterForm = (values) => {
  const errors = {};
  
  // Nome
  if (!values.name) {
    errors.name = 'Nome obrigatório';
  } else if (!validateName(values.name)) {
    errors.name = 'Nome inválido (mínimo 2 letras)';
  }
  
  // Email
  if (!values.email) {
    errors.email = 'Email obrigatório';
  } else if (!validateEmail(values.email)) {
    errors.email = 'Email inválido';
  }
  
  // Senha
  if (!values.password) {
    errors.password = 'Senha obrigatória';
  } else {
    const passwordValidation = validatePassword(values.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }
  
  // Confirmar senha
  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirme sua senha';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Senhas não coincidem';
  }
  
  // Termos (opcional)
  if (values.acceptTerms !== undefined && !values.acceptTerms) {
    errors.acceptTerms = 'Você deve aceitar os termos';
  }
  
  return errors;
};

/**
 * Sanitiza string (remove caracteres perigosos)
 * @param {string} str - String para sanitizar
 * @returns {string} - String sanitizada
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Formata CPF
 * @param {string} cpf - CPF para formatar
 * @returns {string} - CPF formatado
 */
export const formatCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

/**
 * Formata telefone
 * @param {string} phone - Telefone para formatar
 * @returns {string} - Telefone formatado
 */
export const formatPhone = (phone) => {
  phone = phone.replace(/[^\d]/g, '');
  
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
};
