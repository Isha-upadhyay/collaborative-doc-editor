import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import prisma from '@/lib/db/client'
import { createDocumentSchema } from '@/lib/validation/schemas'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const documents = await prisma.document.findMany({
    where: {
      members: {
        some: {
          userId: session.user.id
        }
      }
    },
    include: {
      members: {
        where: {
          userId: session.user.id
        }
      }
    }
  })

  return NextResponse.json({ documents })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let title = 'Untitled Document'
  try {
    const body = await request.json()
    const parsed = createDocumentSchema.parse(body)
    if (parsed.title) title = parsed.title
  } catch (e) {
    // If invalid JSON or validation fails, we fallback to Untitled Document
    // or we could return 400. We will just use the fallback for robust UX.
  }

  const document = await prisma.document.create({
    data: {
      title,
      members: {
        create: {
          userId: session.user.id,
          role: 'OWNER'
        }
      }
    }
  })

  return NextResponse.json({ document }, { status: 201 })
}
