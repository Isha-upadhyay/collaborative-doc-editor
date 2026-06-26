import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { auth } from '@/lib/auth/config'
import { authorizeDocumentAccess } from '@/lib/authz/guard'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if they are at least a viewer
  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'VIEWER')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if they are an editor for role assignment in token
  const canEdit = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'EDITOR')

  // Mint a short-lived token (1 minute)
  const token = jwt.sign(
    {
      userId: session.user.id,
      documentId: resolvedParams.id,
      role: canEdit ? 'EDITOR' : 'VIEWER'
    },
    process.env.AUTH_SECRET!,
    { expiresIn: '60s' }
  )

  return NextResponse.json({ token })
}
