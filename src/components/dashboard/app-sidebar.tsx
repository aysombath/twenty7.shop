"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  ChevronRight,
  Store,
  Award,
  Layers,
  FolderTree,
  Search,
  LogOut,
  Shield,
  ShieldCheck,
  User,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
    isActive: true,
    permissionString: "view_dashboard",
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: ShoppingCart,
    permissionString: "view_orders",
  },
  {
    title: "Invoices",
    url: "/admin/invoices",
    icon: FileText,
    permissionString: "view_invoices",
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: Layers,
    permissionString: "view_categories",
  },
  {
    title: "Parent Categories",
    url: "/admin/parent-categories",
    icon: FolderTree,
    permissionString: "view_parent_categories",
  },
  {
    title: "Brands",
    url: "/admin/brands",
    icon: Award,
    permissionString: "view_brands",
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: Package,
    permissionString: "view_products",
  },
 {
    title: "Customers",
    url: "/admin/customers",
    icon: Users,
    permissionString: "view_customers",
  },
  {
    title: "Stock Control",
    url: "/admin/inventory",
    icon: Package,
    permissionString: "view_stock",
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
    permissionString: "view_analytics",
  },
  {
    title: "Permission Settings",
    url: "#",
    icon: Shield,
    permissionString: "view_roles",
    items: [
      { title: "Role Permissions", url: "/admin/permissions/roles", permissionRequired: "edit_roles" },
      { title: "Role Management", url: "/admin/permissions/management", permissionRequired: "view_roles" },
    ],
  },
  {
    title: "System Settings",
    url: "/admin/settings",
    icon: Settings,
    permissionString: "view_settings",
    items: [
      { title: "General", url: "/admin/settings", permissionRequired: "view_settings" },
      { title: "Invoice Template", url: "/admin/settings/invoice", permissionRequired: "view_settings" },
    ],
  },
]

import { usePermissions } from "@/hooks/use-permissions"
import { usePathname } from "next/navigation"

function getInitials(username?: string, name?: string) {
  const src = name || username || ''
  const parts = src.split(/[\s_@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return 'PA'
}

function getRoleBadgeStyle(role?: string, type?: string) {
  if (type === 'admin') return 'bg-primary/10 text-primary border-primary/20'
  if (role === 'Client') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  return 'bg-muted text-muted-foreground border-border'
}

export function AppSidebar({ variant = "inset", ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const pathname = usePathname()
  const { sessionUser, isAdmin, hasPermission, isMounted, isPermissionsLoading } = usePermissions()

  // Display label: prefer name, then username, fallback to "Architect"
  const displayName = sessionUser?.name || sessionUser?.username || 'Architect'
  const displayEmail = sessionUser?.email || sessionUser?.username || '—'
  const displayRole = sessionUser?.role || 'Admin'
  const initials = getInitials(sessionUser?.username, sessionUser?.name)
  const roleBadgeStyle = getRoleBadgeStyle(sessionUser?.role, sessionUser?.type)


  const filteredNavItems = navItems.filter(item => hasPermission(item.permissionString)).map(item => {
     if (!item.items) return item
     // Filter sub items if they explicitly require a permission
     const validSubItems = item.items.filter((subItem: any) => !subItem.permissionRequired || hasPermission(subItem.permissionRequired))
     return { ...item, items: validSubItems.length > 0 ? validSubItems : undefined }
  }).filter(item => !item.items || item.items.length > 0)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      sessionStorage.clear()
      toast.info("Session Terminated", {
        description: "You have been logged out safely."
      })
      router.push('/login')
      router.refresh()
    } catch {
      toast.error("Logout failure.")
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Store data-icon="inline-start" className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold font-sans">Precision Atelier</span>
                <span className="truncate text-xs opacity-60">E-commerce HQ</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-sans tracking-wider uppercase text-[10px] opacity-60">Management</SidebarGroupLabel>
          <SidebarMenu>
            {isMounted && !isPermissionsLoading && filteredNavItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  render={<a href={item.url} />}
                >
                  <item.icon data-icon="inline-start" className="size-4" />
                  <span className="font-medium">{item.title}</span>
                  {item.items && (
                    <ChevronRight data-icon="inline-end" className="ml-auto size-4 transition-transform group-data-[state=open]/menu-item:rotate-90" />
                  )}
                </SidebarMenuButton>
                {item.items && (
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton render={<a href={subItem.url} />}>
                          {subItem.title}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>
            ))}
            {(!isMounted || isPermissionsLoading) && (
              <div className="px-4 py-8 flex justify-center opacity-40">
                <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-sidebar-accent transition-colors text-left group" />
          }>
              {/* Avatar */}
              <div className="relative shrink-0">
                <Avatar className="size-9 rounded-xl border border-border/20 shadow-sm">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 border-2 border-background" />
              </div>

              {/* User info — hidden when sidebar collapsed */}
              <div className="grid flex-1 text-left min-w-0 sidebar-content">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="truncate text-sm font-bold text-sidebar-foreground leading-tight">
                    {displayName}
                  </span>
                  {isAdmin && (
                    <ShieldCheck className="size-3 text-primary shrink-0" />
                  )}
                </div>
                <span className="truncate text-[10px] font-medium text-sidebar-foreground/50 leading-tight">
                  {displayEmail}
                </span>
              </div>

              <ChevronRight className="size-3 opacity-30 group-hover:opacity-60 shrink-0 sidebar-content transition-opacity" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="start"
            className="w-64 bg-white border-none shadow-2xl rounded-2xl p-2 mb-1"
          >
            {/* Identity card */}
            <div className="px-3 py-3 mb-1">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 rounded-xl border border-border/10 shadow-sm">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-foreground/90 truncate">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{displayEmail}</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 text-[9px] h-4 px-2 uppercase font-bold tracking-wider border ${roleBadgeStyle}`}
                  >
                    {isAdmin && <ShieldCheck className="size-2.5 mr-1" />}
                    {displayRole}
                  </Badge>
                </div>
              </div>
            </div>

            <DropdownMenuSeparator className="bg-border/40 my-1" />

            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 px-3 py-1">
                Account
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="rounded-xl py-2.5 px-3 cursor-pointer group flex items-center gap-3"
                onClick={() => router.push('/admin/settings')}
              >
                <User className="size-4 opacity-40 group-hover:text-primary transition-colors" />
                <span className="text-xs font-bold">Profile Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border/40 my-1" />

            <DropdownMenuGroup>
            <DropdownMenuItem
              className="rounded-xl py-2.5 px-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/5 flex items-center gap-3"
              onClick={handleLogout}
            >
              <LogOut className="size-4 opacity-60" />
              <div className="flex flex-col">
                <span className="text-xs font-bold">Sign Out</span>
                <span className="text-[10px] opacity-60">Clear session & tokens</span>
              </div>
            </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
