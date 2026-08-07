import { z } from "zod"

export const personalInfoSchema = z.object({
  fullName: z.string().min(1, "El nombre es obligatorio"),
  email: z.string().email("Ingresa un email válido"),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
})

export const experienceSchema = z.object({
  company: z.string().min(1, "La empresa es obligatoria"),
  position: z.string().min(1, "El cargo es obligatorio"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
})

export const educationSchema = z.object({
  institution: z.string().min(1, "La institución es obligatoria"),
  degree: z.string().min(1, "El título/grado es obligatorio"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export const certificationSchema = z.object({
  courseName: z.string().min(1, "El nombre del curso es obligatorio"),
  institution: z.string().min(1, "La institución es obligatoria"),
  date: z.string().optional(),
})

export const languageSchema = z.object({
  languageName: z.string().min(1, "El idioma es obligatorio"),
  grade: z.string().min(1, "El nivel es obligatorio"),
})

export const cvFormSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceSchema),
  education: z.array(educationSchema),
  certifications: z.array(certificationSchema),
  languages: z.array(languageSchema),
  skills: z.array(z.string()),
})

export type PersonalInfoValues = z.infer<typeof personalInfoSchema>
export type ExperienceValues = z.infer<typeof experienceSchema>
export type EducationValues = z.infer<typeof educationSchema>
export type CertificationValues = z.infer<typeof certificationSchema>
export type LanguageValues = z.infer<typeof languageSchema>
export type CvFormValues = z.infer<typeof cvFormSchema>
