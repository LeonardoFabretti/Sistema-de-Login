/**
 * SERVIDOR SIMPLIFICADO SEM BANCO DE DADOS
 * Para testes rápidos - armazena usuários em memória
 */

const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 5000;

// Armazenamento temporário em memória
const users = [];

// Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para desenvolvimento
}));
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// JWT Secret
const JWT_SECRET = 'dev_secret_key_for_testing_only';

// ==========================================
// ROTAS
// ==========================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando!' });
});

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validação básica
    if (!name || !email || !password) {
      return res.status(400).json({
        error: { message: 'Todos os campos são obrigatórios' }
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: { message: 'Senha deve ter no mínimo 8 caracteres' }
      });
    }

    // Verificar se email já existe
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        error: { message: 'Email já cadastrado' }
      });
    }

    // Hash da senha
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Criar usuário
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      createdAt: new Date()
    };

    users.push(newUser);

    // Gerar token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    console.log(`✅ Novo usuário registrado: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        },
        accessToken: token
      }
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({
      error: { message: 'Erro interno do servidor' }
    });
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'Email e senha são obrigatórios' }
      });
    }

    // Buscar usuário
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: { message: 'Credenciais inválidas' }
      });
    }

    // Verificar senha
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: { message: 'Credenciais inválidas' }
      });
    }

    // Gerar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '30m' }
    );

    console.log(`✅ Login bem-sucedido: ${email}`);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        accessToken: token
      }
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      error: { message: 'Erro interno do servidor' }
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Rota não encontrada' } });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: { message: 'Erro interno do servidor' } });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`   SERVIDOR SIMPLIFICADO RODANDO`);
  console.log(`   Porta: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log('========================================\n');
  console.log('ℹ️  Esse servidor usa memória RAM (dados são perdidos ao reiniciar)');
  console.log('ℹ️  Para produção, configure PostgreSQL e use server.js\n');
});
