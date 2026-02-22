/**
 * MODEL: PASSWORD_RESET - PostgreSQL
 * 
 * Responsabilidades:
 * - Criar códigos de recuperação de senha
 * - Buscar códigos válidos
 * - Invalidar códigos após uso
 * - Limpar códigos expirados
 * 
 * SEGURANÇA:
 * ✅ Usa prepared statements ($1, $2) - previne SQL Injection
 * ✅ Códigos são hasheados com bcrypt
 * ✅ Códigos expiram em 15 minutos
 * ✅ Códigos só podem ser usados uma vez
 * ✅ Email sempre em lowercase
 */

const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

/**
 * ============================================
 * CRIAR CÓDIGO DE RESET
 * ============================================
 */

/**
 * Cria um novo código de reset de senha
 * 
 * SEGURANÇA:
 * - Remove códigos antigos do mesmo email
 * - Hash do código com bcrypt
 * - Email convertido para lowercase
 * - Prepared statement previne SQL Injection
 * - Código expira em 15 minutos
 * 
 * @param {string} email - Email do usuário
 * @param {string} codeHash - Código hasheado com bcrypt
 * @param {Date} expiresAt - Data de expiração
 * @returns {Promise<Object>} Registro criado
 */
const create = async (email, codeHash, expiresAt) => {
  try {
    console.log('[PASSWORD RESET MODEL] Criando código de reset para:', email);
    
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    
    // 1. Deletar códigos antigos do mesmo email (limpar histórico)
    // SEGURANÇA: Previne múltiplos códigos válidos simultaneamente
    console.log('[PASSWORD RESET MODEL] Removendo códigos antigos...');
    await query(
      'DELETE FROM password_resets WHERE email = $1',
      [normalizedEmail]
    );
    
    // 2. Inserir novo código
    // SEGURANÇA: Prepared statement previne SQL Injection
    console.log('[PASSWORD RESET MODEL] Inserindo novo código...');
    const result = await query(
      `INSERT INTO password_resets (email, code_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, email, expires_at, created_at`,
      [normalizedEmail, codeHash, expiresAt]
    );
    
    console.log('[PASSWORD RESET MODEL] Código criado com sucesso:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao criar código:', error);
    throw error;
  }
};

/**
 * ============================================
 * BUSCAR CÓDIGO
 * ============================================
 */

/**
 * Busca código de reset válido por email
 * 
 * SEGURANÇA:
 * - Retorna apenas códigos não expirados
 * - Email normalizado (lowercase)
 * - Prepared statement previne SQL Injection
 * - Ordena por data de criação (mais recente primeiro)
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Código encontrado ou null
 */
const findByEmail = async (email) => {
  try {
    console.log('[PASSWORD RESET MODEL] Buscando código para:', email);
    
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Buscar código válido (não expirado)
    // SEGURANÇA: Verifica expiração no banco de dados
    const result = await query(
      `SELECT id, email, code_hash, expires_at, created_at
       FROM password_resets
       WHERE email = $1 
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [normalizedEmail]
    );
    
    if (result.rows.length === 0) {
      console.log('[PASSWORD RESET MODEL] Nenhum código válido encontrado');
      return null;
    }
    
    console.log('[PASSWORD RESET MODEL] Código encontrado:', result.rows[0].id);
    return result.rows[0];
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao buscar código:', error);
    throw error;
  }
};

/**
 * ============================================
 * VALIDAR CÓDIGO
 * ============================================
 */

/**
 * Valida se código informado corresponde ao hash no banco
 * 
 * SEGURANÇA:
 * - Usa bcrypt.compare (proteção contra timing attacks)
 * - Compara hash, não texto plano
 * 
 * @param {string} code - Código informado pelo usuário
 * @param {string} codeHash - Hash armazenado no banco
 * @returns {Promise<boolean>} true se válido
 */
const validateCode = async (code, codeHash) => {
  try {
    console.log('[PASSWORD RESET MODEL] Validando código...');
    const isValid = await bcrypt.compare(code, codeHash);
    console.log('[PASSWORD RESET MODEL] Código válido:', isValid);
    return isValid;
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao validar código:', error);
    return false;
  }
};

/**
 * ============================================
 * INVALIDAR CÓDIGO
 * ============================================
 */

/**
 * Deleta código de reset (invalidação após uso)
 * 
 * SEGURANÇA:
 * - Código só pode ser usado uma vez
 * - Remove todas as ocorrências do email (segurança extra)
 * 
 * @param {string} email - Email do usuário
 */
const deleteByEmail = async (email) => {
  try {
    console.log('[PASSWORD RESET MODEL] Deletando códigos de:', email);
    
    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Deletar todos os códigos deste email
    await query(
      'DELETE FROM password_resets WHERE email = $1',
      [normalizedEmail]
    );
    
    console.log('[PASSWORD RESET MODEL] Códigos deletados com sucesso');
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao deletar códigos:', error);
    throw error;
  }
};

/**
 * Deleta código específico por ID
 * 
 * @param {string} id - ID do registro
 */
const deleteById = async (id) => {
  try {
    console.log('[PASSWORD RESET MODEL] Deletando código ID:', id);
    
    await query(
      'DELETE FROM password_resets WHERE id = $1',
      [id]
    );
    
    console.log('[PASSWORD RESET MODEL] Código deletado com sucesso');
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao deletar código:', error);
    throw error;
  }
};

/**
 * ============================================
 * LIMPEZA DE CÓDIGOS EXPIRADOS
 * ============================================
 */

/**
 * Remove todos os códigos expirados da base de dados
 * 
 * RECOMENDAÇÃO:
 * - Executar periodicamente via cron job
 * - Manter base limpa e otimizada
 * 
 * @returns {Promise<number>} Quantidade de códigos removidos
 */
const cleanupExpired = async () => {
  try {
    console.log('[PASSWORD RESET MODEL] Limpando códigos expirados...');
    
    const result = await query(
      'DELETE FROM password_resets WHERE expires_at <= NOW() RETURNING id'
    );
    
    const count = result.rows.length;
    console.log(`[PASSWORD RESET MODEL] ${count} códigos expirados removidos`);
    
    return count;
  } catch (error) {
    console.error('[PASSWORD RESET MODEL] Erro ao limpar códigos expirados:', error);
    throw error;
  }
};

/**
 * ============================================
 * EXPORTAR FUNÇÕES
 * ============================================
 */

module.exports = {
  create,
  findByEmail,
  validateCode,
  deleteByEmail,
  deleteById,
  cleanupExpired,
};
