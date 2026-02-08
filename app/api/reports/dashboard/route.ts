import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const utenteId = searchParams.get('utenteId')
    const estadoSessao = searchParams.get('estadoSessao')
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const where: any = {
      ...(utenteId && { utenteId }),
      ...(estadoSessao && { estadoSessao: estadoSessao as any }),
      ...(dataInicio &&
        dataFim && {
          dataSessao: {
            gte: new Date(dataInicio),
            lte: new Date(dataFim),
          },
        }),
    }

    const sessoes = await prisma.sessao.findMany({
      where,
      include: {
        utente: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    // Calcular KPIs
    const totalSessoes = sessoes.length
    const valorTotal = sessoes.reduce(
      (sum, s) => sum.plus(s.valorSessao),
      new Decimal(0)
    )
    const valorNaoRecebido = sessoes
      .filter((s) => s.estadoPagamento === 'NAO_PAGO')
      .reduce((sum, s) => sum.plus(s.valorSessao), new Decimal(0))
    const sessoesSemRecibo = sessoes.filter(
      (s) => s.sujeitaRecibo && s.estadoPagamento === 'PAGO' && !s.numeroRecibo
    ).length

    // Agrupar por mês
    const sessoesPorMes: Record<string, number> = {}
    sessoes.forEach((s) => {
      const mes = s.dataSessao.toISOString().substring(0, 7) // YYYY-MM
      sessoesPorMes[mes] = (sessoesPorMes[mes] || 0) + 1
    })

    return NextResponse.json({
      totalSessoes,
      valorTotal: valorTotal.toFixed(2),
      valorNaoRecebido: valorNaoRecebido.toFixed(2),
      sessoesSemRecibo,
      sessoesPorMes,
      sessoes: sessoes.map((s) => ({
        id: s.id,
        dataSessao: s.dataSessao,
        utenteNome: s.utente.nome,
        valorSessao: s.valorSessao.toFixed(2),
        estadoPagamento: s.estadoPagamento,
        numeroRecibo: s.numeroRecibo,
      })),
    })
  } catch (error) {
    console.error('Erro ao gerar dashboard:', error)
    return NextResponse.json({ error: 'Erro ao gerar dashboard' }, { status: 500 })
  }
}
