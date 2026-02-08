import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth'
import { generateReportCSV } from '@/lib/reports/csv'
import { generateReportPDF } from '@/lib/reports/pdf'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'
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
            nome: true,
          },
        },
      },
      orderBy: { dataSessao: 'asc' },
    })

    if (format === 'csv') {
      const csv = generateReportCSV(
        sessoes.map((s) => ({
          id: s.id,
          dataSessao: s.dataSessao,
          utenteNome: s.utente.nome,
          valorSessao: s.valorSessao,
          estadoPagamento: s.estadoPagamento,
          numeroRecibo: s.numeroRecibo,
        }))
      )

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      })
    } else if (format === 'pdf') {
      const { Decimal } = await import('@prisma/client/runtime/library')
      const zero = new Decimal(0)
      const valorTotal = sessoes.reduce((sum, s) => sum.plus(s.valorSessao), zero)
      const valorNaoRecebido = sessoes
        .filter((s) => s.estadoPagamento === 'NAO_PAGO')
        .reduce((sum, s) => sum.plus(s.valorSessao), zero)

      const pdfBuffer = await generateReportPDF({
        periodo: {
          inicio: dataInicio ? new Date(dataInicio) : new Date(),
          fim: dataFim ? new Date(dataFim) : new Date(),
        },
        totalSessoes: sessoes.length,
        valorTotal,
        valorNaoRecebido,
        sessoesSemRecibo: sessoes.filter(
          (s) => s.sujeitaRecibo && s.estadoPagamento === 'PAGO' && !s.numeroRecibo
        ).length,
        sessoes: sessoes.map((s) => ({
          id: s.id,
          dataSessao: s.dataSessao,
          utenteNome: s.utente.nome,
          valorSessao: s.valorSessao,
          estadoPagamento: s.estadoPagamento,
          numeroRecibo: s.numeroRecibo,
        })),
      })

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="relatorio-${new Date().toISOString().split('T')[0]}.pdf"`,
        },
      })
    }

    return NextResponse.json({ error: 'Formato inválido' }, { status: 400 })
  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    return NextResponse.json({ error: 'Erro ao exportar relatório' }, { status: 500 })
  }
}
