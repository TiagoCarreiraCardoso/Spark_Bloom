import { getServerSession } from 'next-auth'
import { authOptions } from '../auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export type UserRole = 'ADMIN' | 'TERAPEUTA' | 'FINANCEIRO'

/**
 * Middleware para verificar autenticação
 */
export async function requireAuth(_request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  return { session, user: session.user }
}

/**
 * Middleware para verificar role específica
 */
export async function requireRole(request: NextRequest, allowedRoles: UserRole[]) {
  const auth = await requireAuth(request)

  if (auth instanceof NextResponse) {
    return auth
  }

  const userRole = auth.user.role as UserRole

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  return auth
}
