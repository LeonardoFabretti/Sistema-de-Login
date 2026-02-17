/**
 * CONFIGURAÇÃO DE JWT
 * 
 * Responsabilidades:
 * - Centralizar configurações de tokens JWT
 * - Definir tempos de expiração
 * - Definir secrets (obtidos de variáveis de ambiente)
 */

module.exports = {
  // Access Token (token de acesso - curta duração)
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '30m',
  },
  
  // Refresh Token (token de renovação - longa duração)
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  },
  
  // Opções de cookie para tokens
  cookieOptions: {
    httpOnly: true, // Previne acesso via JavaScript (XSS)
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    sameSite: 'strict', // Proteção CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em milissegundos
  },
};
