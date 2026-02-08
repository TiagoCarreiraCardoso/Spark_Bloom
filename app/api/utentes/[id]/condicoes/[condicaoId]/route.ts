import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { condicaoComercialSchema } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { calcularValorLiquido } from '@/lib/utils/calculations'
import { createAuditLog } from '@/lib/utils/audit'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; condicaoId: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const condicao = await prisma.condicaoComercial.findFirst({
      where: {
        id: params.condicaoId,
        utenteId: params.id,
      },
      include: {
        artigo: true,
      },
    })

    if (!condicao) {
      return NextResponse.json({ error: 'Condição não encontrada' }, { status: 404 })
    }

    return NextResponse.json(condicao)
  } catch (error) {
    console.error('Erro ao buscar condição:', error)
    return NextResponse.json({ error: 'Erro ao buscar condição' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; condicaoId: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    
    // Converter strings de data para Date objects
    const dataToValidate = {
      ...body,
      inicioVigencia: body.inicioVigencia ? new Date(body.inicioVigencia) : undefined,
      fimVigencia: body.fimVigencia ? new Date(body.fimVigencia) : null,
    }

    const data = condicaoComercialSchema.parse(dataToValidate)

    // Buscar a condição atual para verificar mudanças
    const condicaoAtual = await prisma.condicaoComercial.findUnique({
      where: { id: params.condicaoId },
    })

    if (!condicaoAtual) {
      return NextResponse.json({ error: 'Condição não encontrada' }, { status: 404 })
    }

    // Se a data de início de vigência foi alterada para uma data futura E é uma condição ativa,
    // e há outra condição ativa do mesmo artigo com data anterior, encerre a outra
    const artigoId = data.artigoId || condicaoAtual.artigoId
    
    if (artigoId && data.inicioVigencia > condicaoAtual.inicioVigencia) {
      // Verificar se há outras condições ativas do mesmo artigo que precisam ser encerradas
      const outrasCondicoesAtivas = await prisma.condicaoComercial.findMany({
        where: {
          utenteId: params.id,
          artigoId: artigoId,
          id: { not: params.condicaoId }, // Excluir a condição que estamos editando
          OR: [{ fimVigencia: null }, { fimVigencia: { gte: new Date() } }],
          inicioVigencia: { lt: data.inicioVigencia }, // Apenas condições com data anterior
        },
      })

      // Encerrar condições anteriores
      for (const condicao of outrasCondicoesAtivas) {
        await prisma.condicaoComercial.update({
          where: { id: condicao.id },
          data: { fimVigencia: new Date(data.inicioVigencia.getTime() - 1) },
        })
      }
    }

    // Calcular valor líquido
    const valorLiquido = calcularValorLiquido(
      new Decimal(data.valorTerapeuta),
      new Decimal(data.retencaoIRS)
    )

    const condicao = await prisma.condicaoComercial.update({
      where: { id: params.condicaoId },
      data: {
        artigoId: data.artigoId || null,
        precoCliente: new Decimal(data.precoCliente),
        valorClinica: new Decimal(data.valorClinica),
        valorTerapeuta: new Decimal(data.valorTerapeuta),
        retencaoIRS: new Decimal(data.retencaoIRS),
        valorLiquido,
        necessitaRecibo: data.necessitaRecibo,
        inicioVigencia: data.inicioVigencia,
        fimVigencia: data.fimVigencia || null,
      },
      include: {
        artigo: true,
      },
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'CondicaoComercial',
      entityId: condicao.id,
      details: { utenteId: params.id },
    })

    return NextResponse.json(condicao)
  } catch (error: any) {
    console.error('Erro ao atualizar condição:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validação', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar condição comercial' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; condicaoId: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    await prisma.condicaoComercial.delete({
      where: { id: params.condicaoId },
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'CondicaoComercial',
      entityId: params.condicaoId,
      details: { utenteId: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar condição:', error)
    return NextResponse.json({ error: 'Erro ao deletar condição' }, { status: 500 })
  }
}
