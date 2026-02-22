/**
 * SERVICE: EMAIL
 * 
 * Responsabilidades:
 * - Enviar emails de verificação
 * - Enviar emails de reset de senha
 * - Enviar notificações de segurança
 * - Templates de email
 * 
 * SEGURANÇA:
 * - Usa Nodemailer para envio seguro
 * - Credenciais via variáveis de ambiente
 * - Templates HTML responsivos
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Configurar transporter do Nodemailer
 * 
 * VARIÁVEIS DE AMBIENTE REQUERIDAS:
 * - EMAIL_HOST: Host SMTP (ex: smtp.gmail.com)
 * - PORTA_DE_EMAIL: Porta SMTP (ex: 587, 465)
 * - USUÁRIO_DE_EMAIL: Usuário SMTP
 * - SENHA_DE_EMAIL: Senha SMTP
 * - E_MAIL_DE: Email remetente
 */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.PORTA_DE_EMAIL || '587'),
  secure: process.env.PORTA_DE_EMAIL === '465', // true para porta 465, false para outras
  auth: {
    user: process.env.USUÁRIO_DE_EMAIL,
    pass: process.env.SENHA_DE_EMAIL,
  },
});

/**
 * Verificar configuração do transporter
 */
const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('[EMAIL SERVICE] Configuração SMTP verificada com sucesso');
    return true;
  } catch (error) {
    console.error('[EMAIL SERVICE] Erro na configuração SMTP:', error.message);
    console.warn('[EMAIL SERVICE] Emails serão logados no console (modo fallback)');
    return false;
  }
};

// Verificar configuração ao iniciar (não bloqueante)
let emailEnabled = false;
verifyTransporter().then(result => {
  emailEnabled = result;
});

/**
 * Enviar email genérico
 * 
 * @param {Object} options - Opções do email
 * @param {string} options.to - Email destinatário
 * @param {string} options.subject - Assunto
 * @param {string} options.text - Texto plano
 * @param {string} options.html - HTML
 */
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Se Nodemailer estiver configurado, enviar email real
    if (emailEnabled) {
      const mailOptions = {
        from: process.env.E_MAIL_DE || 'noreply@seuapp.com',
        to,
        subject,
        text,
        html,
      };
      
      const info = await transporter.sendMail(mailOptions);
      logger.info(`[EMAIL] Email enviado para: ${to} | MessageID: ${info.messageId}`);
      console.log(`[EMAIL] ✅ Email enviado com sucesso para: ${to}`);
    } else {
      // Fallback: Logar no console
      console.log('\n========================================');
      console.log('📧 EMAIL (MODO DESENVOLVIMENTO)');
      console.log('========================================');
      console.log(`Para: ${to}`);
      console.log(`Assunto: ${subject}`);
      console.log('----------------------------------------');
      console.log(text || 'Ver HTML abaixo:');
      if (html) {
        console.log('\nHTML:');
        console.log(html);
      }
      console.log('========================================\n');
    }
  } catch (error) {
    logger.error('[EMAIL] Erro ao enviar email:', error);
    console.error('[EMAIL] ❌ Erro ao enviar email:', error.message);
    throw error;
  }
};

/**
 * Enviar email de verificação de conta
 * 
 * @param {Object} user - Usuário
 * @param {string} verificationToken - Token de verificação
 */
const sendVerificationEmail = async (user, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;
  
  const text = `
Olá ${user.name},

Bem-vindo! Para completar seu cadastro, verifique seu email clicando no link abaixo:

${verificationUrl}

Este link expira em 24 horas.

Se você não criou esta conta, ignore este email.

---
Equipe de Segurança
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; background: #6366F1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verificação de Email</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${user.name}</strong>,</p>
      <p>Bem-vindo! Para completar seu cadastro, clique no botão abaixo para verificar seu email:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verificar Email</a>
      </div>
      <p>Ou copie e cole este link no navegador:</p>
      <p style="word-break: break-all; color: #6366F1;">${verificationUrl}</p>
      <p style="margin-top: 30px; color: #666; font-size: 14px;">Este link expira em 24 horas.</p>
      <p style="color: #999; font-size: 13px;">Se você não criou esta conta, ignore este email.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Secure Auth System. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
  
  await sendEmail({
    to: user.email,
    subject: 'Verificação de Email - Secure Auth System',
    text,
    html,
  });
};

/**
 * Enviar email de reset de senha com código
 * 
 * SEGURANÇA:
 * - Código de 6 dígitos
 * - Expira em 15 minutos
 * - HTML responsivo e profissional
 * 
 * @param {Object} user - Usuário
 * @param {string} resetCode - Código de 6 dígitos
 */
const sendPasswordResetEmail = async (user, resetCode) => {
  const text = `
Olá ${user.name},

Você solicitou a recuperação de senha.

SEU CÓDIGO DE VERIFICAÇÃO: ${resetCode}

Este código expira em 15 minutos.

Se você não solicitou isso, ignore este email e sua senha permanecerá inalterada.

---
Equipe de Segurança
  `;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
    .code-box { background: white; border: 2px dashed #6366F1; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0; }
    .code { font-size: 32px; font-weight: bold; color: #6366F1; letter-spacing: 8px; font-family: monospace; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔐 Recuperação de Senha</h1>
    </div>
    <div class="content">
      <p>Olá <strong>${user.name}</strong>,</p>
      <p>Você solicitou a recuperação de senha. Use o código abaixo para criar uma nova senha:</p>
      
      <div class="code-box">
        <p style="margin: 0; color: #666; font-size: 14px;">Código de Verificação</p>
        <div class="code">${resetCode}</div>
        <p style="margin: 0; color: #999; font-size: 12px; margin-top: 10px;">Expira em 15 minutos</p>
      </div>
      
      <div class="warning">
        <p style="margin: 0;"><strong>⚠️ Importante:</strong></p>
        <p style="margin: 5px 0 0 0;">Se você não solicitou esta recuperação, ignore este email. Sua senha permanecerá inalterada.</p>
      </div>
      
      <p style="color: #666; font-size: 13px; margin-top: 30px;">
        Por segurança:
      </p>
      <ul style="color: #666; font-size: 13px;">
        <li>Nunca compartilhe este código</li>
        <li>Nossa equipe nunca pedirá seu código</li>
        <li>Use uma senha forte e única</li>
      </ul>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Secure Auth System. Todos os direitos reservados.</p>
      <p>Este email foi enviado para: ${user.email}</p>
    </div>
  </div>
</body>
</html>
  `;
  
  await sendEmail({
    to: user.email,
    subject: 'Código de Recuperação de Senha - Secure Auth System',
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
