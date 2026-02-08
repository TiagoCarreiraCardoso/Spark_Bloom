import cron from 'node-cron'
import { syncCalendarEvents } from '../lib/graph/sync'
import { prisma } from '../lib/prisma'
import { sendEmail, generateConfirmationEmailHtml } from '../lib/email/service'
import { generateMagicLinkToken } from '../lib/utils/jwt'

/**
 * Job de sincronização de calendários (a cada 5 minutos)
 */
export function startSyncJob() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('Iniciando sincronização de calendários...')

    try {
      // Obter calendários configurados (pode vir de uma tabela de configuração)
      const calendarIds = process.env.OUTLOOK_CALENDAR_IDS?.split(',') || []

      if (calendarIds.length === 0) {
        console.log('Nenhum calendário configurado')
        return
      }

      const from = new Date()
      const to = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias

      const results = await syncCalendarEvents({
        calendarIds,
        from,
        to,
        matchingStrategy: 'subject', // Pode ser configurável
      })

      console.log('Sincronização concluída:', results)
    } catch (error) {
      console.error('Erro na sincronização:', error)
    }
  })
}

/**
 * Job de envio de emails de confirmação (a cada minuto)
 */
export function startEmailJob() {
  cron.schedule('* * * * *', async () => {
    try {
      // Buscar sessões que estão prestes a começar (dentro de 5 minutos) ou que já começaram
      const agora = new Date()
      const limite = new Date(agora.getTime() + 5 * 60 * 1000) // +5 minutos

      const sessoes = await prisma.sessao.findMany({
        where: {
          estadoSessao: 'PENDENTE',
          dataSessao: {
            lte: limite,
            gte: new Date(agora.getTime() - 60 * 60 * 1000), // Não enviar para sessões com mais de 1h de atraso
          },
        },
        include: {
          utente: true,
        },
      })

      for (const sessao of sessoes) {
        // Verificar se já foi enviado email (pode adicionar campo emailEnviado)
        // Por enquanto, vamos enviar sempre

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        const confirmToken = generateMagicLinkToken(sessao.id)
        const rejectToken = generateMagicLinkToken(sessao.id)

        const confirmLink = `${baseUrl}/api/webhooks/sessao/${sessao.id}/confirm?token=${confirmToken}`
        const rejectLink = `${baseUrl}/api/webhooks/sessao/${sessao.id}/reject?token=${rejectToken}`

        // Email do terapeuta (pode vir de configuração ou do utente)
        const terapeutaEmail = process.env.TERAPEUTA_EMAIL || 'terapeuta@sparkbloom.com'

        const html = generateConfirmationEmailHtml(
          sessao.utente.nome,
          sessao.dataSessao,
          confirmLink,
          rejectLink
        )

        await sendEmail({
          to: terapeutaEmail,
          subject: `Confirmação de Sessão - ${sessao.utente.nome}`,
          html,
        })

        console.log(`Email de confirmação enviado para sessão ${sessao.id}`)
      }
    } catch (error) {
      console.error('Erro no job de emails:', error)
    }
  })
}

/**
 * Inicia todos os jobs
 */
export function startAllJobs() {
  console.log('Iniciando jobs de cron...')
  startSyncJob()
  startEmailJob()
  console.log('Jobs de cron iniciados')
}
