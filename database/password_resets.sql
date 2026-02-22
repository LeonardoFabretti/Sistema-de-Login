-- =============================================
-- TABELA: PASSWORD_RESETS
-- Descrição: Armazena códigos temporários de recuperação de senha
-- =============================================

CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_password_resets_email 
    ON password_resets(email);

-- Índice adicional para limpeza de códigos expirados
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at 
    ON password_resets(expires_at);

-- Comentários para documentação
COMMENT ON TABLE password_resets IS 'Tabela para armazenar códigos temporários de recuperação de senha';
COMMENT ON COLUMN password_resets.id IS 'Identificador único do registro';
COMMENT ON COLUMN password_resets.email IS 'Email do usuário solicitante';
COMMENT ON COLUMN password_resets.code_hash IS 'Hash do código de verificação (bcrypt)';
COMMENT ON COLUMN password_resets.expires_at IS 'Data/hora de expiração do código (15 minutos)';
COMMENT ON COLUMN password_resets.created_at IS 'Data/hora de criação do registro';
