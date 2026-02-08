import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { utenteSchema } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { createAuditLog } from '@/lib/utils/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const utente = await prisma.utente.findUnique({
      where: { id: params.id },
      include: {
        condicoes: {
          include: {
            artigo: true,
          },
          orderBy: { inicioVigencia: 'desc' },
        },
        sessoes: {
          orderBy: { dataSessao: 'desc' },
          take: 50,
        },
      },
    })

    if (!utente) {
      return NextResponse.json({ error: 'Utente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(utente)
  } catch (error) {
    console.error('Erro ao buscar utente:', error)
    return NextResponse.json({ error: 'Erro ao buscar utente' }, { status: 500 })
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
    
    // Converter strings de data para objetos Date
    const dataToValidate = {
      ...body,
      dataNascimento: body.dataNascimento ? new Date(body.dataNascimento) : undefined,
      dataAberturaFicha: body.dataAberturaFicha ? new Date(body.dataAberturaFicha) : undefined,
    }

    const data = utenteSchema.parse(dataToValidate)

    const utente = await prisma.utente.update({
      where: { id: params.id },
      data,
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Utente',
      entityId: utente.id,
      details: { nome: utente.nome },
    })

    return NextResponse.json(utente)
  } catch (error: any) {
    console.error('Erro ao atualizar utente:', error)
    
    // Melhorar mensagem de erro para validação
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: error.errors 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao atualizar utente' 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    console.log('Tentando excluir utente:', params.id)

    // Verificar se o utente existe antes de tentar excluir
    const utenteExistente = await prisma.utente.findUnique({
      where: { id: params.id },
    })

    if (!utenteExistente) {
      return NextResponse.json({ error: 'Utente não encontrado' }, { status: 404 })
    }

    // Excluir o utente (as condições e sessões serão excluídas em cascata)
    await prisma.utente.delete({
      where: { id: params.id },
    })

    console.log('Utente excluído com sucesso:', params.id)

    await createAuditLog({
      userId: auth.user.id,
      action: 'DELETE',
      entity: 'Utente',
      entityId: params.id,
      details: { nome: utenteExistente.nome },
    })

    return NextResponse.json({ success: true, message: 'Utente excluído com sucesso' })
  } catch (error: any) {
    console.error('Erro ao deletar utente:', error)
    
    // Melhorar mensagem de erro
    let errorMessage = 'Erro ao deletar utente'
    if (error.code === 'P2025') {
      errorMessage = 'Utente não encontrado'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error },
      { status: 500 }
    )
  }
}
