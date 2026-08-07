import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { CvCard } from "./cv-card"

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const fullName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario"

  const { data: cvs } = await supabase
    .from("cvs")
    .select("*")
    .order("updated_at", { ascending: false })

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Bienvenida, {fullName}
          </p>
          <h1 className="mt-1 text-lg font-semibold text-foreground">Mis CVs</h1>
        </div>
        <Link href="/cv/new">
          <Button className="gradient-primary text-white">
            Crear nuevo CV
          </Button>
        </Link>
      </div>

      {cvs && cvs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cvs.map((cv) => (
            <CvCard key={cv.id} cv={cv} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Aún no has creado ningún CV
          </p>
          <Link href="/cv/new">
            <Button variant="outline">
              Crear mi primer CV
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
