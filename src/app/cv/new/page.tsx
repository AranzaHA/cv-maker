"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { CvForm } from "@/components/cv/cv-form"
import { Button } from "@/components/ui/button"

export default function NewCvPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }
      setUserId(user.id)
    })
  }, [router])

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    )
  }

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
          <CvForm mode="create" userId={userId} />
        </div>
      </main>
    </div>
  )
}
