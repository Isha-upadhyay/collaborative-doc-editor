import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { authorizeDocumentAccess } from '@/lib/authz/guard'
import prisma from '@/lib/db/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only the OWNER can share
  const isOwner = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'OWNER')
  if (!isOwner) {
    return NextResponse.json({ error: 'Only the owner can share this document' }, { status: 403 })
  }

  try {
    const { email, role } = await req.json()
    
    if (!email || !['EDITOR', 'VIEWER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { email } })
    if (!targetUser) {
      return NextResponse.json({ error: 'User with this email not found' }, { status: 404 })
    }

    await prisma.documentMember.upsert({
      where: {
        documentId_userId: {
          documentId: resolvedParams.id,
          userId: targetUser.id
        }
      },
      update: {
        role
      },
      create: {
        documentId: resolvedParams.id,
        userId: targetUser.id,
        role
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
