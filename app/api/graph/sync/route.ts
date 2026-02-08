import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware/auth'
import { syncCalendarEvents } from '@/lib/graph/sync'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['ADMIN', 'TERAPEUTA'])
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const { calendarIds, from, to, matchingStrategy } = body

    if (!calendarIds || !Array.isArray(calendarIds) || calendarIds.length === 0) {
      return NextResponse.json({ error: 'calendarIds é obrigatório' }, { status: 400 })
    }

    const fromDate = from ? new Date(from) : new Date()
    const toDate = to ? new Date(to) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // +30 dias

    const results = await syncCalendarEvents({
      calendarIds,
      from: fromDate,
      to: toDate,
      matchingStrategy,
    })

    return NextResponse.json(results)
  } catch (error) {
    console.error('Erro ao sincronizar calendários:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar calendários' }, { status: 500 })
  }
}
