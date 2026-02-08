import { NextRequest, NextResponse } from 'next/server'
import { startAllJobs } from '@/scripts/cron-jobs'

// Endpoint para iniciar jobs manualmente (protegido)
export async function POST(request: NextRequest) {
  try {
    // Verificar se é uma chamada autorizada (pode usar secret header)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    startAllJobs()
    return NextResponse.json({ success: true, message: 'Jobs iniciados' })
  } catch (error) {
    console.error('Erro ao iniciar jobs:', error)
    return NextResponse.json({ error: 'Erro ao iniciar jobs' }, { status: 500 })
  }
}
