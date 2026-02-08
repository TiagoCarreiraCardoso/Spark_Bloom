import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { utenteSchema } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { createAuditLog } from '@/lib/utils/audit'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status') as 'ATIVO' | 'INATIVO' | null

    const utentes = await prisma.utente.findMany({
      where: {
        ...(search && {
          OR: [
            { nome: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { telemovel: { contains: search, mode: 'insensitive' } },
            ...(isNaN(Number(search)) ? [] : [{ codigo: Number(search) }]),
          ],
        }),
        ...(status && { statusProcesso: status }),
      },
      include: {
        condicoes: {
          where: {
            OR: [{ fimVigencia: null }, { fimVigencia: { gte: new Date() } }],
          },
          orderBy: { inicioVigencia: 'desc' },
          take: 1,
        },
        _count: {
          select: { sessoes: true },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(utentes)
  } catch (error) {
    console.error('Erro ao listar utentes:', error)
    return NextResponse.json({ error: 'Erro ao listar utentes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    
    // Converter strings de data para Date objects
    const dataToValidate = {
      ...body,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
      dataAberturaFicha: body.dataAberturaFicha ? new Date(body.dataAberturaFicha) : new Date(),
    }

    const data = utenteSchema.parse(dataToValidate)

    // Gerar código sequencial: buscar o maior código e adicionar 1
    const ultimoUtente = await prisma.utente.findFirst({
      orderBy: { codigo: 'desc' },
      select: { codigo: true },
    })

    const proximoCodigo = ultimoUtente ? ultimoUtente.codigo + 1 : 1

    const utente = await prisma.utente.create({
      data: {
        ...data,
        codigo: proximoCodigo,
      },
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Utente',
      entityId: utente.id,
      details: { nome: utente.nome },
    })

    return NextResponse.json(utente, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar utente:', error)
    
    // Se for erro de validação do Zod, retornar mensagem detalhada
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validação', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erro ao criar utente' },
      { status: 500 }
    )
  }
}
