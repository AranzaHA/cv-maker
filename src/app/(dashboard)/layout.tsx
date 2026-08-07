"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { FileTextIcon, LayoutTemplateIcon, UserIcon, LogOutIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface User {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login")
        return
      }
      setUser(user)
    })
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const fullName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "U"
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    { title: "Mis CVs", icon: FileTextIcon, href: "/dashboard" },
    { title: "Plantillas", icon: LayoutTemplateIcon, href: "/templates" },
    { title: "Mi perfil", icon: UserIcon, href: "/profile" },
  ]

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="border-r-0 bg-sidebar"
      >
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/assets/luminaCV-logo.png"
              alt="LuminaCV"
              className="h-8 w-auto shrink-0"
            />
            <span className="text-sm font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              LuminaCV
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={pathname === item.href}
                  tooltip={item.title}
                  className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
                >
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip="Cerrar sesión"
                className="text-sidebar-foreground/70 hover:text-red-400 hover:bg-sidebar-accent"
              >
                <LogOutIcon className="size-4" />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b border-border bg-sidebar px-4 backdrop-blur-xl">
          <SidebarTrigger className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-border bg-popover/95 backdrop-blur-xl"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-foreground">{fullName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-muted-foreground focus:bg-accent focus:text-red-400"
                >
                  <LogOutIcon className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="flex-1 overflow-auto p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
