/**
 * EXEMPLOS DE USO DO MODEL USER (PostgreSQL)
 * 
 * Este arquivo demonstra como usar todas as funções do modelo User
 * em diferentes cenários reais da aplicação.
 */

const User = require('../models/User');

/**
 * ============================================
 * EXEMPLO 1: CRIAR NOVO USUÁRIO (REGISTRO)
 * ============================================
 */
async function exemploRegistro() {
  try {
    const novoUsuario = await User.create({
      name: 'João Silva',
      email: 'joao@example.com',
      password: 'SenhaForte123!@#', // Será hasheada automaticamente
      role: 'user',
    });
    
    console.log('Usuário criado:', novoUsuario);
    // Retorna: { id, name, email, role, is_active, is_email_verified, created_at }
    // ⚠️ NOTA: Senha NÃO é retornada por segurança
    
  } catch (error) {
    if (error.code === 'DUPLICATE_EMAIL') {
      console.error('Email já cadastrado');
    } else {
      console.error('Erro ao criar usuário:', error.message);
    }
  }
}

/**
 * ============================================
 * EXEMPLO 2: VALIDAR CREDENCIAIS (LOGIN)
 * ============================================
 */
async function exemploLogin(email, password) {
  try {
    // SEGURANÇA: Esta função:
    // - Verifica se usuário existe (mensagem genérica se não)
    // - Verifica se conta está ativa
    // - Verifica se conta está bloqueada
    // - Compara senha com bcrypt (resistente a timing attacks)
    // - Incrementa tentativas falhas se erro
    // - Bloqueia conta após X tentativas
    
    const usuario = await User.validateCredentials(email, password);
    
    console.log('Login bem-sucedido:', usuario);
    // Retorna: { id, name, email, role, ... } SEM senha
    
    return usuario;
    
  } catch (error) {
    // SEGURANÇA: Todas as mensagens de erro são genéricas
    console.error('Erro no login:', error.message);
    // "Credenciais inválidas" - não revela se email existe
    // "Conta bloqueada. Tente novamente em X minutos"
    throw error;
  }
}

/**
 * ============================================
 * EXEMPLO 3: BUSCAR USUÁRIO POR EMAIL
 * ============================================
 */
async function exemploBuscarPorEmail(email) {
  const usuario = await User.findByEmail(email);
  
  if (!usuario) {
    console.log('Usuário não encontrado');
    return null;
  }
  
  console.log('Usuário encontrado:', usuario);
  // Retorna: { id, name, email, role, is_active, ... } SEM senha
  
  return usuario;
}

/**
 * ============================================
 * EXEMPLO 4: BUSCAR USUÁRIO POR ID
 * ============================================
 */
async function exemploBuscarPorId(userId) {
  const usuario = await User.findById(userId);
  
  if (!usuario) {
    console.log('Usuário não encontrado');
    return null;
  }
  
  return usuario;
}

/**
 * ============================================
 * EXEMPLO 5: VERIFICAR SE EMAIL EXISTE
 * ============================================
 */
async function exemploVerificarEmail(email) {
  const existe = await User.emailExists(email);
  
  if (existe) {
    console.log('Email já cadastrado');
    return true;
  }
  
  console.log('Email disponível');
  return false;
}

/**
 * ============================================
 * EXEMPLO 6: ATUALIZAR DADOS DO USUÁRIO
 * ============================================
 */
async function exemploAtualizarDados(userId) {
  try {
    const usuarioAtualizado = await User.update(userId, {
      name: 'João Silva Santos',
      email: 'novo.email@example.com',
    });
    
    console.log('Usuário atualizado:', usuarioAtualizado);
    return usuarioAtualizado;
    
  } catch (error) {
    console.error('Erro ao atualizar:', error.message);
  }
}

/**
 * ============================================
 * EXEMPLO 7: ATUALIZAR SENHA
 * ============================================
 */
