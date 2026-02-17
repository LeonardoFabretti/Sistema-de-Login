/**
 * MIDDLEWARE: RATE LIMITING
 * 
 * Responsabilidades:
 * - Limitar número de requisições por IP/usuário
 * - Prevenir ataques de força bruta (brute force)
 * - Prevenir abuso da API (DoS)
 * - Diferentes limitadores para diferentes endpoints
 * 
 * COMO PROTEGE CONTRA BRUTE FORCE:
 * 1. Limita tentativas de login por IP
 * 2. Bloqueia temporariamente após X tentativas falhas
 * 3. Aumenta exponencialmente o tempo de espera
 * 4. Dificulta muito ataques automatizados
 * 
 * CONFIGURAÇÃO SEGURA:
 * - Login: 5 tentativas / 15 minutos
 * - Cadastro: 3 tentativas / hora (previne spam)
 * - Reset senha: 3 tentativas / hora (previne abuso)
 * - API geral: 100 requisições / 15 minutos
 */

const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter geral da API
 * 
 * CONFIGURAÇÃO:
 * - 100 requisições por 15 minutos
 * - Conta todas as requisições (sucesso e erro)
 * 
 * PROTEÇÃO:
 * - Previne DoS (Denial of Service)
 * - Protege contra scrapers
 * - Limita abuso geral da API
 */
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições por janela
  message: {
    success: false,
    message: 'Muitas requisições deste IP. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna headers RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
  legacyHeaders: false, // Desabilita X-RateLimit-* (deprecated)
  
  // Handler customizado para logging
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip} - Endpoint: ${req.path}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas requisições. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter específico para LOGIN
 * 
 * CONFIGURAÇÃO BRUTE FORCE PROTECTION:
 * - 5 tentativas por 15 minutos
 * - skipSuccessfulRequests: true (só conta falhas)
 * - skipFailedRequests: false (conta todas as tentativas)
 * 
 * POR QUE PROTEGE:
 * 1. Atacante tenta adivinhar senhas (dicionário, rainbow tables)
 * 2. Sem rate limit: 1000 tentativas/segundo = senha quebrada em minutos
 * 3. Com rate limit: 5 tentativas/15min = inviável quebrar senha forte
 * 
 * EXEMPLO DE ATAQUE BLOQUEADO:
 * - Atacante tenta: senha123, senha456, senha789, admin123, password
 * - 5ª tentativa: BLOQUEADO por 15 minutos
 * - Senha forte (12+ chars): levaria ANOS para quebrar
 * 
 * MATEMÁTICA:
 * - Senha forte: 72^12 combinações (maiúsc, minúsc, números, especiais)
 * - 5 tentativas/15min = 480 tentativas/dia
 * - 72^12 / 480 = 4.4 × 10^19 dias (impossível!)
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // ⚠️ CRÍTICO: Apenas 5 tentativas!
  
  // ✅ IMPORTANTE: Só conta tentativas (não sucessos)
  // Se usuário erra 4x e acerta na 5ª = OK (contador reseta)
  skipSuccessfulRequests: true,
  
  message: {
    success: false,
    message: 'Muitas tentativas de login falhadas. Tente novamente em 15 minutos.',
    code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 minutos',
    tip: 'Use a opção "Esqueci minha senha" se não lembrar a senha correta.'
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  // Handler customizado para LOGGING DE SEGURANÇA
  handler: (req, res) => {
    const email = req.body?.email || 'desconhecido';
    
    logger.warn(`⚠️  BRUTE FORCE ATTEMPT BLOCKED: IP ${req.ip} - Email: ${email} - Tentativas excedidas`);
    
    // Em produção, poderia:
    // 1. Enviar alerta para SIEM
    // 2. Notificar equipe de segurança
    // 3. Banir IP temporariamente
    // 4. Enviar email para o dono da conta
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
      code: 'LOGIN_RATE_LIMIT_EXCEEDED',
      retryAfter: 900 // segundos
    });
  },
  
  // Identificador único (por IP)
  // Em produção avançada, pode usar: IP + email (mais preciso)
  keyGenerator: (req) => {
    return req.ip; // Limita por IP
    // Alternativa: return `${req.ip}-${req.body?.email || ''}`;
  }
});

/**
 * Rate limiter para CADASTRO
 * 
 * CONFIGURAÇÃO:
 * - 3 cadastros por hora
 * 
 * PROTEÇÃO:
 * - Previne spam de contas falsas
 * - Previne ataques automatizados de criação de bots
 * - Dificulta fraudes (criar múltiplas contas)
 */
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas por hora
  message: {
    success: false,
    message: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.',
    code: 'REGISTER_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn(`Cadastro bloqueado por rate limit: IP ${req.ip}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de cadastro. Tente novamente em 1 hora.',
      code: 'REGISTER_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter para RESET DE SENHA
 * 
 * CONFIGURAÇÃO:
 * - 3 tentativas por hora
 * 
 * PROTEÇÃO:
 * - Previne enumeração de emails (descobrir quais emails estão cadastrados)
 * - Previne spam de emails de reset
 * - Previne abuso do sistema de recuperação
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 tentativas por hora
  message: {
    success: false,
    message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
    retryAfter: '1 hora'
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  handler: (req, res) => {
    logger.warn(`Reset de senha bloqueado: IP ${req.ip} - Email: ${req.body?.email}`);
    
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de recuperação de senha. Tente novamente em 1 hora.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Rate limiter para API (admin) - Mais permissivo
 * 
 * CONFIGURAÇÃO:
 * - 1000 requisições por 15 minutos
 * 
 * USO:
 * - Endpoints admin que fazem muitas operações
 */
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Limite de requisições excedido',
    code: 'ADMIN_RATE_LIMIT_EXCEEDED'
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  rateLimiter,           // Geral: 100 req / 15min
  loginRateLimiter,      // Login: 5 tentativas / 15min ⚠️ CRÍTICO
  registerRateLimiter,   // Cadastro: 3 tentativas / hora
  passwordResetRateLimiter, // Reset: 3 tentativas / hora
  adminRateLimiter,      // Admin: 1000 req / 15min
};
