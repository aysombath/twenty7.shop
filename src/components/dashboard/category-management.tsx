"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Plus, Pencil, Trash2, LayoutGrid, Package, Eye, EyeOff, ChevronRight, Activity, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
  productCount: number
  status: "Active" | "Hidden"
  description: string
  lastUpdated: string
}

const INITIAL_CATEGORIES: Category[] = [
  {
    id: "1",
    name: "Accessories",
    slug: "accessories",
    productCount: 124,
    status: "Active",
    description: "High-end timepieces, jewelry, and secondary architectural assets.",
    lastUpdated: "2h ago"
  },
  {
    id: "2",
    name: "Electronics",
    slug: "electronics",
    productCount: 42,
    status: "Active",
    description: "Acoustic hardware, precision instrumentation, and studio gear.",
    lastUpdated: "5h ago"
  },
  {
    id: "3",
    name: "Home Decor",
    slug: "home-decor",
    productCount: 86,
    status: "Active",
    description: "Minimalist lighting, brutalist ceramics, and structural furniture.",
    lastUpdated: "1d ago"
  },
  {
    id: "4",
    name: "Fashion",
    slug: "fashion",
    productCount: 52,
    status: "Active",
    description: "Signature leather goods, curated apparel, and travel collections.",
    lastUpdated: "3d ago"
  },
  {
    id: "5",
    name: "Limited Editions",
    slug: "limited",
    productCount: 8,
    status: "Hidden",
    description: "Exclusive curated drops and one-of-a-kind architectural releases.",
    lastUpdated: "1w ago"
  }
]

