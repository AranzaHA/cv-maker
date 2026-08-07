import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-6">
            <h1 className="text-4xl font-bold">CV Maker</h1>
            <p className="text-muted-foreground max-w-md">
                Crea tu currículum profesional en minutos, elige una plantilla y descárgalo en PDF.
            </p>
            <div className="flex gap-4">
                <Link href="/login">
                    <Button variant="outline">Iniciar sesión</Button>
                </Link>
                <Link href="/signup">
                    <Button>Crear cuenta</Button>
                </Link>
            </div>
        </div>
    )
}