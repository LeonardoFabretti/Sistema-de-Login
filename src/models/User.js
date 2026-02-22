/**
 * MODEL: USER - PostgreSQL
 * 
 * Responsabilidades:
 * - Criar usuários com hash de senha
 * - Buscar usuários (por ID, email)
 * - Validar credenciais
 * - Gerenciar tentativas de login e bloqueio
 * - Atualizar dados de usuário
 * 
 * SEGURANÇA:
 * ✅ Usa prepared statements ($1, $2) - previne SQL Injection
 * ✅ Hash de senha com bcrypt (12 rounds)
 * ✅ NUNCA retorna senha em queries de listagem
 * ✅ Email sempre em lowercase
 * ✅ Validação de duplicatas
 */

const bcrypt = require('bcryptjs');
const { query, transaction } = require('../config/database');
const { bcryptRounds, loginRateLimit } = require('../config/security');

/**
 * ============================================
 * CRIAR USUÁRIO
 * ============================================
 */

/**
 * Cria um novo usuário no banco de dados
 * 
 * SEGURANÇA:
 * - Hash automático da senha com bcrypt
 * - Email convertido para lowercase
 * - Prepared statement ($1, $2, $3) previne SQL Injection
 * - Verifica duplicação de email
 * 
 * @param {Object} userData - Dados do usuário
 * @param {string} userData.name - Nome do usuário
 * @param {string} userData.email - Email (será convertido para lowercase)
 * @param {string} userData.password - Senha em texto plano (será hasheada)
 * @param {string} [userData.role='user'] - Papel do usuário
 * @returns {Promise<Object>} Usuário criado (SEM a senha)
 */
const create = async ({ name, email, password, role = 'user' }) => {
  try {
    console.log('[USER MODEL] Iniciando criação de usuário...');
    console.log('[USER MODEL] Dados recebidos:', { name, email, role, passwordLength: password?.length });
    
    // 1. Normalizar email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[USER MODEL] Email normalizado:', normalizedEmail);
    
    // 2. Verificar se email já existe
    console.log('[USER MODEL] Verificando se email já existe...');
    const existingUser = await findByEmail(normalizedEmail);
    if (existingUser) {
      console.log('[USER MODEL] Email já existe:', normalizedEmail);
      const error = new Error('Email já está em uso');
      error.code = 'DUPLICATE_EMAIL';
      error.statusCode = 409;
      throw error;
    }
    console.log('[USER MODEL] Email disponível');
    
    // 3. Hash da senha com bcrypt
    // SEGURANÇA: bcrypt com salt rounds (custo computacional)
    // Quanto maior, mais seguro mas mais lento (12 é recomendado)
    console.log('[USER MODEL] Hasheando senha com bcrypt (rounds=' + bcryptRounds + ')...');
    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    console.log('[USER MODEL] Senha hasheada com sucesso');
    
    // 4. Inserir usuário no banco
    // SEGURANÇA: Prepared statement ($1, $2, $3, $4) previne SQL Injection
    console.log('[USER MODEL] Executando INSERT no banco de dados...');
    const result = await query(
      `INSERT INTO users (name, email, password, role, is_active, is_email_verified)
       VALUES ($1, $2, $3, $4, true, false)
       RETURNING id, name, email, role, is_active, is_email_verified, created_at, updated_at`,
      [name, normalizedEmail, hashedPassword, role]
    );
    console.log('[USER MODEL] INSERT executado com sucesso');
    console.log('[USER MODEL] Usuário criado:', result.rows[0]?.id);
    
    // 5. Retornar usuário criado (SEM a senha por segurança)
    return result.rows[0];
  } catch (error) {
    console.error('[USER MODEL] ERRO ao criar usuário:', error);
    console.error('[USER MODEL] Error code:', error.code);
    console.error('[USER MODEL] Error message:', error.message);
    console.error('[USER MODEL] Stack:', error.stack);
    
    // Tratamento de erro de duplicação do PostgreSQL
    if (error.code === '23505') { // Unique violation
      const duplicateError = new Error('Email já está em uso');
      duplicateError.code = 'DUPLICATE_EMAIL';
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
};

/**
 * ============================================
 * BUSCAR USUÁRIOS
 * ============================================
 */

/**
 * Busca usuário por ID
 * 
 * SEGURANÇA:
 * - Prepared statement ($1) previne SQL Injection
 * - NÃO retorna a senha
 * 
 * @param {string} userId - UUID do usuário
 * @returns {Promise<Object|null>} Usuário ou null se não encontrado
 */
const findById = async (userId) => {
  const result = await query(
    `SELECT id, name, email, role, is_active, is_email_verified, 
            login_attempts, lock_until, last_login, created_at, updated_at
     FROM users 
     WHERE id = $1`,
    [userId]
  );
  
  return result.rows[0] || null;
};

/**
 * Busca usuário por email
 * 
 * SEGURANÇA:
 * - Email normalizado (lowercase)
 * - Prepared statement previne SQL Injection
 * - NÃO retorna a senha (use findByEmailWithPassword para autenticação)
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Usuário ou null se não encontrado
 */
const findByEmail = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await query(
    `SELECT id, name, email, role, is_active, is_email_verified,
            login_attempts, lock_until, last_login, created_at, updated_at
     FROM users 
     WHERE email = $1`,
    [normalizedEmail]
  );
  
  return result.rows[0] || null;
};

/**
 * Busca usuário por email COM A SENHA
 * 
 * ⚠️ USAR APENAS PARA AUTENTICAÇÃO!
 * 
 * SEGURANÇA:
 * - Esta função retorna a senha hasheada
 * - Use APENAS para validação de login
 * - NUNCA retorne isso para o cliente
 * 
 * @param {string} email - Email do usuário
 * @returns {Promise<Object|null>} Usuário com senha ou null
 */
const findByEmailWithPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await query(
    `SELECT id, name, email, password, role, is_active, is_email_verified,
            login_attempts, lock_until, password_changed_at, last_login, 
            created_at, updated_at
     FROM users 
     WHERE email = $1`,
    [normalizedEmail]
  );
  
  return result.rows[0] || null;
};

