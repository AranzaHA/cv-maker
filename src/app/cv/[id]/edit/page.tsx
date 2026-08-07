import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CvForm } from "@/components/cv/cv-form"
import type { CVData } from "@/types/cv"

export default async function EditCvPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: cv } = await supabase
    .from("cvs")
    .select("*")
    .eq("id", id)
    .single()

  if (!cv) {
    redirect("/dashboard")
  }

  const cvData = (cv.data as CVData) ?? undefined
  const photoUrl = (cv.photo_url as string) ?? null

  return (
    <div className="flex min-h-screen flex-col p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-sm font-medium">CV Maker</h1>
        <Link href="/dashboard">
          <Button variant="outline">Volver al dashboard</Button>
        </Link>
      </header>

      <main className="mt-16 flex justify-center">
        <div className="w-full max-w-2xl">
          <CvForm
            mode="edit"
            cvId={id}
            userId={user.id}
            photoUrl={photoUrl}
            initialData={cvData}
          />
        </div>
      </main>
    </div>
  )
}
