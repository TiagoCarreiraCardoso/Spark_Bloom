import jwt from 'jwt-simple'

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export interface MagicLinkPayload {
  sessaoId: string
  exp: number
}

/**
 * Gera um magic link token para confirmação de sessão
 */
export function generateMagicLinkToken(sessaoId: string, expiresInHours = 24): string {
  const payload: MagicLinkPayload = {
    sessaoId,
    exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600,
  }

  return jwt.encode(payload, SECRET)
}

/**
 * Valida e decodifica um magic link token
 */
export function validateMagicLinkToken(token: string): MagicLinkPayload | null {
  try {
    const payload = jwt.decode(token, SECRET) as MagicLinkPayload

    // Verificar expiração
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}
