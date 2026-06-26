import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import prisma from "@/lib/db/client"
import { DocumentsListClient } from "@/components/documents/DocumentsListClient"

export default async function DocumentsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  let documents: any[] = []
  try {
    documents = await prisma.document.findMany({
      where: {
        members: {
          some: { userId: session.user.id }
        }
      },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })
  } catch (error) {
    console.error("Failed to fetch documents", error)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto">
      <div className="max-w-6xl w-full mx-auto px-4 pt-16 pb-8 sm:px-8 md:p-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">Documents</h1>
            <p className="text-muted-foreground">Manage and collaborate on your recent work.</p>
          </div>
        </header>

        <DocumentsListClient initialDocuments={documents} />
      </div>
    </div>
  )
}

