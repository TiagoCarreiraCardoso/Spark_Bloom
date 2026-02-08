import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  attachments?: Array<{ filename: string; path: string }>
}

/**
 * Envia um email
 */
export async function sendEmail(options: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    })
    return { success: true }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error }
  }
}

/**
 * Gera o HTML do email de confirmação de sessão
 */
export function generateConfirmationEmailHtml(
  utenteNome: string,
  dataSessao: Date,
  confirmLink: string,
  rejectLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .button { display: inline-block; padding: 12px 24px; margin: 10px 5px; 
                  text-decoration: none; border-radius: 5px; font-weight: bold; }
        .button-confirm { background-color: #4CAF50; color: white; }
        .button-reject { background-color: #f44336; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Confirmação de Sessão - Spark & Bloom</h2>
        <p>Olá,</p>
        <p>Você tem uma sessão agendada:</p>
        <ul>
          <li><strong>Utente:</strong> ${utenteNome}</li>
          <li><strong>Data/Hora:</strong> ${dataSessao.toLocaleString('pt-PT')}</li>
        </ul>
        <p>Por favor, confirme ou rejeite a realização desta sessão:</p>
        <p>
          <a href="${confirmLink}" class="button button-confirm">Confirmar Sessão</a>
          <a href="${rejectLink}" class="button button-reject">Rejeitar Sessão</a>
        </p>
        <p><small>Estes links expiram em 24 horas.</small></p>
      </div>
    </body>
    </html>
  `
}
