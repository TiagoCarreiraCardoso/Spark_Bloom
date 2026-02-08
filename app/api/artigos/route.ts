import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth'
import { createAuditLog } from '@/lib/utils/audit'
import { z } from 'zod'

const artigoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  ativo: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const searchParams = request.nextUrl.searchParams
    const ativo = searchParams.get('ativo')

    const artigos = await prisma.artigo.findMany({
      where: {
        ...(ativo !== null && { ativo: ativo === 'true' }),
      },
      orderBy: { nome: 'asc' },
    })

    return NextResponse.json(artigos)
  } catch (error) {
    console.error('Erro ao listar artigos:', error)
    return NextResponse.json({ error: 'Erro ao listar artigos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const data = artigoSchema.parse(body)

    const artigo = await prisma.artigo.create({
      data: {
        codigo: data.codigo.trim().toUpperCase(),
        nome: data.nome.trim(),
        ativo: data.ativo ?? true,
      },
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'CREATE',
      entity: 'Artigo',
      entityId: artigo.id,
      details: { codigo: artigo.codigo, nome: artigo.nome },
    })

    return NextResponse.json(artigo, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar artigo:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Código de artigo já existe' }, { status: 400 })
    }

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Erro de validação', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Erro ao criar artigo' }, { status: 500 })
  }
}