async function exemploAtualizarSenha(userId, senhaAtual, novaSenha) {
  try {
    // 1. Primeiro, verificar senha atual
    const usuario = await User.findById(userId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    // 2. Buscar com senha para validar
    const userComSenha = await User.findByEmailWithPassword(usuario.email);
    const isPasswordValid = await User.comparePassword(senhaAtual, userComSenha.password);
    
    if (!isPasswordValid) {
      throw new Error('Senha atual incorreta');
    }
    
    // 3. Atualizar senha
    await User.updatePassword(userId, novaSenha);
    
    console.log('Senha atualizada com sucesso');
    // SEGURANÇA: password_changed_at é atualizado automaticamente
    // Isso invalida tokens JWT antigos
    
  } catch (error) {
    console.error('Erro ao atualizar senha:', error.message);
    throw error;
  }
}

/**
 * ============================================
 * EXEMPLO 8: MARCAR EMAIL COMO VERIFICADO
 * ============================================
 */
async function exemploVerificarEmail(userId) {
  await User.markEmailAsVerified(userId);
  console.log('Email marcado como verificado');
}

/**
 * ============================================
 * EXEMPLO 9: CONFIGURAR TOKEN DE RESET DE SENHA
 * ============================================
 */
async function exemploResetSenha(email) {
  const usuario = await User.findByEmail(email);
  
  if (!usuario) {
    // SEGURANÇA: Não revelar se email existe
    console.log('Se o email existir, instruções foram enviadas');
    return;
  }
  
  // Gerar token único
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Definir expiração (1 hora)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  
  await User.setPasswordResetToken(usuario.id, resetToken, expiresAt);
  
  console.log('Token de reset configurado:', resetToken);
  // Aqui você enviaria o token por email
  
  return resetToken;
}

/**
 * ============================================
 * EXEMPLO 10: LISTAR USUÁRIOS COM PAGINAÇÃO
 * ============================================
 */
async function exemploListarUsuarios() {
  const resultado = await User.findAll({
    page: 1,
    perPage: 10,
    role: 'user', // Filtrar apenas usuários comuns
    isActive: true, // Apenas ativos
    orderBy: 'created_at',
    order: 'DESC',
  });
  
  console.log('Usuários encontrados:', resultado.data.length);
  console.log('Total:', resultado.pagination.total);
  console.log('Páginas:', resultado.pagination.totalPages);
  
  return resultado;
}

/**
 * ============================================
 * EXEMPLO 11: DESATIVAR USUÁRIO (SOFT DELETE)
 * ============================================
 */
async function exemploDesativarUsuario(userId) {
  await User.deactivate(userId);
  console.log('Usuário desativado');
  
  // O usuário ainda existe no banco, mas is_active = false
  // Não poderá fazer login
}

/**
 * ============================================
 * EXEMPLO 12: REATIVAR USUÁRIO
 * ============================================
 */
async function exemploReativarUsuario(userId) {
  await User.reactivate(userId);
  console.log('Usuário reativado');
  
  // is_active = true
  // login_attempts resetado
  // lock_until removido
}

/**
 * ============================================
 * EXEMPLO 13: ESTATÍSTICAS POR ROLE
 * ============================================
 */
async function exemploEstatisticas() {
  const stats = await User.countByRole();
  
  console.log('Estatísticas:');
  stats.forEach(stat => {
    console.log(`${stat.role}: ${stat.total} usuários`);
  });
  
  // Exemplo de saída:
  // user: 150 usuários
  // admin: 5 usuários
}

/**
 * ============================================
 * EXEMPLO 14: COMPARAR SENHA MANUALMENTE
 * ============================================
 */
async function exemploCompararSenha(email, senhaFornecida) {
  // Buscar usuário com senha
  const usuario = await User.findByEmailWithPassword(email);
  
  if (!usuario) {
    return false;
  }
  
  // Comparar senhas
  const isValid = await User.comparePassword(senhaFornecida, usuario.password);
  
  console.log('Senha válida:', isValid);
  return isValid;
}

/**
 * ============================================
 * EXEMPLO 15: FLUXO COMPLETO DE AUTENTICAÇÃO
 * ============================================
 */
async function exemploFluxoCompleto() {
  try {
    // 1. REGISTRO
    console.log('\n1️⃣  REGISTRO');
    const novoUsuario = await User.create({
      name: 'Maria Santos',
      email: 'maria@example.com',
      password: 'SenhaSegura123!@#',
    });
    console.log('✅ Usuário criado:', novoUsuario.id);
    
    // 2. VERIFICAR EMAIL (simulado)
    console.log('\n2️⃣  VERIFICAÇÃO DE EMAIL');
    await User.markEmailAsVerified(novoUsuario.id);
    console.log('✅ Email verificado');
    
    // 3. LOGIN BEM-SUCEDIDO
    console.log('\n3️⃣  LOGIN BEM-SUCEDIDO');
    const usuarioLogado = await User.validateCredentials(
      'maria@example.com',
      'SenhaSegura123!@#'
    );
    console.log('✅ Login OK:', usuarioLogado.email);
    
    // 4. TENTATIVA DE LOGIN COM SENHA ERRADA
    console.log('\n4️⃣  TENTATIVA FALHA');
    try {
      await User.validateCredentials('maria@example.com', 'SenhaErrada');
    } catch (error) {
      console.log('❌ Login falhou:', error.message);
    }
    
    // 5. ATUALIZAR DADOS
    console.log('\n5️⃣  ATUALIZAR PERFIL');
    await User.update(novoUsuario.id, {
      name: 'Maria Santos Silva',
    });
    console.log('✅ Perfil atualizado');
    
    // 6. BUSCAR USUÁRIO ATUALIZADO
    console.log('\n6️⃣  BUSCAR DADOS ATUALIZADOS');
    const usuarioAtualizado = await User.findById(novoUsuario.id);
    console.log('✅ Nome atual:', usuarioAtualizado.name);
    
    // 7. DESATIVAR
    console.log('\n7️⃣  DESATIVAR CONTA');
    await User.deactivate(novoUsuario.id);
    console.log('✅ Conta desativada');
    
    // 8. TENTAR LOGIN COM CONTA DESATIVADA
    console.log('\n8️⃣  TENTAR LOGIN (CONTA DESATIVADA)');
    try {
      await User.validateCredentials('maria@example.com', 'SenhaSegura123!@#');
    } catch (error) {
      console.log('❌ Login negado:', error.message);
    }
    
  } catch (error) {
    console.error('Erro no fluxo:', error.message);
  }
}

/**
 * ============================================
 * SEGURANÇA - BOAS PRÁTICAS DEMONSTRADAS
 * ============================================
 */

/*
1. ✅ PREPARED STATEMENTS
   Todas as queries usam $1, $2, etc - previne SQL Injection

2. ✅ BCRYPT PARA SENHAS
   Hash com 12 rounds (configurável em config/security.js)

3. ✅ SENHA NUNCA É RETORNADA
   Queries normais não retornam password
   Apenas findByEmailWithPassword retorna (para autenticação)

4. ✅ EMAIL NORMALIZADO
   Sempre lowercase e trimmed

5. ✅ MENSAGENS GENÉRICAS
   "Credenciais inválidas" - não revela se email existe

6. ✅ PROTEÇÃO CONTRA BRUTE FORCE
   - Contador de tentativas
   - Bloqueio automático após X tentativas
   - Tempo de bloqueio configurável

7. ✅ TIMING ATTACK PROTECTION
   bcrypt.compare() tem tempo constante

8. ✅ PASSWORD_CHANGED_AT
   Permite invalidar tokens antigos quando senha muda

9. ✅ SOFT DELETE
   Usuários são desativados, não deletados

10. ✅ VALIDAÇÃO DE DUPLICATAS
    Verifica email duplicado antes de inserir
*/

// Exportar exemplos para uso
module.exports = {
  exemploRegistro,
  exemploLogin,
  exemploBuscarPorEmail,
  exemploBuscarPorId,
  exemploVerificarEmail,
  exemploAtualizarDados,
  exemploAtualizarSenha,
  exemploVerificarEmail,
  exemploResetSenha,
  exemploListarUsuarios,
  exemploDesativarUsuario,
  exemploReativarUsuario,
  exemploEstatisticas,
  exemploCompararSenha,
  exemploFluxoCompleto,
};
