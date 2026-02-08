import { Prisma } from '@prisma/client'
import { prisma } from '../prisma'

export interface AuditLogData {
  userId?: string
  action: string
  entity: string
  entityId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Cria um log de auditoria
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: (data.details ?? {}) as Prisma.InputJsonValue,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  } catch (error) {
    // Não falhar a operação principal se o log falhar
    console.error('Erro ao criar log de auditoria:', error)
  }
}
