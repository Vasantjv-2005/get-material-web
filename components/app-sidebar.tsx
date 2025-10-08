"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, UploadCloud, Files, ShieldCheck, LogOut, BookOpenText } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Upload", href: "/upload", icon: UploadCloud },
  { label: "Materials", href: "/materials", icon: Files },
  { label: "Admin", href: "/admin", icon: ShieldCheck },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <SidebarProvider>
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="inline-flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground">
              <BookOpenText className="size-4" />
            </div>
            <span className="font-semibold group-data-[collapsible=icon]:hidden">Get Material</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} className="transition-colors">
                        <Link href={item.href} className={cn(isActive && "aria-[current=page]:font-medium")}>
                          <Icon className="shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />
        </SidebarContent>

        <SidebarFooter>
          <Button asChild variant="ghost" className="justify-start hover:bg-sidebar-accent rounded-md">
            <Link href="/">
              <LogOut className="mr-2 size-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Link>
          </Button>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto bg-card rounded-xl shadow-sm border p-3 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
