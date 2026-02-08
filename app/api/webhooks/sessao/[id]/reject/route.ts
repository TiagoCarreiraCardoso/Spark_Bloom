import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateMagicLinkToken } from '@/lib/utils/jwt'
import { createAuditLog } from '@/lib/utils/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const body = await request.json()
    const motivo = body.motivo

    if (!token) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 400 })
    }

    if (!motivo || motivo.trim().length === 0) {
      return NextResponse.json({ error: 'Motivo é obrigatório' }, { status: 400 })
    }

    const payload = validateMagicLinkToken(token)
    if (!payload || payload.sessaoId !== params.id) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    const sessao = await prisma.sessao.findUnique({
      where: { id: params.id },
    })

    if (!sessao) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 404 })
    }

    if (sessao.estadoSessao === 'CONFIRMADA' || sessao.estadoSessao === 'REJEITADA') {
      return NextResponse.json({ error: 'Sessão já foi processada' }, { status: 400 })
    }

    const updated = await prisma.sessao.update({
      where: { id: params.id },
      data: {
        estadoSessao: 'REJEITADA',
        motivoRejeicao: motivo,
      },
    })

    await createAuditLog({
      action: 'REJECT_SESSAO',
      entity: 'Sessao',
      entityId: params.id,
      details: { utenteId: sessao.utenteId, motivo, via: 'magic_link' },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true, sessao: updated })
  } catch (error) {
    console.error('Erro ao rejeitar sessão:', error)
    return NextResponse.json({ error: 'Erro ao rejeitar sessão' }, { status: 500 })
  }
}
