"use client"

import * as React from "react"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  FileText, 
  Layers, 
  FolderTree, 
  Award, 
  Package, 
  Users, 
  BarChart3, 
  Shield, 
  Settings,
  ShieldCheck,
  RefreshCw,
  CheckCircle2
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"

interface Role {
  id: number
  name: string
  description: string
}

const MENUS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "categories", label: "Categories", icon: Layers },
  { id: "parent_categories", label: "Parent Categories", icon: FolderTree },
  { id: "brands", label: "Brands", icon: Award },
  { id: "products", label: "Products", icon: Package },
  { id: "customers", label: "Customers", icon: Users },
  { id: "stock", label: "Stock Control", icon: Package },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "roles", label: "Permission Settings", icon: Shield },
  { id: "settings", label: "System Settings", icon: Settings }
]

const ACTIONS = [
  { id: "view", label: "View", desc: "Can read and view records" },
  { id: "create", label: "Create", desc: "Can add new records" },
  { id: "edit", label: "Edit", desc: "Can modify existing records" },
  { id: "delete", label: "Delete", desc: "Can completely remove records" },
]

export function RolePermissions() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [selectedRoleId, setSelectedRoleId] = React.useState<number | null>(null)
  
  // Current active permissions string array
  const [activePermissions, setActivePermissions] = React.useState<string[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>(null)

  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/roles', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const result = await response.json()
      if (result.success && result.data.length > 0) {
        setRoles(result.data)
        setSelectedRoleId(result.data[0].id)
      }
    } catch (error) {
      toast.error("Failed to fetch roles index.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPermissions = React.useCallback(async (roleId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/permissions?role_id=${roleId}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const result = await response.json()
      if (result.success) {
        let pKeys = result.data.map((p: any) => p.permission_key)
        
        // Force the Admin role to possess every granular permission out-of-the-box
        if (roleId === 1) {
          const allKeys = MENUS.flatMap(m => ACTIONS.map(a => `${a.id}_${m.id}`))
          pKeys = Array.from(new Set([...pKeys, ...allKeys]))
        }
        
        setActivePermissions(pKeys)
      }
    } catch {
      toast.error("Failed to load permission parameters.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  React.useEffect(() => {
    if (selectedRoleId !== null) {
      fetchPermissions(selectedRoleId)
    }
  }, [selectedRoleId, fetchPermissions])

  const handleToggle = (key: string) => {
    if (selectedRoleId === 1) {
      toast.error("Security Lock", { description: "The master Admin role possesses absolute system authority and cannot be restricted." })
      return
    }

    setActivePermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    )
  }

  const handleMenuSelectAll = (menuId: string, isChecked: boolean) => {
    if (selectedRoleId === 1) {
      toast.error("Security Lock", { description: "The master Admin role possesses absolute system authority and cannot be restricted." })
      return
    }
    const menuKeys = ACTIONS.map(a => `${a.id}_${menuId}`)
    if (isChecked) {
       setActivePermissions(prev => Array.from(new Set([...prev, ...menuKeys])))
    } else {
       setActivePermissions(prev => prev.filter(p => !menuKeys.includes(p)))
    }
  }

  const handleSaveChanges = async () => {
    if (!selectedRoleId) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` 
        },
        body: JSON.stringify({ role_id: selectedRoleId, permissions: activePermissions })
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success("Security Matrix Updated", { description: "All role operation boundaries have been successfully written to the system." })
      } else {
        toast.error("Synchronization Failure", { description: result.error })
      }
    } catch {
      toast.error("Server synchronization lost.")
    } finally {
      setIsSaving(false)
    }
  }

  const selectedRoleName = roles.find(r => r.id === selectedRoleId)?.name || 'Unknown Role'

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
      
      {/* Left Sidebar - Roles List */}
      <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
        <div>
           <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20 bg-primary/5 px-3 py-1 mb-2">
             Access Control Logic
           </Badge>
           <h1 className="text-3xl font-sans font-black tracking-tight text-foreground">
             Permissions
           </h1>
           <p className="text-xs font-medium text-muted-foreground leading-relaxed mt-2 opacity-80">
             Draft operational boundaries and assign explicit rights to specific roles globally.
           </p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-xl overflow-hidden mt-2 p-2 flex flex-col">
          <div className="px-4 py-3 pb-2 flex items-center justify-between border-b border-border/10">
             <span className="text-[10px] uppercase font-bold tracking-widest opacity-40">Indexed Roles</span>
             <Layers className="size-3 opacity-30" />
          </div>
          
          <div className="p-2 space-y-1 flex-1 overflow-y-auto">
             {isLoading && roles.length === 0 ? (
               <div className="flex justify-center p-8 opacity-20"><RefreshCw className="animate-spin size-6" /></div>
             ) : roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-all font-bold tracking-tight text-sm group flex items-center justify-between",
                    selectedRoleId === role.id 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "hover:bg-secondary/50 text-foreground/70 border-transparent hover:text-foreground"
                  )}
                >
                  {role.name}
                  {['1', '2', '3'].includes(String(role.id)) && selectedRoleId !== role.id && (
                     <div className="size-1.5 rounded-full bg-amber-400 opacity-50" />
                  )}
                </button>
             ))}
          </div>
        </div>
      </div>

      {/* Main Area - Permission Switches */}
      <div className="flex-1 flex flex-col gap-6">
         {/* Right Header */}
         <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg p-5 px-8 rounded-3xl">
            <div className="flex items-center gap-4">
               <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <ShieldCheck className="size-5" />
               </div>
               <div>
                 <h2 className="font-sans font-extrabold text-xl tracking-tight leading-none bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                   {selectedRoleName} Authority Matrix
                 </h2>
                 <p className="text-xs font-semibold text-muted-foreground/60 mt-1">
                   Configuring {activePermissions.length} granted operations.
                 </p>
               </div>
            </div>
            
            <Button 
               onClick={handleSaveChanges} 
               disabled={isSaving || isLoading} 
               className="h-12 rounded-xl font-bold bg-primary px-8 text-white shadow-xl hover:scale-105 active:scale-95 transition-all shadow-primary/20"
             >
               {isSaving ? <RefreshCw className="animate-spin size-4 mr-2" /> : <CheckCircle2 className="size-4 mr-2" />}
               {isSaving ? "Synchronizing..." : "Save Identity Parameters"}
            </Button>
         </div>

         {/* Permissions Container */}
         {isLoading && roles.length > 0 ? (
           <div className="min-h-[400px] flex gap-3 flex-col items-center justify-center opacity-30">
               <RefreshCw className="size-10 animate-spin text-primary" />
               <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Querying State Node...</span>
           </div>
         ) : (
           <div className="flex flex-col gap-3 pb-10">
             {MENUS.map((menu) => {
                const menuKeys = ACTIONS.map(a => `${a.id}_${menu.id}`)
                const currentCount = activePermissions.filter(p => menuKeys.includes(p)).length
                const isAllChecked = currentCount === ACTIONS.length
                const isPartiallyChecked = currentCount > 0 && !isAllChecked
                const isExpanded = expandedMenu === menu.id

                return (
                  <Card key={menu.id} className="bg-white/60 backdrop-blur-xl border-white/40 shadow-sm rounded-2xl overflow-hidden transition-all duration-300">
                    <div 
                      className={cn(
                        "p-4 px-6 flex items-center justify-between cursor-pointer hover:bg-white/80 transition-colors",
                        isExpanded ? "bg-white/90 border-b border-border/10" : ""
                      )}
                      onClick={() => setExpandedMenu(isExpanded ? null : menu.id)}
                    >
                       <div className="flex items-center gap-4">
                          <div className={cn("size-8 rounded-lg flex items-center justify-center transition-colors", currentCount > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <menu.icon className="size-4" />
                          </div>
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-sm">{menu.label} Module</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{currentCount} / {ACTIONS.length} ACTIVE</span>
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-6" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                             <Switch 
                                checked={isAllChecked || isPartiallyChecked}
                                onCheckedChange={(checked) => handleMenuSelectAll(menu.id, checked)}
                                className={cn(isAllChecked ? "data-[state=checked]:bg-primary" : isPartiallyChecked ? "data-[state=checked]:bg-primary/50" : "")}
                             />
                             <span className="text-xs font-bold text-muted-foreground w-12 text-right">
                               {isAllChecked ? "ALL" : isPartiallyChecked ? "CUSTOM" : "NONE"}
                             </span>
                          </div>
                          <div 
                             className="size-6 flex items-center justify-center rounded-md hover:bg-secondary cursor-pointer"
                             onClick={() => setExpandedMenu(isExpanded ? null : menu.id)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")}>
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </div>
                       </div>
                    </div>
                    
                    {/* Expandable Dropdown Content */}
                    <div className={cn(
                      "grid transition-all duration-300 ease-in-out",
                      isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    )}>
                       <div className="overflow-hidden">
                          <CardContent className="p-6 bg-white/50 pt-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                              {ACTIONS.map(action => {
                                 const permKey = `${action.id}_${menu.id}`
                                 const isChecked = activePermissions.includes(permKey)
                                 return (
                                   <div 
                                     key={action.id} 
                                     className={cn(
                                       "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                       isChecked ? "bg-primary/5 border-primary/20 shadow-sm" : "bg-white border-transparent hover:border-border/50 shadow-sm"
                                     )}
                                     onClick={() => handleToggle(permKey)}
                                   >
                                      <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-sm capitalize">{action.label}</span>
                                        <div className={cn(
                                          "size-5 rounded-md flex items-center justify-center border transition-colors",
                                          isChecked ? "bg-primary border-primary text-white" : "border-muted-foreground/30 bg-muted/50"
                                        )}>
                                          {isChecked && <CheckCircle2 className="size-3.5" />}
                                        </div>
                                      </div>
                                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/70 leading-relaxed">
                                        {action.desc}
                                      </p>
                                   </div>
                                 )
                              })}
                            </div>
                          </CardContent>
                       </div>
                    </div>
                  </Card>
                )
             })}
           </div>
         )}
      </div>
    </div>
  )
}

