import prisma from '../db/client'
import { Role } from '@prisma/client'

export async function authorizeDocumentAccess(userId: string, documentId: string, requiredRole: Role): Promise<boolean> {
  const member = await prisma.documentMember.findUnique({
    where: {
      documentId_userId: { documentId, userId }
    }
  })

  if (!member) return false

  if (requiredRole === 'VIEWER') {
    return ['OWNER', 'EDITOR', 'VIEWER'].includes(member.role)
  }
  if (requiredRole === 'EDITOR') {
    return ['OWNER', 'EDITOR'].includes(member.role)
  }
  if (requiredRole === 'OWNER') {
    return member.role === 'OWNER'
  }
  
  return false
}