/**
 * ============================================
 * VALIDAÇÃO DE SENHA
 * ============================================
 */

/**
 * Compara senha fornecida com hash armazenado
 * 
 * SEGURANÇA:
 * - Usa bcrypt.compare() que é resistente a timing attacks
 * - Tempo de comparação constante
 * 
 * @param {string} candidatePassword - Senha em texto plano fornecida
 * @param {string} hashedPassword - Hash da senha armazenado no banco
 * @returns {Promise<boolean>} true se senhas coincidem
 */
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

/**
 * Valida credenciais de login (email + senha)
 * 
 * SEGURANÇA:
 * - Retorna mensagem genérica para não revelar se email existe
 * - Verifica bloqueio de conta
 * - Incrementa tentativas falhas
 * - Bloqueia conta após X tentativas
 * 
 * @param {string} email - Email do usuário
 * @param {string} password - Senha em texto plano
 * @returns {Promise<Object>} Usuário validado (SEM senha)
 */
const validateCredentials = async (email, password) => {
  // 1. Buscar usuário COM senha
  const user = await findByEmailWithPassword(email);
  
  // SEGURANÇA: Mensagem genérica para não revelar se email existe
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  
  // 2. Verificar se conta está ativa
  if (!user.is_active) {
    throw new Error('Conta desativada. Entre em contato com o suporte.');
  }
  
  // 3. Verificar se conta está bloqueada
  if (user.lock_until && new Date(user.lock_until) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.lock_until) - new Date()) / 60000);
    throw new Error(`Conta bloqueada. Tente novamente em ${minutesLeft} minutos.`);
  }
  
  // 4. Comparar senhas
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    // Incrementar tentativas falhas
    await incrementLoginAttempts(user.id);
    
    // SEGURANÇA: Mesma mensagem genérica
    throw new Error('Credenciais inválidas');
  }
  
  // 5. Login bem-sucedido - resetar tentativas e atualizar último login
  await resetLoginAttempts(user.id);
  
  // 6. Remover senha antes de retornar
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * ============================================
 * GERENCIAMENTO DE TENTATIVAS DE LOGIN
 * ============================================
 */

/**
 * Incrementa contador de tentativas de login
 * 
 * SEGURANÇA:
 * - Bloqueia conta após X tentativas (definido em config/security.js)
 * - Lock por período de tempo
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} login_attempts e lock_until
 */
const incrementLoginAttempts = async (userId) => {
  const result = await query(
    `UPDATE users 
     SET login_attempts = login_attempts + 1,
         lock_until = CASE 
           WHEN login_attempts + 1 >= $2 
           THEN NOW() + INTERVAL '${loginRateLimit.blockDuration / 60000} minutes'
           ELSE NULL 
         END,
         updated_at = NOW()
     WHERE id = $1
     RETURNING login_attempts, lock_until`,
    [userId, loginRateLimit.maxAttempts]
  );
  
  return result.rows[0];
};

/**
 * Reseta tentativas de login e atualiza último login
 * 
 * @param {string} userId - ID do usuário
 */
const resetLoginAttempts = async (userId) => {
  await query(
    `UPDATE users 
     SET login_attempts = 0,
         lock_until = NULL,
         last_login = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};

/**
 * ============================================
 * ATUALIZAÇÃO DE DADOS
 * ============================================
 */

/**
 * Atualiza senha do usuário
 * 
 * SEGURANÇA:
 * - Hasheia nova senha com bcrypt
 * - Atualiza password_changed_at (para invalidar tokens antigos)
 * 
 * @param {string} userId - ID do usuário
 * @param {string} newPassword - Nova senha em texto plano
 */
const updatePassword = async (userId, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, bcryptRounds);
  
  await query(
    `UPDATE users 
     SET password = $2,
         password_changed_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [userId, hashedPassword]
  );
};

