/**
 * CONFIGURAÇÕES DE SEGURANÇA
 * 
 * Responsabilidades:
 * - Definir políticas de senha
 * - Configurações de rate limiting
 * - Configurações de tentativas de login
 * - Outras políticas de segurança centralizadas
 */

module.exports = {
  // Política de senha
  passwordPolicy: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  },
  
  // Bcrypt rounds (custo computacional)
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Rate limiting para tentativas de login
  loginRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutos
    maxAttempts: 5, // 5 tentativas
    blockDuration: 15 * 60 * 1000, // Bloquear por 15 minutos
  },
  
  // Rate limiting geral da API
  apiRateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requisições
  },
  
  // Configurações de sessão
  session: {
    maxActiveSessions: 5, // Máximo de sessões simultâneas por usuário
    absoluteTimeout: 24 * 60 * 60 * 1000, // 24 horas
  },
};
