/**
 * SERVICE: EMAIL
 * 
 * Responsabilidades:
 * - Enviar emails de verificação
 * - Enviar emails de reset de senha
 * - Enviar notificações de segurança
 * - Templates de email
 */

// const nodemailer = require('nodemailer');
// const logger = require('../utils/logger');

/**
 * Configurar transporter do Nodemailer
 */
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST,
//   port: process.env.EMAIL_PORT,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASSWORD,
//   },
// });

/**
 * Enviar email genérico
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // const mailOptions = {
    //   from: process.env.EMAIL_FROM,
    //   to,
    //   subject,
    //   text,
    //   html,
    // };
    
    // await transporter.sendMail(mailOptions);
    // logger.info(`Email enviado para: ${to}`);
    
    console.log(`[EMAIL] Email enviado para: ${to} - Assunto: ${subject}`);
  } catch (error) {
    // logger.error('Erro ao enviar email:', error);
    throw error;
  }
};

/**
 * Enviar email de verificação
 */
const sendVerificationEmail = async (user, verificationToken) => {
  // const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  // const html = `
  //   <h1>Verificação de Email</h1>
  //   <p>Olá ${user.name},</p>
  //   <p>Clique no link abaixo para verificar seu email:</p>
  //   <a href="${verificationUrl}">Verificar Email</a>
  //   <p>Se você não criou esta conta, ignore este email.</p>
  // `;
  
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Verificação de Email',
  //   html,
  // });
};

/**
 * Enviar email de reset de senha
 */
const sendPasswordResetEmail = async (user, resetCode) => {
  console.log('\n========================================');
  console.log('📧 EMAIL DE RECUPERAÇÃO DE SENHA');
  console.log('========================================');
  console.log(`Para: ${user.email}`);
  console.log(`Nome: ${user.name}`);
  console.log(`Assunto: Código de Recuperação de Senha`);
  console.log('----------------------------------------');
  console.log(`Olá ${user.name},`);
  console.log('');
  console.log('Você solicitou a recuperação de senha.');
  console.log('');
  console.log(`SEU CÓDIGO DE VERIFICAÇÃO:`);
  console.log(`⭐ ${resetCode} ⭐`);
  console.log('');
  console.log('Este código expira em 15 minutos.');
  console.log('');
  console.log('Se você não solicitou isso, ignore este email.');
  console.log('========================================\n');
  
  // const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
  // const html = `
  //   <h1>Reset de Senha</h1>
  //   <p>Olá ${user.name},</p>
  //   <p>Você solicitou um reset de senha. Clique no link abaixo:</p>
  //   <a href="${resetUrl}">Resetar Senha</a>
  //   <p>Este link expira em 1 hora.</p>
  //   <p>Se você não solicitou isso, ignore este email.</p>
  // `;
  
  // await sendEmail({
  //   to: user.email,
  //   subject: 'Reset de Senha',
  //   html,
  // });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
