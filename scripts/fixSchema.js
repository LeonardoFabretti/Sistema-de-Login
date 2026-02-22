/**
 * SCRIPT: Corrigir Schema do Banco de Dados
 * 
 * Adiciona a coluna 'role' à tabela users se ela não existir.
 * Execute este script se você receber o erro: "column 'role' does not exist"
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

const fixSchema = async () => {
  console.log('🔧 Iniciando correção do schema...\n');
  
  try {
    // Verificar se a tabela users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Tabela "users" não existe!');
      console.log('   Execute o schema.sql completo primeiro:');
      console.log('   psql -U usuario -d database -f database/schema.sql\n');
      process.exit(1);
    }
    
    console.log('✓ Tabela "users" encontrada');
    
    // Verificar se a coluna 'role' existe
    const columnCheck = await pool.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      );
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('✓ Coluna "role" já existe - nenhuma correção necessária!\n');
    } else {
      console.log('⚠️  Coluna "role" não encontrada - adicionando...');
      
      // Adicionar coluna 'role'
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) DEFAULT 'user' 
        CHECK (role IN ('user', 'admin'));
      `);
      
      console.log('✓ Coluna "role" adicionada com sucesso!\n');
    }
    
    // Verificar outras colunas importantes
    console.log('Verificando outras colunas...');
    
    const requiredColumns = [
      'id', 'name', 'email', 'password', 'role', 
      'is_active', 'is_email_verified', 'created_at', 'updated_at'
    ];
    
    for (const col of requiredColumns) {
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1
        );
      `, [col]);
      
      const icon = check.rows[0].exists ? '✓' : '✗';
      console.log(`  ${icon} ${col}`);
    }
    
    console.log('\n✅ Correção do schema concluída!\n');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Executar
fixSchema();
