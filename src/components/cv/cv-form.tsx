"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createClient } from "@/lib/supabase/client"
import { cvFormSchema, type CvFormValues } from "@/lib/schemas/cv"
import type { CVData } from "@/types/cv"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { PlusIcon, TrashIcon } from "@phosphor-icons/react"
import { PhotoUpload } from "@/components/PhotoUpload"

interface CvFormCreateProps {
  mode: "create"
  userId: string
}

interface CvFormEditProps {
  mode: "edit"
  cvId: string
  userId: string
  photoUrl?: string | null
  initialData?: CVData
}

type CvFormProps = CvFormCreateProps | CvFormEditProps

function newId() {
  return crypto.randomUUID()
}

function getExtFromMime(mime: string): string {
  if (mime === "image/png") return "png"
  if (mime === "image/webp") return "webp"
  return "jpg"
}

export function CvForm(props: CvFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [skillInput, setSkillInput] = useState("")

  const isEdit = props.mode === "edit"
  const cvId = isEdit ? props.cvId : null
  const userId = props.userId
  const initialData = isEdit ? props.initialData : undefined

  const [tempId] = useState(() => crypto.randomUUID())
  const activeId = cvId ?? tempId

  const [originalPhotoUrl] = useState<string | null>(
    isEdit ? (props.photoUrl ?? null) : null
  )
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null)
  const [photoRemoved, setPhotoRemoved] = useState(false)

  const form = useForm<CvFormValues>({
    resolver: zodResolver(cvFormSchema),
    defaultValues: initialData ?? {
      personalInfo: {
        fullName: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
      },
      experience: [],
      education: [],
      certifications: [],
      languages: [],
      skills: [],
    },
  })

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control: form.control, name: "experience" })

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control: form.control, name: "education" })

  const {
    fields: certificationFields,
    append: appendCertification,
    remove: removeCertification,
  } = useFieldArray({ control: form.control, name: "certifications" })

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage,
  } = useFieldArray({ control: form.control, name: "languages" })

  const skills = form.watch("skills")

  useEffect(() => {
    if (initialData) {
      form.reset(initialData)
    }
  }, [initialData, form])

  function buildCvData(values: CvFormValues): CVData {
    return {
      personalInfo: {
        fullName: values.personalInfo.fullName,
        email: values.personalInfo.email,
        phone: values.personalInfo.phone ?? "",
        location: values.personalInfo.location ?? "",
        summary: values.personalInfo.summary,
      },
      experience: values.experience.map((e, i) => ({
        id: initialData?.experience[i]?.id ?? newId(),
        company: e.company,
        position: e.position,
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
        description: e.description ?? "",
      })),
      education: values.education.map((e, i) => ({
        id: initialData?.education[i]?.id ?? newId(),
        institution: e.institution,
        degree: e.degree,
        startDate: e.startDate ?? "",
        endDate: e.endDate ?? "",
      })),
      certifications: values.certifications.map((e, i) => ({
        id: initialData?.certifications[i]?.id ?? newId(),
        courseName: e.courseName,
        institution: e.institution,
        date: e.date ?? "",
      })),
      languages: values.languages.map((e, i) => ({
        id: initialData?.languages[i]?.id ?? newId(),
        languageName: e.languageName,
        grade: e.grade,
      })),
      skills: values.skills,
    }
  }

  async function uploadPhotoIfNeeded(): Promise<string | null> {
    if (!pendingPhotoFile) return originalPhotoUrl

    const supabase = createClient()
    const ext = getExtFromMime(pendingPhotoFile.type)
    const path = `${userId}/${activeId}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("cv-photos")
      .upload(path, pendingPhotoFile, { contentType: pendingPhotoFile.type })

    if (uploadError) return null

    const { data: urlData } = supabase.storage
      .from("cv-photos")
      .getPublicUrl(path)

    return urlData.publicUrl
  }

  async function handleSave() {
    const valid = await form.trigger()
    if (!valid) return

    setSaving(true)
    const supabase = createClient()
    const values = form.getValues()
    const cvData = buildCvData(values)

    let finalPhotoUrl: string | null = originalPhotoUrl

    // Upload new photo if pending
    if (pendingPhotoFile) {
      const uploadedUrl = await uploadPhotoIfNeeded()
      if (!uploadedUrl) {
        setSaving(false)
        return
      }
      finalPhotoUrl = uploadedUrl
    }

    // Remove old photo if marked for removal (edit mode only)
    if (isEdit && photoRemoved && originalPhotoUrl) {
      const bucketPath = originalPhotoUrl.split("/cv-photos/")[1]
      if (bucketPath) {
        await supabase.storage.from("cv-photos").remove([bucketPath])
      }
      finalPhotoUrl = null
    }

    if (isEdit) {
      // UPDATE existing record
      await supabase
        .from("cvs")
        .update({
          title: values.personalInfo.fullName || "CV sin título",
          data: cvData,
          photo_url: finalPhotoUrl,
        })
        .eq("id", cvId!)
    } else {
      // INSERT new record
      const { error: insertError } = await supabase.from("cvs").insert({
        user_id: userId,
        title: values.personalInfo.fullName || "CV sin título",
        template_id: "classic",
        data: cvData,
        photo_url: finalPhotoUrl,
      })

      if (insertError) {
        setSaving(false)
        return
      }
    }

    setSaving(false)
    router.push("/dashboard")
  }

  function handleCancel() {
    router.push("/dashboard")
  }

  function addSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      form.setValue("skills", [...skills, trimmed])
      setSkillInput("")
    }
  }

  function removeSkill(skill: string) {
    form.setValue(
      "skills",
      skills.filter((s) => s !== skill)
    )
  }

  return (
    <Form {...form}>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList variant="line" className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="personal">Datos personales</TabsTrigger>
            <TabsTrigger value="experience">Experiencia</TabsTrigger>
            <TabsTrigger value="education">Educación</TabsTrigger>
            <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
            <TabsTrigger value="languages">Idiomas</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
          </TabsList>

          {/* ── Datos personales ── */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoUpload
                  currentPhotoUrl={originalPhotoUrl}
                  photoFile={pendingPhotoFile}
                  photoRemoved={photoRemoved}
                  onFileSelected={(file) => {
                    setPendingPhotoFile(file)
                    setPhotoRemoved(false)
                  }}
                  onFileCleared={() => setPendingPhotoFile(null)}
                  onPhotoRemoved={() => {
                    setPhotoRemoved(true)
                    setPendingPhotoFile(null)
                  }}
                  onPhotoRemovedUndo={() => setPhotoRemoved(false)}
                />
                <FormField
                  control={form.control}
                  name="personalInfo.fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="personalInfo.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="tu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="personalInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="personalInfo.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación</FormLabel>
                        <FormControl>
                          <Input placeholder="Ciudad, País" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="personalInfo.summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resumen profesional</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Breve descripción de tu experiencia y objetivos..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Experiencia ── */}
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Experiencia laboral</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {experienceFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-none border border-border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Experiencia {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeExperience(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experience.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Empresa *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre de la empresa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.position`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Tu cargo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`experience.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de inicio</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`experience.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de fin</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`experience.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe tus responsabilidades y logros..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendExperience({
                      company: "",
                      position: "",
                      startDate: "",
                      endDate: "",
                      description: "",
                    })
                  }
                >
                  <PlusIcon /> Agregar experiencia
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Educación ── */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Educación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {educationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-none border border-border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Educación {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeEducation(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`education.${index}.institution`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institución *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nombre de la institución" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.degree`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título / Grado *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Ingeniería en Sistemas" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`education.${index}.startDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de inicio</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`education.${index}.endDate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de fin</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendEducation({
                      institution: "",
                      degree: "",
                      startDate: "",
                      endDate: "",
                    })
                  }
                >
                  <PlusIcon /> Agregar educación
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Certificaciones ── */}
          <TabsContent value="certifications">
            <Card>
              <CardHeader>
                <CardTitle>Certificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificationFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="space-y-3 rounded-none border border-border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Certificación {index + 1}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeCertification(index)}
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.courseName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del curso *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: AWS Cloud Practitioner" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.institution`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institución *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Amazon Web Services" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`certifications.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendCertification({
                      courseName: "",
                      institution: "",
                      date: "",
                    })
                  }
                >
                  <PlusIcon /> Agregar certificación
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Idiomas ── */}
          <TabsContent value="languages">
            <Card>
              <CardHeader>
                <CardTitle>Idiomas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {languageFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex items-end gap-3 rounded-none border border-border p-4"
                  >
                    <div className="flex-1 grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`languages.${index}.languageName`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Idioma *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ej: Inglés" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`languages.${index}.grade`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nivel *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Seleccionar nivel" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Básico">Básico</SelectItem>
                                <SelectItem value="Intermedio">Intermedio</SelectItem>
                                <SelectItem value="Avanzado">Avanzado</SelectItem>
                                <SelectItem value="Nativo">Nativo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeLanguage(index)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendLanguage({
                      languageName: "",
                      grade: "",
                    })
                  }
                >
                  <PlusIcon /> Agregar idioma
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Skills ── */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills / Habilidades</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Escribe una skill y presiona Agregar"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addSkill()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addSkill}>
                    Agregar
                  </Button>
                </div>
                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => removeSkill(skill)}
                      >
                        {skill}
                        <span className="ml-1 text-muted-foreground">×</span>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aún no has agregado ninguna skill
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-3">
          <Button type="button" disabled={saving} onClick={handleSave}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </Form>
  )
}
