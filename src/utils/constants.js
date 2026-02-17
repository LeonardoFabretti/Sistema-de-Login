/**
 * UTILITY: CONSTANTES
 * 
 * Responsabilidades:
 * - Centralizar valores constantes da aplicação
 * - Evitar números/strings mágicos no código
 * - Facilitar manutenção e modificação
 */

module.exports = {
  // Papéis de usuário
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
  },
  
  // Status de conta
  ACCOUNT_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    SUSPENDED: 'suspended',
    PENDING_VERIFICATION: 'pending_verification',
  },
  
  // Tipos de token
  TOKEN_TYPES: {
    ACCESS: 'access',
    REFRESH: 'refresh',
    EMAIL_VERIFICATION: 'email_verification',
    PASSWORD_RESET: 'password_reset',
  },
  
  // Códigos HTTP comuns
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
  },
  
  // Mensagens de erro comuns
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    UNAUTHORIZED: 'Não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    VALIDATION_ERROR: 'Erro de validação',
    INTERNAL_ERROR: 'Erro interno do servidor',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',
    ACCOUNT_LOCKED: 'Conta temporariamente bloqueada',
    EMAIL_IN_USE: 'Email já está em uso',
  },
  
  // Duração de tokens (em segundos)
  TOKEN_DURATION: {
    ACCESS: 30 * 60, // 30 minutos
    REFRESH: 7 * 24 * 60 * 60, // 7 dias
    EMAIL_VERIFICATION: 24 * 60 * 60, // 24 horas
    PASSWORD_RESET: 60 * 60, // 1 hora
  },
};
