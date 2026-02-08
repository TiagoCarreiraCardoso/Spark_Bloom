import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const utenteId = searchParams.get('utenteId')
    const estadoSessao = searchParams.get('estadoSessao')
    const estadoPagamento = searchParams.get('estadoPagamento')
    const statusRecibo = searchParams.get('statusRecibo') // 'com_recibo', 'sem_recibo', 'nao_aplicavel'
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const where: any = {
      ...(utenteId && { utenteId }),
      ...(estadoSessao && { estadoSessao: estadoSessao as any }),
      ...(estadoPagamento && { estadoPagamento: estadoPagamento as any }),
      ...(dataInicio &&
        dataFim && {
          dataSessao: {
            gte: new Date(dataInicio),
            lte: new Date(dataFim),
          },
        }),
    }

    // Filtro por status de recibo
    if (statusRecibo === 'com_recibo') {
      where.numeroRecibo = { not: null }
      where.sujeitaRecibo = true
    } else if (statusRecibo === 'sem_recibo') {
      where.numeroRecibo = null
      where.sujeitaRecibo = true
    } else if (statusRecibo === 'nao_aplicavel') {
      where.sujeitaRecibo = false
    }

    const sessoes = await prisma.sessao.findMany({
      where,
      include: {
        utente: {
          select: {
            id: true,
            codigo: true,
            nome: true,
            email: true,
            emailPai: true,
            emailMae: true,
          },
        },
      },
      orderBy: { dataSessao: 'desc' },
    })

    return NextResponse.json(sessoes)
  } catch (error) {
    console.error('Erro ao listar sessões:', error)
    return NextResponse.json({ error: 'Erro ao listar sessões' }, { status: 500 })
  }
}