/**
 * Atualiza dados básicos do usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {Object} updates - Dados a atualizar (name, email, etc)
 */
const update = async (userId, updates) => {
  const allowedFields = ['name', 'email'];
  const fields = [];
  const values = [];
  let paramIndex = 1;
  
  // Construir query dinamicamente apenas com campos permitidos
  Object.keys(updates).forEach((key) => {
    if (allowedFields.includes(key)) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(key === 'email' ? updates[key].toLowerCase().trim() : updates[key]);
    }
  });
  
  if (fields.length === 0) {
    throw new Error('Nenhum campo válido para atualizar');
  }
  
  fields.push(`updated_at = NOW()`);
  values.push(userId);
  
  const result = await query(
    `UPDATE users 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, name, email, role, is_active, is_email_verified, updated_at`,
    values
  );
  
  return result.rows[0];
};

/**
 * Marca email como verificado
 * 
 * @param {string} userId - ID do usuário
 */
const markEmailAsVerified = async (userId) => {
  await query(
    `UPDATE users 
     SET is_email_verified = true,
         email_verification_token = NULL,
         email_verification_expire = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};

/**
 * Define token de reset de senha
 * 
 * @param {string} userId - ID do usuário
 * @param {string} token - Token de reset
 * @param {Date} expiresAt - Data de expiração
 */
const setPasswordResetToken = async (userId, token, expiresAt) => {
  await query(
    `UPDATE users 
     SET password_reset_token = $2,
         password_reset_expire = $3,
         updated_at = NOW()
     WHERE id = $1`,
    [userId, token, expiresAt]
  );
};

/**
 * ============================================
 * LISTAGEM E PAGINAÇÃO
 * ============================================
 */

/**
 * Lista usuários com filtros e paginação
 * 
 * SEGURANÇA:
 * - NÃO retorna senhas
 * - Prepared statements
 * 
 * @param {Object} options - Opções de filtro e paginação
 * @returns {Promise<Object>} { data, pagination }
 */
const findAll = async (options = {}) => {
  const {
    page = 1,
    perPage = 10,
    role = null,
    isActive = null,
    orderBy = 'created_at',
    order = 'DESC',
  } = options;
  
  const offset = (page - 1) * perPage;
  const conditions = [];
  const params = [];
  let paramIndex = 1;
  
  // Construir WHERE dinamicamente
  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  
  if (isActive !== null) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  // Query para dados
  params.push(perPage, offset);
  const dataResult = await query(
    `SELECT id, name, email, role, is_active, is_email_verified, 
            last_login, created_at, updated_at
     FROM users 
     ${whereClause}
     ORDER BY ${orderBy} ${order}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );
  
  // Query para total
  const countResult = await query(
    `SELECT COUNT(*) as total FROM users ${whereClause}`,
    params.slice(0, -2) // Remove LIMIT e OFFSET
  );
  
  const total = parseInt(countResult.rows[0].total);
  
  return {
    data: dataResult.rows,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  };
};

/**
 * ============================================
 * SOFT DELETE
 * ============================================
 */

/**
 * Desativa usuário (soft delete)
 * 
 * @param {string} userId - ID do usuário
 */
const deactivate = async (userId) => {
  await query(
    `UPDATE users 
     SET is_active = false,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};

/**
 * Reativa usuário
 * 
 * @param {string} userId - ID do usuário
 */
const reactivate = async (userId) => {
  await query(
    `UPDATE users 
     SET is_active = true,
         login_attempts = 0,
         lock_until = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};

/**
 * ============================================
 * UTILITÁRIOS
 * ============================================
 */

/**
 * Verifica se email já existe
 * 
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} true se existe
 */
const emailExists = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await query(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [normalizedEmail]
  );
  
  return result.rows[0].exists;
};

/**
 * Conta usuários por role
 * 
 * @returns {Promise<Array>} Estatísticas por role
 */
const countByRole = async () => {
  const result = await query(
    `SELECT role, COUNT(*) as total
     FROM users
     GROUP BY role`
  );
  
  return result.rows;
};

/**
 * ============================================
 * EXPORTAR TODAS AS FUNÇÕES
 * ============================================
 */

module.exports = {
  // Criar
  create,
  
  // Buscar
  findById,
  findByEmail,
  findByEmailWithPassword,
  findAll,
  
  // Autenticação
  comparePassword,
  validateCredentials,
  
  // Tentativas de login
  incrementLoginAttempts,
  resetLoginAttempts,
  
  // Atualizar
  update,
  updatePassword,
  markEmailAsVerified,
  setPasswordResetToken,
  
  // Ativar/Desativar
  deactivate,
  reactivate,
  
  // Utilitários
  emailExists,
  countByRole,
};
