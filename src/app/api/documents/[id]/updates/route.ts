import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { authorizeDocumentAccess } from '@/lib/authz/guard'
import prisma from '@/lib/db/client'
import { checkRateLimit } from '@/lib/security/rate-limit'

import { updatePayloadSchema } from '@/lib/validation/schemas'

export const maxDuration = 30 // Allow max 30s per request

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitError = checkRateLimit(req)
  if (rateLimitError) return rateLimitError

  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'EDITOR')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Prevent giant payloads at the HTTP layer
  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { update } = updatePayloadSchema.parse(body) // Validate with Zod
    const buffer = Buffer.from(update, 'base64')

    // Extra safety buffer length check
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Binary payload too large' }, { status: 413 })
    }

    await prisma.crdtUpdate.create({
      data: {
        documentId: resolvedParams.id,
        userId: session.user.id,
        updateBlob: buffer,
        byteSize: buffer.byteLength
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'VIEWER')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updates = await prisma.crdtUpdate.findMany({
    where: { documentId: resolvedParams.id },
    orderBy: { createdAt: 'asc' }
  })

  const serialized = updates.map((u: any) => u.updateBlob.toString('base64'))

  return NextResponse.json({ updates: serialized })
}
