import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/client'
import { authorizeDocumentAccess } from '@/lib/authz/guard'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'VIEWER')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const document = await prisma.document.findUnique({
    where: { id: resolvedParams.id }
  })

  if (!document) {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 })
  }

  return NextResponse.json({ document })
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'EDITOR')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title } = await request.json().catch(() => ({ title: null }))
  if (!title) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const document = await prisma.document.update({
    where: { id: resolvedParams.id },
    data: { title }
  })

  return NextResponse.json({ document })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.id, 'OWNER')
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.document.delete({
    where: { id: resolvedParams.id }
  })

  return NextResponse.json({ success: true })
}
