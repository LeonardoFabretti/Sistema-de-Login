/**
 * SCRIPT: Completar Schema do Banco de Dados
 * 
 * Adiciona todas as colunas necessárias que possam estar faltando
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false,
  } : false,
});

const completeSchema = async () => {
  console.log('🔧 Completando schema do banco de dados...\n');
  
  try {
    const missingColumns = [];
    
    // Lista de colunas a adicionar se não existirem
    const columns = [
      {
        name: 'is_active',
        definition: 'BOOLEAN DEFAULT true',
      },
      {
        name: 'is_email_verified',
        definition: 'BOOLEAN DEFAULT false',
      },
      {
        name: 'updated_at',
        definition: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      },
      {
        name: 'login_attempts',
        definition: 'INTEGER DEFAULT 0',
      },
      {
        name: 'lock_until',
        definition: 'TIMESTAMP',
      },
      {
        name: 'last_login',
        definition: 'TIMESTAMP',
      },
      {
        name: 'password_changed_at',
        definition: 'TIMESTAMP',
      },
      {
        name: 'email_verification_token',
        definition: 'VARCHAR(255)',
      },
      {
        name: 'email_verification_expire',
        definition: 'TIMESTAMP',
      },
      {
        name: 'password_reset_token',
        definition: 'VARCHAR(255)',
      },
      {
        name: 'password_reset_expire',
        definition: 'TIMESTAMP',
      },
    ];
    
    for (const col of columns) {
      // Verificar se a coluna existe
      const check = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1
        );
      `, [col.name]);
      
      if (!check.rows[0].exists) {
        console.log(`⚠️  Adicionando coluna "${col.name}"...`);
        await pool.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.definition};`);
        console.log(`   ✓ Coluna "${col.name}" adicionada!`);
        missingColumns.push(col.name);
      } else {
        console.log(`✓ Coluna "${col.name}" já existe`);
      }
    }
    
    if (missingColumns.length > 0) {
      console.log(`\n✅ ${missingColumns.length} coluna(s) adicionada(s) com sucesso!`);
    } else {
      console.log('\n✅ Schema já está completo!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

completeSchema();
