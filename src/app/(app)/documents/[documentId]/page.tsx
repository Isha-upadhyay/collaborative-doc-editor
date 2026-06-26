import { EditorShell } from '@/components/editor/EditorShell'
import { auth } from '@/lib/auth/config'
import { authorizeDocumentAccess } from '@/lib/authz/guard'
import prisma from '@/lib/db/client'
import { redirect } from 'next/navigation'

export default async function DocumentEditorPage({ params }: { params: Promise<{ documentId: string }> }) {
  const resolvedParams = await params
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/sign-in')
  }

  // Validate user has at least VIEWER role
  const isAuthorized = await authorizeDocumentAccess(session.user.id, resolvedParams.documentId, 'VIEWER')
  if (!isAuthorized) {
    redirect('/documents')
  }

  const document = await prisma.document.findUnique({
    where: { id: resolvedParams.documentId },
    select: { 
      title: true,
      members: {
        where: { userId: session.user.id },
        select: { role: true }
      }
    }
  })

  const userRole = document?.members[0]?.role || 'VIEWER'

  return (
    <div className="flex flex-1 flex-col min-h-0 h-full bg-background">
      <EditorShell 
        documentId={resolvedParams.documentId} 
        initialTitle={document?.title || 'Untitled Document'}
        user={{ id: session.user.id, name: session.user.name ?? session.user.email ?? 'Anonymous' }} 
        userRole={userRole}
      />
    </div>
  )
}
