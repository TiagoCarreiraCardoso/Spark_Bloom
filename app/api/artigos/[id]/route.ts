import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/middleware/auth'
import { createAuditLog } from '@/lib/utils/audit'
import { z } from 'zod'

const artigoSchema = z.object({
  codigo: z.string().min(1, 'Código é obrigatório').optional(),
  nome: z.string().min(1, 'Nome é obrigatório').optional(),
  ativo: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const artigo = await prisma.artigo.findUnique({
      where: { id: params.id },
    })

    if (!artigo) {
      return NextResponse.json({ error: 'Artigo não encontrado' }, { status: 404 })
    }

    return NextResponse.json(artigo)
  } catch (error) {
    console.error('Erro ao buscar artigo:', error)
    return NextResponse.json({ error: 'Erro ao buscar artigo' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const data = artigoSchema.parse(body)

    const updateData: any = {}
    if (data.codigo !== undefined) updateData.codigo = data.codigo.trim().toUpperCase()
    if (data.nome !== undefined) updateData.nome = data.nome.trim()
    if (data.ativo !== undefined) updateData.ativo = data.ativo

    const artigo = await prisma.artigo.update({
      where: { id: params.id },
      data: updateData,
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Artigo',
      entityId: artigo.id,
      details: { codigo: artigo.codigo, nome: artigo.nome },
    })

    return NextResponse.json(artigo)
  } catch (error: any) {
    console.error('Erro ao atualizar artigo:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Código de artigo já existe' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Erro ao atualizar artigo' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    // Verificar se o artigo está sendo usado em condições comerciais
    const condicoes = await prisma.condicaoComercial.count({
      where: { artigoId: params.id },
    })

    if (condicoes > 0) {
      // Em vez de deletar, marcar como inativo
      const artigo = await prisma.artigo.update({
        where: { id: params.id },
        data: { ativo: false },
      })

      await createAuditLog({
        userId: auth.user.id,
        action: 'DEACTIVATE',
        entity: 'Artigo',
        entityId: artigo.id,
        details: { motivo: 'Artigo em uso' },
      })

      return NextResponse.json(artigo)
    }

    await prisma.artigo.delete({
      where: { id: params.id },
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Artigo',
      entityId: params.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar artigo:', error)
    return NextResponse.json({ error: 'Erro ao deletar artigo' }, { status: 500 })
  }
}
