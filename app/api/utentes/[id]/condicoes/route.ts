import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { condicaoComercialSchema } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { calcularValorLiquido } from '@/lib/utils/calculations'
import { createAuditLog } from '@/lib/utils/audit'
import { Decimal } from '@prisma/client/runtime/library'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const condicoes = await prisma.condicaoComercial.findMany({
      where: { utenteId: params.id },
      include: {
        artigo: true,
      },
      orderBy: { inicioVigencia: 'desc' },
    })

    return NextResponse.json(condicoes)
  } catch (error) {
    console.error('Erro ao listar condições:', error)
    return NextResponse.json({ error: 'Erro ao listar condições' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Verificar se há condição ativa do MESMO ARTIGO e encerrá-la
    // Permite múltiplas condições ativas se forem artigos diferentes
    const artigoId = data.artigoId || null
    
    // Buscar todas as condições ativas do utente do mesmo artigo
    const condicoesAtivasMesmoArtigo = await prisma.condicaoComercial.findMany({
      where: {
        utenteId: params.id,
        artigoId: artigoId,
        OR: [{ fimVigencia: null }, { fimVigencia: { gte: new Date() } }],
      },
    })

    // Encerrar condições anteriores do mesmo artigo se a nova tiver data de início posterior
    for (const condicao of condicoesAtivasMesmoArtigo) {
      if (data.inicioVigencia > condicao.inicioVigencia) {
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

    const condicao = await prisma.condicaoComercial.create({
      data: {
        utenteId: params.id,
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
      action: 'CREATE',
      entity: 'CondicaoComercial',
      entityId: condicao.id,
      details: { utenteId: params.id, inicioVigencia: data.inicioVigencia },
    })

    return NextResponse.json(condicao, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar condição:', error)
    
    // Se for erro de validação do Zod, retornar mensagem detalhada
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validação', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao criar condição comercial' },
      { status: 500 }
    )
  }
}