export function CategoryManagement() {
  const router = useRouter()
  const [categories, setCategories] = React.useState<Category[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  
  const [newCategory, setNewCategory] = React.useState<Partial<Category>>({
    name: "",
    description: "",
    status: "Active"
  })

  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  // Master Taxonomy Synchronization
  const syncTaxonomy = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        }
      })
      const json = await res.json()
      if (json.success) {
        // Formatting SQL response to Category interface
        const mapped = json.data.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          slug: c.slug,
          description: c.description,
          status: c.status,
          productCount: parseInt(c.product_count) || 0,
          lastUpdated: new Date(c.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }))
        setCategories(mapped)
      }
    } catch (error) {
      toast.error("Vault Synchronization Failure", { description: "Failed to fetch master taxonomy." })
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    syncTaxonomy()
  }, [syncTaxonomy])

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories?id=${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        }
      })
      const json = await res.json()
      if (json.success) {
        setCategories(categories.filter(c => c.id !== id))
        toast.error("Category Removed", {
          description: "The architectural category has been purged from the index."
        })
      }
    } catch (error) {
      toast.error("Purge Error", { description: "Failed to remove taxonomy record." })
    }
  }

  const handleToggleStatus = async (id: string) => {
    const category = categories.find(c => c.id === id)
    if (!category) return

    const newStatus = category.status === "Active" ? "Hidden" : "Active"
    
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify({ ...category, status: newStatus })
      })
      const json = await res.json()
      if (json.success) {
        setCategories(categories.map(c => c.id === id ? { ...c, status: newStatus } : c))
        toast.success("Visibility Synchronized", {
          description: `Category ${newStatus.toLowerCase()} in the public index.`
        })
      }
    } catch (error) {
      toast.error("Status Sync Failure")
    }
  }

  const handleAddCategory = async () => {
    if (!newCategory.name) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify(newCategory)
      })
      const json = await res.json()
      if (json.success) {
        syncTaxonomy()
        setIsAddDialogOpen(false)
        setNewCategory({ name: "", description: "", status: "Active" })
        toast.success("Identity Sequence Initialized", {
          description: `${newCategory.name} is now a master category.`
        })
      }
    } catch (error) {
      toast.error("Initialization Error")
    }
  }

  const handleEditSpecs = (category: Category) => {
    setEditingCategory({...category})
    setIsEditDialogOpen(true)
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    try {
      const res = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify(editingCategory)
      })
      const json = await res.json()
      if (json.success) {
        syncTaxonomy()
        setIsEditDialogOpen(false)
        setEditingCategory(null)
        toast.success("Taxonomy Technical Specs Updated", {
          description: "The architectural record has been synchronized."
        })
      }
    } catch (error) {
      toast.error("Sync Failure")
    }
  }

  const handleOpenCollection = (name: string) => {
    // Navigate to catalog page (simulated filtering via URL if needed)
    router.push(`/catalog`)
    toast.info(`Opening ${name} Collection`, {
      description: "Directing to targeted architectural product index."
    })
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
             <Activity className="size-4 text-primary opacity-60" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">System Classification</span>
          </div>
          <h1 className="text-4xl font-sans font-extrabold tracking-tight text-foreground/90 leading-none">
            Categories & Series
          </h1>
          <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase">
             Master Taxonomy for <span className="text-primary font-bold">Precision Atelier 2026</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncTaxonomy}
            disabled={isLoading}
            className="gap-2 rounded-lg border-border/40 hover:bg-white hover:shadow-sm transition-all px-4 font-bold tracking-tight h-10 text-[10px] uppercase opacity-70"
          >
            <RefreshCw className={cn("size-3 opacity-60", isLoading && "animate-spin")} /> 
            Sync Taxonomy
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2 rounded-lg bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all px-5 font-bold tracking-tight h-10" />}>
              <Plus data-icon="inline-start" /> New Taxonomy
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-sans font-bold">Create Master Category</DialogTitle>
                <DialogDescription>Define a new series for the architectural index.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                 <div className="grid gap-2">
                    <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Category Name</Label>
                    <Input id="name" value={newCategory.name} onChange={e => setNewCategory({...newCategory, name: e.target.value})} placeholder="e.g. Sculptural Lighting" className="h-12 bg-surface-low border-none rounded-xl font-bold" />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="description" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Technical Description</Label>
                    <Input id="description" value={newCategory.description} onChange={e => setNewCategory({...newCategory, description: e.target.value})} placeholder="Define the series scope..." className="h-12 bg-surface-low border-none rounded-xl font-bold" />
                 </div>
              </div>
              <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-bold rounded-xl h-12">Cancel</Button>
                 <Button onClick={handleAddCategory} className="font-bold rounded-xl h-12 bg-primary">Lock Record</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Edit Specs Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
           <DialogHeader>
              <DialogTitle className="text-2xl font-sans font-bold">Edit Taxonomy Specs</DialogTitle>
              <DialogDescription>Update master records for ID: {editingCategory?.id}</DialogDescription>
           </DialogHeader>
           {editingCategory && (
              <div className="grid gap-6 py-6 border-y border-border/10 my-2">
                 <div className="grid gap-2">
                    <Label htmlFor="edit-name" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Label</Label>
                    <Input 
                       id="edit-name" 
                       value={editingCategory.name} 
                       onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                       className="h-12 bg-surface-low border-none rounded-xl font-bold"
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="edit-slug" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Master Slug</Label>
                    <Input 
                       id="edit-slug" 
                       value={editingCategory.slug} 
                       onChange={e => setEditingCategory({...editingCategory, slug: e.target.value})}
                       className="h-12 bg-surface-low border-none rounded-xl font-bold font-mono text-[10px]"
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="edit-desc" className="text-[10px] uppercase font-bold tracking-widest opacity-40">System Description</Label>
                    <Input 
                       id="edit-desc" 
                       value={editingCategory.description} 
                       onChange={e => setEditingCategory({...editingCategory, description: e.target.value})}
                       className="h-12 bg-surface-low border-none rounded-xl font-bold"
                    />
                 </div>
              </div>
           )}
           <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-12 rounded-xl font-bold">Discard</Button>
              <Button onClick={handleUpdateCategory} className="h-12 rounded-xl font-bold bg-primary px-8">Sync Specs</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="group relative bg-white border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "p-2 rounded-lg bg-secondary/10",
                  category.status === "Active" ? "text-emerald-500" : "text-slate-400"
                )}>
                  <LayoutGrid className="size-5 transition-colors" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 hover:bg-surface-low rounded-lg opacity-40 group-hover:opacity-100 transition-opacity" />}>
                     <MoreHorizontal data-icon="inline-start" className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl border-none shadow-2xl p-2">
                     <DropdownMenuGroup>
                        <DropdownMenuLabel className="font-sans text-[10px] uppercase tracking-widest opacity-40 px-3 py-2">Master Controls</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEditSpecs(category)} className="gap-2 cursor-pointer font-bold text-xs p-3">
                           <Pencil data-icon="inline-start" className="size-3" /> Edit Specs
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(category.id)} className="gap-2 cursor-pointer font-bold text-xs p-3">
                           {category.status === "Active" ? <EyeOff data-icon="inline-start" className="size-3" /> : <Eye data-icon="inline-start" className="size-3" />}
                           {category.status === "Active" ? "Hide Catalog" : "Restore catalog"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(category.id)} className="gap-2 cursor-pointer font-bold text-xs p-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                           <Trash2 data-icon="inline-start" className="size-3" /> Purge Entry
                        </DropdownMenuItem>
                     </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-col gap-1">
                 <div className="flex items-center gap-2">
                    <CardTitle className="text-xl font-sans font-extrabold tracking-tight group-hover:text-primary transition-colors">{category.name}</CardTitle>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0 border-border/20 transition-all",
                      category.status === "Active" ? "text-primary/70" : "text-muted-foreground/40 opacity-50"
                    )}>{category.slug}</Badge>
                 </div>
                 <CardDescription className="text-xs font-medium leading-relaxed opacity-60 line-clamp-2 mt-1">
                    {category.description}
                 </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
               <div className="flex items-center justify-between mt-4 pt-6 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Linked Items</span>
                     <div className="flex items-center gap-2">
                        <Package className="size-3 text-primary opacity-60" />
                        <span className="text-sm font-sans font-extrabold tracking-tight">{category.productCount} SKUs</span>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Last Sync</span>
                     <span className="text-[10px] font-bold tracking-tight text-foreground/70 uppercase">{category.lastUpdated}</span>
                  </div>
               </div>
               <div className="mt-8">
                  <Button onClick={() => handleOpenCollection(category.name)} variant="ghost" className="w-full justify-between h-12 px-6 rounded-xl bg-surface-low/50 hover:bg-primary hover:text-white transition-all group/btn border-none shadow-sm">
                     <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                        Open Collection Index
                     </span>
                     <ChevronRight className="size-4 opacity-40 group-hover/btn:translate-x-1 group-hover/btn:opacity-100 transition-all" />
                  </Button>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
