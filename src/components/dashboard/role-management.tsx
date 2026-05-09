"use client"

import * as React from "react"
import { Shield, Plus, MoreHorizontal, FileEdit, Trash2, RefreshCw, Layers } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

interface Role {
  id: number
  name: string
  description: string
  created_at: string
}

export function RoleManagement() {
  const [roles, setRoles] = React.useState<Role[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  
  // Create / Edit State
  const [editingRole, setEditingRole] = React.useState<Role | null>(null)
  const [roleForm, setRoleForm] = React.useState({ 
    name: "", 
    description: "",
  })

  const fetchRoles = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        }
      })
      const result = await response.json()
      if (result.success) {
        setRoles(result.data || [])
      } else {
        toast.error("Failed to load roles", { description: result.error })
      }
    } catch (error) {
      toast.error("Network synchronization failed")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleSaveRole = async () => {
    if (!roleForm.name) {
      toast.error("Required fields missing", { description: "Role name cannot be empty." })
      return
    }
    
    setIsLoading(true)
    try {
      const method = editingRole ? 'PATCH' : 'POST'
      const payload = editingRole ? { ...roleForm, id: editingRole.id } : roleForm

      const response = await fetch('/api/roles', {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify(payload)
      })
      const result = await response.json()
      
      if (result.success) {
        toast.success(editingRole ? "Role Definition Updated" : "System Role Created", {
          description: `'${roleForm.name}' has been synced to the primary index.`
        })
        setIsRegisterOpen(false)
        setEditingRole(null)
        setRoleForm({ name: "", description: "" })
        fetchRoles()
      } else {
        toast.error("Submission Failure", { description: result.error })
      }
    } catch (error) {
      toast.error("API Connection Failure")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRole = async (role: Role) => {
    if (['1', '2', '3'].includes(String(role.id))) {
      toast.error("Protected Architecture", { description: "Core system roles cannot be purged." })
      return
    }
    
    if (!confirm(`Are you sure you want to completely remove the ${role.name} architecture?`)) return

    try {
      const response = await fetch(`/api/roles?id=${role.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const result = await response.json()

      if (result.success) {
        toast.success("Role Implementation Removed")
        fetchRoles()
      } else {
        toast.error("Deletion Failure", { description: result.error })
      }
    } catch {
      toast.error("Network communication error.")
    }
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setRoleForm({ name: role.name, description: role.description || "" })
    setIsRegisterOpen(true)
  }

  const openCreateDialog = () => {
    setEditingRole(null)
    setRoleForm({ name: "", description: "" })
    setIsRegisterOpen(true)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/10">
        <div className="space-y-2">
          <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-widest text-primary border-primary/20 bg-primary/5 px-3 py-1 mb-2">
            System Identities
          </Badge>
          <h1 className="text-4xl font-sans font-black tracking-tight text-foreground">
            Role Architectures
          </h1>
          <p className="text-sm font-medium text-muted-foreground max-w-xl leading-relaxed">
            Construct and define access parameters. System roles dictate visibility and permissions across the Precision Atelier deployment footprint.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchRoles} className="h-10 px-4 rounded-lg bg-white shadow-sm font-bold opacity-70 hover:opacity-100 transition-opacity">
            <RefreshCw className={cn("size-4 mr-2", isLoading && "animate-spin")} />
            Sync Config
          </Button>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger render={
              <Button size="sm" onClick={openCreateDialog} className="gap-2 rounded-lg bg-primary hover:bg-primary/90 shadow-md transition-all px-5 font-bold tracking-tight h-10" />
            }>
              <Plus data-icon="inline-start" /> Create Role
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-sans font-bold">
                  {editingRole ? "Reconfigure Architecture" : "Mint System Role"}
                </DialogTitle>
                <DialogDescription>
                  Define the structural identifier and descriptor for this new access tier.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                 <div className="grid gap-2">
                    <Label htmlFor="role-name" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Role Name (Identifier)</Label>
                    <Input 
                      id="role-name" 
                      value={roleForm.name} 
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoleForm({...roleForm, name: e.target.value})} 
                      className="h-12 bg-secondary/20 border-none rounded-xl font-bold text-sm" 
                      placeholder="e.g. Content Publisher"
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="role-desc" className="text-[10px] uppercase font-bold tracking-widest opacity-40">System Descriptor</Label>
                    <Textarea 
                      id="role-desc" 
                      value={roleForm.description} 
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRoleForm({...roleForm, description: e.target.value})} 
                      className="min-h-24 bg-secondary/20 border-none rounded-xl font-medium text-sm resize-none" 
                      placeholder="Outline the operational constraints and allowances..."
                    />
                 </div>
              </div>
              <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsRegisterOpen(false)} className="h-12 rounded-xl font-bold">Cancel</Button>
                 <Button onClick={handleSaveRole} disabled={isLoading} className="h-12 rounded-xl font-bold bg-primary px-8 text-white">
                    {isLoading ? <RefreshCw className="animate-spin size-4" /> : (editingRole ? "Synchronize Updates" : "Mint Role Tier")}
                 </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Table */}
      <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/40 shadow-2xl overflow-hidden min-h-[400px]">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="border-none">
              <TableHead className="py-6 px-8 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 w-16">ID</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 w-[200px]">System Role</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Descriptor Blueprint</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">Configuration Date</TableHead>
              <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && roles.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                       <RefreshCw className="size-10 animate-spin" />
                       <span className="text-[10px] uppercase font-bold tracking-[0.3em]">Querying Access Tiers...</span>
                    </div>
                 </TableCell>
              </TableRow>
            ) : roles.length === 0 ? (
              <TableRow>
                 <TableCell colSpan={5} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-20">
                       <Layers className="size-10" />
                       <span className="text-[10px] uppercase font-bold tracking-[0.3em]">No Roles Formulated in DB</span>
                    </div>
                 </TableCell>
              </TableRow>
            ) : roles.map((role) => (
              <TableRow key={role.id} className="group border-b border-border/5 hover:bg-secondary/50 transition-colors">
                <TableCell className="py-6 px-8 font-mono text-xs opacity-40">
                  {String(role.id).padStart(3, '0')}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-sans font-extrabold text-foreground/80 tracking-tight">{role.name}</span>
                    {['1', '2', '3'].includes(String(role.id)) && (
                      <Badge variant="outline" className="text-[8px] h-4 px-1.5 uppercase tracking-widest bg-amber-500/10 text-amber-600 border-amber-200">System Core</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground/80 font-medium leading-relaxed max-w-[400px]">
                  {role.description || "Unspecified structural parameters."}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground/50 tracking-tight">
                  {new Date(role.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </TableCell>
                <TableCell className="text-right pr-8">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="hover:bg-primary/5" />}>
                      <MoreHorizontal className="size-4 opacity-40" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white border-none shadow-2xl rounded-2xl p-2 z-50">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[9px] px-3 py-2 uppercase font-bold tracking-[0.2em] opacity-40">Architecture Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50 my-1" />
                        <DropdownMenuItem className="rounded-xl py-3 px-3 cursor-pointer group" onClick={() => openEditDialog(role)}>
                          <FileEdit className="size-4 mr-3 opacity-40 group-hover:text-primary transition-colors" />
                          <span className="text-xs font-bold">Reconfigure</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-border/50 my-1" />
                      <DropdownMenuGroup>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive rounded-xl py-3 px-3 cursor-pointer group" 
                          onClick={() => handleDeleteRole(role)}
                        >
                          <Trash2 className="size-4 mr-3 opacity-40" />
                          <span className="text-xs font-bold">Purge System Role</span>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}
