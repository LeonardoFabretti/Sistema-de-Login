/**
 * SCRIPT DE TESTE DE CONEXÃO POSTGRESQL
 * 
 * Execute este script para testar a conexão com o banco de dados
 * Comando: node scripts/testConnection.js
 */

require('dotenv').config();
const { connectDB, query, transaction, healthCheck, disconnectDB } = require('../src/config/database');

async function testConnection() {
  console.log('🔍 Testando conexão com PostgreSQL...\n');
  
  try {
    // 1. Testar conexão básica
    console.log('1️⃣  Testando conexão básica...');
    await connectDB();
    console.log('   ✅ Conexão estabelecida com sucesso!\n');
    
    // 2. Testar health check
    console.log('2️⃣  Testando health check...');
    const health = await healthCheck();
    console.log('   Status:', health.status);
    console.log('   Mensagem:', health.message);
    console.log('   ✅ Health check OK!\n');
    
    // 3. Testar query simples
    console.log('3️⃣  Testando query simples...');
    const result = await query('SELECT NOW() as current_time, version() as version');
    console.log('   Hora do servidor:', result.rows[0].current_time);
    console.log('   Versão PostgreSQL:', result.rows[0].version.split(',')[0]);
    console.log('   ✅ Query executada com sucesso!\n');
    
    // 4. Verificar se tabelas existem
    console.log('4️⃣  Verificando tabelas...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tables.rows.length > 0) {
      console.log('   Tabelas encontradas:');
      tables.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
      console.log('   ✅ Tabelas verificadas!\n');
    } else {
      console.log('   ⚠️  Nenhuma tabela encontrada.');
      console.log('   Execute o script database/schema.sql para criar as tabelas.\n');
    }
    
    // 5. Testar transação
    console.log('5️⃣  Testando transação (ROLLBACK)...');
    try {
      await transaction(async (client) => {
        await client.query('SELECT 1');
        // Forçar erro para testar rollback
        throw new Error('Teste de rollback');
      });
    } catch (e) {
      if (e.message === 'Teste de rollback') {
        console.log('   ✅ Rollback funcionou corretamente!\n');
      } else {
        throw e;
      }
    }
    
    // 6. Verificar extensões instaladas
    console.log('6️⃣  Verificando extensões PostgreSQL...');
    const extensions = await query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    if (extensions.rows.length > 0) {
      console.log('   Extensões instaladas:');
      extensions.rows.forEach(ext => {
        console.log(`   - ${ext.extname} (v${ext.extversion})`);
      });
      console.log('   ✅ Extensões verificadas!\n');
    } else {
      console.log('   ⚠️  Extensões não encontradas.');
      console.log('   Execute: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n');
    }
    
    // 7. Estatísticas do banco
    console.log('7️⃣  Estatísticas do banco...');
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
        pg_database.datname as database_name,
        pg_size_pretty(pg_database_size(pg_database.datname)) as database_size
      FROM pg_database
      WHERE datname = current_database()
    `);
    
    console.log('   Nome do banco:', stats.rows[0].database_name);
    console.log('   Tamanho:', stats.rows[0].database_size);
    console.log('   Total de tabelas:', stats.rows[0].total_tables);
    console.log('   ✅ Estatísticas obtidas!\n');
    
    // Sucesso total
    console.log('🎉 TODOS OS TESTES PASSARAM! 🎉');
    console.log('✅ Sua conexão PostgreSQL está funcionando perfeitamente.\n');
    
  } catch (error) {
    console.error('\n❌ ERRO NOS TESTES:\n');
    console.error('Mensagem:', error.message);
    console.error('Código:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Dica: Host não encontrado. Verifique DATABASE_URL no .env');
    } else if (error.code === '28P01') {
      console.error('\n💡 Dica: Credenciais inválidas. Verifique username/password no DATABASE_URL');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Dica: Conexão recusada. Verifique se o servidor PostgreSQL está rodando');
    } else if (error.code === '3D000') {
      console.error('\n💡 Dica: Banco de dados não existe. Verifique o nome do database na URL');
    }
    
    console.error('\nStack completo:');
    console.error(error.stack);
    
    process.exit(1);
  } finally {
    // Fechar conexões
    console.log('🔌 Fechando conexões...');
    await disconnectDB();
    console.log('✅ Conexões fechadas.\n');
  }
}

// Executar teste
testConnection();
