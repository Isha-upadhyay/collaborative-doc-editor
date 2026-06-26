import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { authorizeDocumentAccess } from '@/lib/authz/guard'
import prisma from '@/lib/db/client'

import { snapshotPayloadSchema } from '@/lib/validation/schemas'

export const maxDuration = 30

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

  const result = await prisma.snapshot.findMany({
    where: { documentId: resolvedParams.id },
    orderBy: { createdAt: 'desc' }
  })

  const mapped = result.map((s: any) => ({
    id: s.id,
    createdAt: s.createdAt,
    versionId: s.label || `v${s.id.substring(0, 4)}`,
    stateVector: s.stateVector.toString('base64')
  }))

  return NextResponse.json({ snapshots: mapped })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'EDITOR')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { stateVector, versionId } = snapshotPayloadSchema.parse(body)
    
    const buffer = Buffer.from(stateVector, 'base64')
    if (buffer.byteLength > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Binary payload too large' }, { status: 413 })
    }

    await prisma.snapshot.create({
      data: {
        documentId: resolvedParams.id,
        userId: session.user.id,
        label: versionId,
        stateVector: Buffer.from(stateVector, 'base64'),
        stateBlob: Buffer.from('') // Dummy stateBlob since we aren't saving full docs in DB yet
      }
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
