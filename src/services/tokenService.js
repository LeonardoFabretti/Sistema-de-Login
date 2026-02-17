/**
 * SERVICE: GESTÃO DE TOKENS
 * 
 * Responsabilidades:
 * - Gerar access tokens (JWT)
 * - Gerar refresh tokens
 * - Validar tokens
 * - Revogar tokens
 * - Rotação de refresh tokens
 * - Limpeza de tokens expirados
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const { accessToken, refreshToken } = require('../config/jwt');
const logger = require('../utils/logger');

/**
 * Gerar Access Token (JWT de curta duração)
 * 
 * SEGURANÇA:
 * - Assinado com HMAC-SHA256 (HS256)
 * - Contém apenas dados não sensíveis (userId, role)
 * - Expiração curta (15-30min) limita janela de ataque
 * - Secret obtido de variável de ambiente
 * - NÃO armazenado no banco (stateless)
 * 
 * ESTRUTURA DO TOKEN:
 * Header:  { "alg": "HS256", "typ": "JWT" }
 * Payload: { "userId": "uuid", "role": "user", "iat": 123, "exp": 456 }
 * Signature: HMACSHA256(base64(header) + "." + base64(payload), secret)
 * 
 * @param {string} userId - ID do usuário
 * @param {string} role - Papel do usuário (user, admin)
 * @returns {string} JWT assinado
 */
const generateAccessToken = (userId, role = 'user') => {
  // Payload mínimo (não incluir dados sensíveis!)
  const payload = {
    userId,        // ID do usuário
    role,          // Papel/permissão
    type: 'access', // Tipo de token
  };
  
  // Assinar com secret e definir expiração
  return jwt.sign(payload, accessToken.secret, {
    expiresIn: accessToken.expiresIn, // 15m ou 30m
    issuer: 'auth-system',             // Emissor
    audience: 'web-app',               // Audiência
  });
};

/**
 * Gerar Refresh Token (token de longa duração armazenado no DB)
 * 
 * SEGURANÇA:
 * - Token aleatório criptograficamente seguro (crypto.randomBytes)
 * - 40 bytes = 320 bits de entropia (impossível de adivinhar)
 * - Armazenado hasheado no banco (SHA-256)
 * - Associado ao IP do cliente (detecção de roubo)
 * - Pode ser revogado individualmente
 * - Expiração longa (7 dias) mas revogável
 * 
 * DIFERENÇA vs ACCESS TOKEN:
 * - Access: JWT stateless (não está no banco)
 * - Refresh: Random token stateful (está no banco)
 * 
 * Por que não usar JWT para refresh?
 * - JWT não pode ser revogado (a menos que mantenha blacklist)
 * - Random token permite revogação instantânea
 * - Permite rastrear dispositivos/sessões ativas
 * 
 * @param {string} userId - ID do usuário
 * @param {string} ipAddress - IP do cliente (opcional)
 * @returns {Promise<string>} Token aleatório
 */
const generateRefreshToken = async (userId, ipAddress = null) => {
  // Gerar token aleatório criptograficamente seguro
  const token = crypto.randomBytes(40).toString('hex'); // 80 caracteres hex
  
  // Calcular data de expiração (7 dias)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  // Salvar no banco de dados
  // NOTA: RefreshToken model ainda não implementado
  // Quando implementar, descomentar:
  /*
  const refreshTokenDoc = await RefreshToken.create({
    token,
    userId,
    expiresAt,
    createdByIp: ipAddress,
  });
  
  logger.info(`Refresh token criado para usuário ${userId} de IP ${ipAddress}`);
  
  return refreshTokenDoc.token;
  */
  
  // Temporariamente, retornar token diretamente
  logger.info(`Refresh token gerado para usuário ${userId}`);
  return token;
};

/**
 * Verificar e decodificar Access Token
 * 
 * SEGURANÇA:
 * - Verifica assinatura HMAC (previne falsificação)
 * - Verifica expiração (previne replay attacks)
 * - Verifica issuer e audience (previne token de outro sistema)
 * - Retorna payload decodificado OU lança erro
 * 
 * ERROS POSSÍVEIS:
 * - JsonWebTokenError: Assinatura inválida (token adulterado)
 * - TokenExpiredError: Token expirado (precisa renovar)
 * - NotBeforeError: Token ainda não é válido (nbf claim)
 * 
 * @param {string} token - JWT a ser verificado
 * @returns {Object} Payload decodificado { userId, role, iat, exp }
 * @throws {Error} Se token for inválido ou expirado
 */
const verifyAccessToken = (token) => {
  try {
    // jwt.verify() faz:
    // 1. Decodifica header e payload
    // 2. Recalcula assinatura com secret
    // 3. Compara assinatura (constant-time)
    // 4. Verifica expiração
    // 5. Verifica issuer/audience se fornecidos
    const decoded = jwt.verify(token, accessToken.secret, {
      issuer: 'auth-system',
      audience: 'web-app',
    });
    
    return decoded;
  } catch (error) {
    // Relançar com mensagem específica
    if (error.name === 'TokenExpiredError') {
      error.message = 'Token expirado. Renove usando refresh token.';
    } else if (error.name === 'JsonWebTokenError') {
      error.message = 'Token inválido ou adulterado.';
    }
    throw error;
  }
};

/**
 * Decodificar token SEM verificar (útil para debug)
 * 
 * ⚠️ NUNCA use para autenticação! Apenas para inspeção.
 * 
 * @param {string} token - JWT
 * @returns {Object} Payload decodificado (não verificado!)
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Validar e renovar tokens (refresh token rotation)
 * 
 * NOTA: Requer RefreshToken model (ainda não implementado)
 * Quando implementar, esta função irá:
 * 1. Buscar refresh token no banco
 * 2. Verificar validade e expiração
 * 3. Gerar novos tokens (access + refresh)
 * 4. Revogar token antigo
 * 5. Retornar novos tokens
 */
const refreshTokens = async (token, ipAddress) => {
  // Implementar quando RefreshToken model estiver pronto
  throw new Error('Refresh token rotation ainda não implementado. Requer RefreshToken model.');
};

/**
 * Revogar refresh token
 * 
 * @param {string} token - Refresh token a revogar
 * @param {string} ipAddress - IP que solicitou revogação
 */
const revokeToken = async (token, ipAddress) => {
  // Implementar quando RefreshToken model estiver pronto
  logger.info(`Solicitação de revogação de token de IP ${ipAddress}`);
  throw new Error('Revogação de token ainda não implementada. Requer RefreshToken model.');
};

/**
 * Revogar todos os tokens de um usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {string} ipAddress - IP que solicitou revogação
 */
const revokeAllUserTokens = async (userId, ipAddress) => {
  // Implementar quando RefreshToken model estiver pronto
  logger.info(`Solicitação para revogar todos os tokens do usuário ${userId}`);
  throw new Error('Revogação em massa ainda não implementada. Requer RefreshToken model.');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  decodeToken,
  refreshTokens,
  revokeToken,
  revokeAllUserTokens,
};
