export interface CVData {
  personalInfo: {
    fullName: string
    email: string
    phone: string
    location: string
    summary?: string
  }
  experience: {
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    description: string
  }[]
  education: {
    id: string
    institution: string
    degree: string
    startDate: string
    endDate: string
  }[]
  certifications: {
    id: string
    courseName: string
    institution: string
    date: string
  }[]
  languages: {
    id: string
    languageName: string
    grade: string
  }[]
  skills: string[]
}
