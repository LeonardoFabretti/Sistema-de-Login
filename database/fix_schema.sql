-- CORREÇÃO DO SCHEMA: Adicionar coluna 'role' se não existir
-- Execute este script se você tiver o erro: "column 'role' does not exist"

-- Adicionar coluna 'role' à tabela users se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin'));
        RAISE NOTICE 'Coluna "role" adicionada com sucesso!';
    ELSE
        RAISE NOTICE 'Coluna "role" já existe.';
    END IF;
END $$;

-- Verificar se a tabela existe, se não, criar todo o schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Tabela users não existe. Execute o schema.sql completo primeiro!';
    END IF;
END $$;
