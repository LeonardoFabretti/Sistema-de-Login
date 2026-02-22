-- =============================================
-- FIX: TABELA PASSWORD_RESETS
-- Problema: expires_at está como TEXT em vez de TIMESTAMP
-- Solução: Recriar tabela com tipos corretos
-- =============================================

-- 1. DELETAR tabela antiga (se existir)
DROP TABLE IF EXISTS password_resets;

-- 2. CRIAR tabela correta com TIMESTAMP
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,  -- TIPO CORRETO!
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX idx_password_resets_email 
    ON password_resets(email);

CREATE INDEX idx_password_resets_expires_at 
    ON password_resets(expires_at);

-- 4. Comentários para documentação
COMMENT ON TABLE password_resets IS 'Tabela para armazenar códigos temporários de recuperação de senha';
COMMENT ON COLUMN password_resets.expires_at IS 'Data/hora de expiração do código (15 minutos) - TIMESTAMP';

-- Verificar estrutura:
-- \d password_resets
