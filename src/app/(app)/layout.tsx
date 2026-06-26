import { ReactNode } from "react"
import { auth } from "@/lib/auth/config"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/layout/AppSidebar"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/sign-in")
  }

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      <AppSidebar user={{ name: session.user.name ?? null, email: session.user.email ?? null }} />
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">
        {children}
      </main>
    </div>
  )
}
