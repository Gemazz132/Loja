'use strict';

const nodemailer = require('nodemailer');

/**
 * Mailer opcional. Se as variáveis SMTP estiverem definidas no .env, envia emails
 * a sério; caso contrário fica em "modo dev" (não envia, apenas regista no
 * console e devolve o conteúdo para se poder testar localmente).
 *
 * Variáveis suportadas:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, MAIL_FROM
 */
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_SECURE,
  MAIL_FROM,
} = process.env;

const configurado = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;
if (configurado) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const remetente = MAIL_FROM || SMTP_USER || 'AURUM <no-reply@aurum.pt>';

/**
 * Envia um email. Em modo dev (sem SMTP) não envia — só regista e devolve
 * { dev: true } para o chamador poder, por exemplo, expor o link em ambiente
 * de desenvolvimento.
 */
async function enviarEmail({ to, subject, html, text }) {
  if (!configurado) {
    console.log('\n[mailer] SMTP não configurado — email NÃO enviado (modo dev).');
    console.log(`[mailer] Para: ${to}`);
    console.log(`[mailer] Assunto: ${subject}`);
    if (text) console.log(`[mailer] Texto: ${text}\n`);
    return { dev: true, enviado: false };
  }
  await transporter.sendMail({ from: remetente, to, subject, html, text });
  return { dev: false, enviado: true };
}

module.exports = { enviarEmail, mailerConfigurado: configurado };
