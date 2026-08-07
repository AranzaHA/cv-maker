"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TrashIcon, CameraIcon } from "@phosphor-icons/react"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"]

interface PhotoUploadProps {
  currentPhotoUrl: string | null
  photoFile: File | null
  photoRemoved: boolean
  onFileSelected: (file: File) => void
  onFileCleared: () => void
  onPhotoRemoved: () => void
  onPhotoRemovedUndo: () => void
}

export function PhotoUpload({
  currentPhotoUrl,
  photoFile,
  photoRemoved,
  onFileSelected,
  onFileCleared,
  onPhotoRemoved,
  onPhotoRemovedUndo,
}: PhotoUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Solo se aceptan imágenes PNG, JPG o WEBP")
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      alert("La imagen no puede superar 5 MB")
      return
    }

    onFileSelected(file)
  }

  function handleClearFile() {
    onFileCleared()
    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const hasPendingFile = !!photoFile
  const hasSavedPhoto = !!currentPhotoUrl && !photoRemoved
  const displayUrl = hasPendingFile
    ? URL.createObjectURL(photoFile)
    : hasSavedPhoto
      ? currentPhotoUrl
      : null

  return (
    <div className="space-y-3">
      <Label>Foto de perfil</Label>

      {displayUrl ? (
        <div className="flex items-start gap-4">
          <img
            src={displayUrl}
            alt="Foto del CV"
            className="size-20 rounded-none object-cover ring-1 ring-foreground/10"
          />
          <div className="flex flex-col gap-1">
            {hasPendingFile && (
              <span className="text-xs text-muted-foreground">
                Nueva foto — se subirá al guardar
              </span>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <CameraIcon /> {hasSavedPhoto ? "Cambiar foto" : "Seleccionar otra"}
              </Button>
              {hasPendingFile ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleClearFile}
                >
                  <TrashIcon /> Quitar
                </Button>
              ) : hasSavedPhoto ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={onPhotoRemoved}
                >
                  <TrashIcon /> Quitar foto
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : photoRemoved ? (
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            Foto eliminada — se quitará al guardar
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onPhotoRemovedUndo}
          >
            Deshacer
          </Button>
        </div>
      ) : (
        <div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileRef.current?.click()}
          >
            <CameraIcon /> Seleccionar foto
          </Button>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
