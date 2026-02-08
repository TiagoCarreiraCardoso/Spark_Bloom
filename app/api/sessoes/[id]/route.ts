import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sessaoSchema } from '@/lib/utils/validation'
import { requireAuth } from '@/lib/middleware/auth'
import { createAuditLog } from '@/lib/utils/audit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth

    const sessao = await prisma.sessao.findUnique({
      where: { id: params.id },
      include: {
        utente: true,
      },
    })

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    return NextResponse.json(sessao)
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return NextResponse.json({ error: 'Erro ao buscar sessão' }, { status: 500 })
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
    
    // Converter strings de data para Date objects
    const dataToValidate = {
      ...body,
      dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : null,
    }
    
    const data = sessaoSchema.partial().parse(dataToValidate)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma update payload from validated partial
    const updateData: any = { ...data }
    
    // Tratar dataPagamento: se não foi enviado, manter o valor atual ou null
    if ('dataPagamento' in data) {
      updateData.dataPagamento = data.dataPagamento || null
    }

    const sessao = await prisma.sessao.update({
      where: { id: params.id },
      data: updateData,
    })

    await createAuditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      entity: 'Sessao',
      entityId: sessao.id,
      details: { utenteId: sessao.utenteId, estadoPagamento: sessao.estadoPagamento },
    })

    return NextResponse.json(sessao)
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error)
    return NextResponse.json({ error: 'Erro ao atualizar sessão' }, { status: 500 })
  }
}
