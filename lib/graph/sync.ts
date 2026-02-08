import { getGraphClient } from './client'
import { prisma } from '../prisma'
import { calcularValoresSessao } from '../utils/calculations'

interface CalendarEvent {
  id: string
  subject: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  attendees?: Array<{ emailAddress: { address: string } }>
  categories?: string[]
  body?: { content: string }
}

interface SyncOptions {
  calendarIds: string[]
  from: Date
  to: Date
  matchingStrategy?: 'subject' | 'attendee' | 'category' | 'extension'
}

/**
 * Estratégia 1: Matching por código no assunto (ex: UTENTE:12345)
 */
async function matchBySubject(
  event: CalendarEvent,
  utentes: Array<{ id: string; codigo: number; email?: string | null }>
): Promise<string | null> {
  const subjectMatch = event.subject.match(/UTENTE[:\s]+(\d+)/i)
  if (subjectMatch) {
    const codigo = parseInt(subjectMatch[1], 10)
    const utente = utentes.find((u) => u.codigo === codigo)
    if (utente) return utente.id
  }
  return null
}

/**
 * Estratégia 2: Matching por email do participante
 */
async function matchByAttendee(
  event: CalendarEvent,
  utentes: Array<{ id: string; email?: string | null; emailPai?: string | null; emailMae?: string | null }>
): Promise<string | null> {
  if (!event.attendees) return null

  for (const attendee of event.attendees) {
    const email = attendee.emailAddress.address.toLowerCase()
    const utente = utentes.find(
      (u) =>
        u.email?.toLowerCase() === email ||
        u.emailPai?.toLowerCase() === email ||
        u.emailMae?.toLowerCase() === email
    )
    if (utente) return utente.id
  }
  return null
}

/**
 * Estratégia 3: Matching por categoria (ex: Utente:12345)
 */
async function matchByCategory(
  event: CalendarEvent,
  utentes: Array<{ id: string; codigo: number }>
): Promise<string | null> {
  if (!event.categories || event.categories.length === 0) return null

  for (const category of event.categories) {
    const categoryMatch = category.match(/Utente[:\s]+(\d+)/i)
    if (categoryMatch) {
      const codigo = parseInt(categoryMatch[1], 10)
      const utente = utentes.find((u) => u.codigo === codigo)
      if (utente) return utente.id
    }
  }
  return null
}

/**
 * Resolve o utenteId a partir de um evento usando a estratégia especificada
 */
async function resolveUtenteId(
  event: CalendarEvent,
  utentes: Array<{
    id: string
    codigo: number
    email?: string | null
    emailPai?: string | null
    emailMae?: string | null
  }>,
  strategy: SyncOptions['matchingStrategy'] = 'subject'
): Promise<string | null> {
  switch (strategy) {
    case 'subject':
      return matchBySubject(event, utentes)
    case 'attendee':
      return matchByAttendee(event, utentes)
    case 'category':
      return matchByCategory(event, utentes)
    default:
      // Tentar todas as estratégias em ordem
      const bySubject = await matchBySubject(event, utentes)
      if (bySubject) return bySubject

      const byAttendee = await matchByAttendee(event, utentes)
      if (byAttendee) return byAttendee

      return matchByCategory(event, utentes)
  }
}

/**
 * Obtém a condição comercial vigente para um utente em uma data específica
 */
async function getCondicaoVigente(utenteId: string, data: Date) {
  const condicao = await prisma.condicaoComercial.findFirst({
    where: {
      utenteId,
      inicioVigencia: { lte: data },
      OR: [{ fimVigencia: null }, { fimVigencia: { gte: data } }],
    },
    orderBy: { inicioVigencia: 'desc' },
  })

  return condicao
}

/**
 * Sincroniza eventos do calendário e cria/atualiza sessões
 */
export async function syncCalendarEvents(options: SyncOptions) {
  const { calendarIds, from, to, matchingStrategy = 'subject' } = options

  const graphClient = await getGraphClient()
  const utentes = await prisma.utente.findMany({
    where: { statusProcesso: 'ATIVO' },
    select: {
      id: true,
      codigo: true,
      email: true,
      emailPai: true,
      emailMae: true,
    },
  })

  const results = {
    created: 0,
    updated: 0,
    errors: 0,
  }

  for (const calendarId of calendarIds) {
    try {
      const events = await graphClient
        .api(`/users/${calendarId}/calendar/events`)
        .filter(`start/dateTime ge '${from.toISOString()}' and end/dateTime le '${to.toISOString()}'`)
        .get()

      for (const event of events.value as CalendarEvent[]) {
        try {
          const utenteId = await resolveUtenteId(event, utentes, matchingStrategy)

          if (!utenteId) {
            console.log(`Não foi possível resolver utente para evento ${event.id}`)
            continue
          }

          const dataSessao = new Date(event.start.dateTime)
          const condicao = await getCondicaoVigente(utenteId, dataSessao)

          if (!condicao) {
            console.log(`Não há condição comercial vigente para utente ${utenteId} em ${dataSessao}`)
            continue
          }

          const valores = calcularValoresSessao(condicao)

          // Verificar se sessão já existe
          const sessaoExistente = await prisma.sessao.findUnique({
            where: { outlookEventId: event.id },
          })

          if (sessaoExistente) {
            // Atualizar sessão existente
            await prisma.sessao.update({
              where: { id: sessaoExistente.id },
              data: {
                dataSessao,
                valorSessao: valores.valorSessao,
                valorTerapeuta: valores.valorTerapeuta,
                retencaoIRS: valores.retencaoIRS,
                valorLiquido: valores.valorLiquido,
                sujeitaRecibo: valores.sujeitaRecibo,
              },
            })
            results.updated++
          } else {
            // Criar nova sessão
            await prisma.sessao.create({
              data: {
                utenteId,
                dataSessao,
                outlookEventId: event.id,
                outlookCalendar: calendarId,
                valorSessao: valores.valorSessao,
                valorTerapeuta: valores.valorTerapeuta,
                retencaoIRS: valores.retencaoIRS,
                valorLiquido: valores.valorLiquido,
                sujeitaRecibo: valores.sujeitaRecibo,
                estadoSessao: 'PENDENTE',
              },
            })
            results.created++
          }
        } catch (error) {
          console.error(`Erro ao processar evento ${event.id}:`, error)
          results.errors++
        }
      }
    } catch (error) {
      console.error(`Erro ao sincronizar calendário ${calendarId}:`, error)
      results.errors++
    }
  }

  return results
}
