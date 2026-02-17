/**
 * SCHEMA DO BANCO DE DADOS POSTGRESQL
 * 
 * Scripts SQL para criar as tabelas necessárias
 * Execute esses comandos no seu banco PostgreSQL antes de iniciar a aplicação
 */

-- ============================================
-- EXTENSÕES
-- ============================================

-- Extensão para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Extensão para funções de criptografia (se necessário)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================
-- TABELA: users
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    
    -- Status da conta
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    
    -- Tokens de verificação e reset
    email_verification_token VARCHAR(255),
    email_verification_expire TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expire TIMESTAMP,
    
    -- Controle de tentativas de login
    login_attempts INTEGER DEFAULT 0,
    lock_until TIMESTAMP,
    
    -- Auditoria
    password_changed_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para performance
    CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Índice para busca por email verification token
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token)
WHERE email_verification_token IS NOT NULL;

-- Índice para busca por password reset token
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token)
WHERE password_reset_token IS NOT NULL;


-- ============================================
-- TABELA: refresh_tokens
-- ============================================

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Expiração e revogação
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    replaced_by_token VARCHAR(255),
    
    -- Auditoria de IP
    created_by_ip VARCHAR(45), -- IPv6 pode ter até 45 caracteres
    revoked_by_ip VARCHAR(45),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- Índice para busca por usuário
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);

-- Índice para busca por tokens ativos
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active ON refresh_tokens(is_active, expires_at)
WHERE is_active = true;


-- ============================================
-- TRIGGER: Atualizar updated_at automaticamente
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para tabela users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para tabela refresh_tokens
DROP TRIGGER IF EXISTS update_refresh_tokens_updated_at ON refresh_tokens;
CREATE TRIGGER update_refresh_tokens_updated_at
    BEFORE UPDATE ON refresh_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- FUNÇÃO: Limpar tokens expirados (Cleanup)
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM refresh_tokens
    WHERE expires_at < CURRENT_TIMESTAMP
      AND is_active = false;
    
    RAISE NOTICE 'Tokens expirados removidos';
END;
$$ LANGUAGE plpgsql;

-- Para executar manualmente:
-- SELECT cleanup_expired_tokens();


-- ============================================
-- DADOS DE TESTE (Opcional - apenas desenvolvimento)
-- ============================================

-- ATENÇÃO: Não execute isso em produção!
-- Senha: Admin123!@# (já hasheada com bcrypt)

-- INSERT INTO users (name, email, password, role, is_email_verified)
-- VALUES (
--     'Admin User',
--     'admin@example.com',
--     '$2a$12$exemplo_de_hash_bcrypt_aqui',
--     'admin',
--     true
-- );


-- ============================================
-- QUERIES ÚTEIS PARA MONITORAMENTO
-- ============================================

-- Ver todos os usuários
-- SELECT id, name, email, role, is_active, created_at FROM users;

-- Ver refresh tokens ativos
-- SELECT rt.id, rt.token, u.email, rt.expires_at, rt.created_at
-- FROM refresh_tokens rt
-- JOIN users u ON rt.user_id = u.id
-- WHERE rt.is_active = true
-- ORDER BY rt.created_at DESC;

-- Ver estatísticas do banco
-- SELECT 
--     (SELECT COUNT(*) FROM users) as total_users,
--     (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
--     (SELECT COUNT(*) FROM refresh_tokens WHERE is_active = true) as active_tokens;
