"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Cv {
  id: string
  title: string
  updated_at: string
  created_at: string
}

export function CvCard({ cv }: { cv: Cv }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  const updatedDate = new Date(cv.updated_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    await supabase.from("cvs").delete().eq("id", cv.id)
    router.refresh()
    setDeleting(false)
  }

  return (
    <div className="glass-card p-5 transition-colors hover:bg-secondary">
      <div className="mb-4">
        <h3 className="truncate text-sm font-semibold text-card-foreground">{cv.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Última edición: {updatedDate}
        </p>
      </div>
      <div className="flex gap-2">
        <Link href={`/cv/${cv.id}/edit`}>
          <Button
            size="sm"
            variant="outline"
          >
            Editar
          </Button>
        </Link>
        <Dialog>
          <DialogTrigger
            render={
              <Button
                size="sm"
                variant="destructive"
              />
            }
          >
            Eliminar
          </DialogTrigger>
          <DialogContent className="border-border bg-popover backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">¿Eliminar CV?</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Esta acción no se puede deshacer. El CV será eliminado permanentemente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={
                  <Button variant="outline" />
                }
              >
                Cancelar
              </DialogClose>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
