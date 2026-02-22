/**
 * SCRIPT: Corrigir tabela password_resets no Railway
 * 
 * Problema: expires_at está como TEXT, deveria ser TIMESTAMP
 * Solução: Recria a tabela com tipo correto
 * 
 * COMO USAR:
 * node scripts/fixPasswordResetsTable.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Conectar ao banco usando variáveis de ambiente
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPasswordResetsTable() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Iniciando correção da tabela password_resets...\n');
    
    // 1. Deletar tabela antiga
    console.log('1️⃣ Deletando tabela antiga...');
    await client.query('DROP TABLE IF EXISTS password_resets');
    console.log('   ✅ Tabela antiga deletada\n');
    
    // 2. Criar tabela correta com TIMESTAMP
    console.log('2️⃣ Criando tabela com tipo TIMESTAMP correto...');
    await client.query(`
      CREATE TABLE password_resets (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ Tabela criada com sucesso\n');
    
    // 3. Criar índices
    console.log('3️⃣ Criando índices para performance...');
    await client.query(`
      CREATE INDEX idx_password_resets_email 
      ON password_resets(email)
    `);
    await client.query(`
      CREATE INDEX idx_password_resets_expires_at 
      ON password_resets(expires_at)
    `);
    console.log('   ✅ Índices criados\n');
    
    // 4. Verificar estrutura
    console.log('4️⃣ Verificando estrutura da tabela...');
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'password_resets'
      ORDER BY ordinal_position
    `);
    
    console.log('   📋 Estrutura da tabela:');
    result.rows.forEach(row => {
      const icon = row.column_name === 'expires_at' && row.data_type.includes('timestamp') ? '✅' : '  ';
      console.log(`   ${icon} ${row.column_name.padEnd(15)} → ${row.data_type}`);
    });
    
    console.log('\n🎉 Tabela password_resets corrigida com sucesso!');
    console.log('✅ Agora você pode testar a recuperação de senha\n');
    
  } catch (error) {
    console.error('\n❌ Erro ao corrigir tabela:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar script
fixPasswordResetsTable()
  .then(() => {
    console.log('Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script falhou:', error);
    process.exit(1);
  });
