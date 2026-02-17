/**
 * EXEMPLO DE USO DO MÓDULO DE BANCO DE DADOS
 * 
 * Este arquivo demonstra como usar o módulo de conexão PostgreSQL
 * em diferentes cenários reais da aplicação.
 */

const { query, transaction, getClient } = require('../config/database');

/**
 * EXEMPLO 1: Query simples - SELECT
 */
async function buscarUsuarioPorEmail(email) {
  const result = await query(
    'SELECT id, name, email, role, created_at FROM users WHERE email = $1',
    [email]
  );
  
  return result.rows[0]; // Retorna undefined se não encontrar
}

/**
 * EXEMPLO 2: INSERT com RETURNING
 */
async function criarUsuario(nome, email, passwordHash) {
  const result = await query(
    `INSERT INTO users (name, email, password, is_active, is_email_verified) 
     VALUES ($1, $2, $3, true, false) 
     RETURNING id, name, email, role, created_at`,
    [nome, email, passwordHash]
  );
  
  return result.rows[0];
}

/**
 * EXEMPLO 3: UPDATE
 */
async function atualizarUltimoLogin(userId) {
  await query(
    `UPDATE users 
     SET last_login = NOW(), 
         login_attempts = 0, 
         lock_until = NULL 
     WHERE id = $1`,
    [userId]
  );
}

/**
 * EXEMPLO 4: DELETE
 */
async function removerRefreshToken(token) {
  const result = await query(
    'DELETE FROM refresh_tokens WHERE token = $1 RETURNING id',
    [token]
  );
  
  return result.rowCount > 0; // true se deletou algo
}

/**
 * EXEMPLO 5: Transação simples usando helper
 */
async function criarUsuarioComToken(nome, email, passwordHash, token) {
  return await transaction(async (client) => {
    // 1. Criar usuário
    const userResult = await client.query(
      `INSERT INTO users (name, email, password) 
       VALUES ($1, $2, $3) 
       RETURNING id`,
      [nome, email, passwordHash]
    );
    
    const userId = userResult.rows[0].id;
    
    // 2. Criar refresh token
    await client.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days')`,
      [token, userId]
    );
    
    return userId;
  });
}

/**
 * EXEMPLO 6: Transação manual (controle total)
 */
async function transferirDados(fromUserId, toUserId) {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    // Operação 1
    const result1 = await client.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['inactive', fromUserId]
    );
    
    // Operação 2
    const result2 = await client.query(
      'UPDATE users SET status = $1 WHERE id = $2',
      ['active', toUserId]
    );
    
    // Se tudo OK, commit
    await client.query('COMMIT');
    
    return { success: true };
  } catch (error) {
    // Se erro, rollback
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // SEMPRE liberar cliente de volta ao pool
    client.release();
  }
}

/**
 * EXEMPLO 7: Query com múltiplos parâmetros
 */
async function buscarUsuarios(filtros) {
  const { role, isActive, limit = 10, offset = 0 } = filtros;
  
  let conditions = [];
  let params = [];
  let paramIndex = 1;
  
  if (role) {
    conditions.push(`role = $${paramIndex++}`);
    params.push(role);
  }
  
  if (isActive !== undefined) {
    conditions.push(`is_active = $${paramIndex++}`);
    params.push(isActive);
  }
  
  const whereClause = conditions.length > 0 
    ? 'WHERE ' + conditions.join(' AND ') 
    : '';
  
  params.push(limit, offset);
  
  const result = await query(
    `SELECT id, name, email, role, is_active, created_at 
     FROM users 
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );
  
  return result.rows;
}

/**
 * EXEMPLO 8: Verificar se usuário existe (retorna boolean)
 */
async function emailExiste(email) {
  const result = await query(
    'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists',
    [email]
  );
  
  return result.rows[0].exists;
}

/**
 * EXEMPLO 9: Incrementar contador
 */
async function incrementarTentativasLogin(userId) {
  const result = await query(
    `UPDATE users 
     SET login_attempts = login_attempts + 1,
         lock_until = CASE 
           WHEN login_attempts + 1 >= 5 
           THEN NOW() + INTERVAL '15 minutes'
           ELSE NULL 
         END
     WHERE id = $1
     RETURNING login_attempts, lock_until`,
    [userId]
  );
  
  return result.rows[0];
}

/**
 * EXEMPLO 10: JOIN entre tabelas
 */
async function buscarTokensDoUsuario(userId) {
  const result = await query(
    `SELECT 
       rt.id, 
       rt.token, 
       rt.expires_at, 
       rt.is_active,
       rt.created_by_ip,
       u.email
     FROM refresh_tokens rt
     INNER JOIN users u ON rt.user_id = u.id
     WHERE rt.user_id = $1 
       AND rt.is_active = true
       AND rt.expires_at > NOW()
     ORDER BY rt.created_at DESC`,
    [userId]
  );
  
  return result.rows;
}

/**
 * EXEMPLO 11: Agregação e GROUP BY
 */
async function estatisticasUsuarios() {
  const result = await query(
    `SELECT 
       role,
       COUNT(*) as total,
       COUNT(*) FILTER (WHERE is_active = true) as ativos,
       COUNT(*) FILTER (WHERE is_email_verified = true) as verificados
     FROM users
     GROUP BY role`
  );
  
  return result.rows;
}

/**
 * EXEMPLO 12: Bulk insert (múltiplos registros)
 */
async function criarMultiplosTokens(tokens) {
  // Construir valores dinamicamente: ($1, $2), ($3, $4), ($5, $6)
  const values = tokens.map((_, i) => {
    const base = i * 3;
    return `($${base + 1}, $${base + 2}, $${base + 3})`;
  }).join(', ');
  
  // Flatten array: [token1, userId1, expiresAt1, token2, userId2, ...]
  const params = tokens.flatMap(t => [t.token, t.userId, t.expiresAt]);
  
  await query(
    `INSERT INTO refresh_tokens (token, user_id, expires_at) 
     VALUES ${values}`,
    params
  );
}

/**
 * EXEMPLO 13: Paginação completa com total
 */
async function listarUsuariosPaginado(page = 1, perPage = 10) {
  const offset = (page - 1) * perPage;
  
  // Query para dados
  const dataResult = await query(
    `SELECT id, name, email, role, created_at 
     FROM users 
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [perPage, offset]
  );
  
  // Query para total
  const countResult = await query('SELECT COUNT(*) as total FROM users');
  
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
}

/**
 * EXEMPLO 14: Soft delete
 */
async function desativarUsuario(userId) {
  await query(
    'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
    [userId]
  );
}

/**
 * EXEMPLO 15: Raw SQL com CTE (Common Table Expression)
 */
async function limparTokensExpirados() {
  const result = await query(
    `WITH deleted AS (
       DELETE FROM refresh_tokens 
       WHERE expires_at < NOW() 
         OR (is_active = false AND revoked_at < NOW() - INTERVAL '30 days')
       RETURNING id
     )
     SELECT COUNT(*) as deleted_count FROM deleted`
  );
  
  return result.rows[0].deleted_count;
}

// Exportar exemplos para uso
module.exports = {
  buscarUsuarioPorEmail,
  criarUsuario,
  atualizarUltimoLogin,
  removerRefreshToken,
  criarUsuarioComToken,
  transferirDados,
  buscarUsuarios,
  emailExiste,
  incrementarTentativasLogin,
  buscarTokensDoUsuario,
  estatisticasUsuarios,
  criarMultiplosTokens,
  listarUsuariosPaginado,
  desativarUsuario,
  limparTokensExpirados,
};
