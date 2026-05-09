"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { ProductCatalogGrid, Product } from "@/components/dashboard/product-catalog-grid"
import { Button } from "@/components/ui/button"
import { Plus, SlidersHorizontal, ArrowUpDown, ChevronDown, Download, Search, Tag, Box, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const INITIAL_CATALOG: Product[] = [
  {
    id: "1",
    name: "Architectural Timepiece",
    category: "Accessories",
    price: "$850.00",
    priceValue: 850,
    status: "Published",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Luxury", "Brass", "Minimalist"],
    sku: "SKU-CUR-001"
  },
  {
    id: "2",
    name: "Acoustic Silence Pro",
    category: "Electronics",
    price: "$299.00",
    priceValue: 299,
    status: "Published",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Audio", "Matte Black", "Professional"],
    sku: "SKU-CUR-002"
  },
  {
    id: "3",
    name: "Mono-form Desk Lamp",
    category: "Home Decor",
    price: "$175.00",
    priceValue: 175,
    status: "Draft",
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Lighting", "Steel", "Office"],
    sku: "SKU-CUR-003"
  },
  {
    id: "4",
    name: "Curated Clay Vase",
    category: "Home Decor",
    price: "$125.00",
    priceValue: 125,
    status: "Published",
    image: "https://images.unsplash.com/photo-1578500484705-02758177519e?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Ceramic", "Handmade", "Beige"],
    sku: "SKU-CUR-004"
  },
  {
    id: "5",
    name: "Brutalist Leather Tote",
    category: "Fashion",
    price: "$420.00",
    priceValue: 420,
    status: "Published",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Leather", "Travel", "Signature"],
    sku: "SKU-CUR-005"
  },
  {
    id: "6",
    name: "Orbital Coffee Table",
    category: "Home Decor",
    price: "$1,200.00",
    priceValue: 1200,
    status: "Archived",
    image: "https://images.unsplash.com/photo-1538688543477-cd263dac5de3?auto=format&fit=crop&q=80&w=600&h=800",
    tags: ["Furniture", "Glass", "Modern"],
    sku: "SKU-CUR-006"
  }
]

export default function CatalogPage() {
  const [products, setProducts] = React.useState<Product[]>(INITIAL_CATALOG)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortType, setSortType] = React.useState<"name" | "price-asc" | "price-desc" | "newest">("newest")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [isInitializing, setIsInitializing] = React.useState(true)

  // Initializing Master Sync with Neon Vault
  React.useEffect(() => {
    async function fetchMasterIndex() {
      try {
        const res = await fetch('/api/products')
        const json = await res.json()
        if (json.success && json.data.length > 0) {
          // Mapping architectural SQL schema to Digital Curator UI
          const mapped: Product[] = json.data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            category: p.category,
            price: `$${parseFloat(p.price).toFixed(2)}`,
            priceValue: parseFloat(p.price),
            status: p.status === 'Active' ? 'Published' : p.status as any,
            image: p.image_url || "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=600&h=800",
            sku: p.sku || `SKU-CUR-${p.id}`,
            description: p.description || "An architectural masterpiece designed for the Precision Atelier 2026 collection.",
            tags: (p.tags && p.tags.length > 0) ? p.tags : ["Architectural", p.category]
          }))
          setProducts(mapped)
        }
      } catch (err) {
        console.warn("Neon vault synchronization offline. Utilizing localized backup.", err)
      } finally {
        setIsInitializing(false)
      }
    }
    fetchMasterIndex()
  }, [])

  // Modal States
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [activeProduct, setActiveProduct] = React.useState<Product | null>(null)
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: "",
    category: "Accessories",
    price: "$0.00",
    priceValue: 0,
    status: "Published",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=800",
    sku: "",
    description: "",
    tags: []
  })

  // Filtering Logic
  const filteredProducts = React.useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (p.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
      return matchesSearch && matchesCategory
    })

    if (sortType === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortType === "price-asc") {
      result.sort((a, b) => (a.priceValue || 0) - (b.priceValue || 0))
    } else if (sortType === "price-desc") {
      result.sort((a, b) => (b.priceValue || 0) - (a.priceValue || 0))
    } else if (sortType === "newest") {
      result.sort((a, b) => Number(b.id) - Number(a.id))
    }

    return result
  }, [products, searchTerm, sortType, categoryFilter])

  // Handlers
  const handleExport = () => {
    toast.success("Export Catalog Gallery", {
      description: `High-res asset index generated for ${filteredProducts.length} items.`,
    })
  }

  const handleAddProduct = async () => {
    if (!newProduct.name) return
    const priceStr = newProduct.price || "$0.00"
    const priceVal = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0
    
    const id = (products.length + 1).toString()
    const product: Product = {
      ...newProduct as Product,
      id,
      sku: newProduct.sku || `SKU-CUR-${id.padStart(3, '0')}`,
      price: priceStr,
      priceValue: priceVal,
      image: newProduct.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=800",
      description: newProduct.description || "Architectural asset initialized in the 2026 index.",
      tags: (newProduct.tags && newProduct.tags.length > 0) ? newProduct.tags : ["New Arrival"]
    }

    // Sync to Neon Vault
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          category: product.category,
          price: priceVal,
          sku: product.sku,
          image_url: product.image,
          description: product.description,
          tags: product.tags,
          stock: 0
        })
      })
      const json = await res.json()
      if (json.success && json.data) {
        toast.success("Master Record Synchronized", { description: `${product.name} initialized in Neon vault.` })
        
        // Finalizing the architectural record with the database-assigned ID
        const finalProduct: Product = {
          ...product,
          id: json.data.id.toString(),
          tags: json.data.tags || product.tags
        }
        setProducts([finalProduct, ...products])
      } else {
        toast.error("Sync Failure", { description: json.error || "Registry conflict or server rejection." })
      }
    } catch (err) {
      toast.error("Network Latency", { description: "Failed to reach architectural mainframe. Record not registered." })
    }
    
    setIsAddDialogOpen(false)
    setNewProduct({
      name: "",
      category: "Accessories",
      price: "$0.00",
      priceValue: 0,
      status: "Published",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600&h=800",
      sku: "",
      description: "",
      tags: []
    })
  }

  const handleUpdateProduct = async () => {
    if (!activeProduct) return
    const priceVal = parseFloat(activeProduct.price.replace(/[^0-9.]/g, '')) || 0
    
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeProduct.id,
          name: activeProduct.name,
          category: activeProduct.category,
          price: priceVal,
          status: activeProduct.status === 'Published' ? 'Active' : activeProduct.status,
          sku: activeProduct.sku,
          description: activeProduct.description,
          image_url: activeProduct.image,
          tags: activeProduct.tags
        })
      })
      const json = await res.json()
      if (json.success) {
        setProducts(products.map(p => p.id === activeProduct.id ? activeProduct : p))
        toast.success("Identity Updated", { description: "Master catalog record has been synchronized with the vault." })
      } else {
        toast.error("Update Failure", { description: json.error || "Rejection from architectural mainframe." })
      }
    } catch (err) {
      toast.error("Network Latency", { description: "Failed to publish updates. Registry remains localized." })
    }
    
    setIsEditDialogOpen(false)
    setActiveProduct(null)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setProducts(products.filter(p => p.id !== id))
        toast.info("Product Purged", { description: "Identity permanently removed from the primary index." })
      } else {
        toast.error("Purge Error", { description: "Mainframe rejected deletion request." })
      }
    } catch (err) {
      toast.error("System Failure", { description: "Failed to purge asset. Registry remains intact." })
    }
  }

  const handleDuplicate = (id: string) => {
    const original = products.find(p => p.id === id)
    if (original) {
      const newId = (products.length + 1).toString()
      const duplicate = { 
        ...original, 
        id: newId, 
        name: `${original.name} (Copy)`,
        sku: `SKU-CUR-${newId.padStart(3, '0')}`,
        status: "Draft" as const
      }
      setProducts([duplicate, ...products])
      toast.success("Duplicate Created", {
         description: `Architectural copy of ${original.name} initialized.`
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-12 max-w-[1600px] mx-auto px-4 lg:px-10 pb-20">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 sticky top-[72px] z-40 bg-zinc-50/80 backdrop-blur-xl py-6 border-b border-border/10 -mx-4 px-4 lg:-mx-10 lg:px-10 transition-all duration-300">
          <div className="flex flex-col gap-3">
             <div className="flex items-center gap-2 mb-1">
                <span className="size-2 rounded-full bg-primary/40 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">Active Collection</span>
             </div>
             <h1 className="text-5xl font-sans font-extrabold tracking-tight text-foreground/90 leading-none">
              Master Catalog
             </h1>
             <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase flex items-center gap-4 mt-2">
              <span className="text-foreground/40 font-bold">Ref: Precision_Atelier_2026</span>
              <span className="w-px h-3 bg-border/40" />
              <span>{filteredProducts.length} Curated Items</span>
             </p>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative w-72 lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 opacity-40 group-focus-within:opacity-80 transition-opacity duration-300" />
                <Input 
                  placeholder="Scan product names, SKUs, tags..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 bg-white/40 border-none shadow-[0_0_0_1px_rgba(19,27,46,0.06)] focus-visible:ring-2 focus-visible:ring-primary/40 h-12 rounded-xl text-sm font-semibold tracking-tight transition-all duration-300 hover:shadow-lg"
                />
             </div>
             
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="size-12 rounded-xl border-none bg-white/40 backdrop-blur-md shadow-sm hover:shadow-lg transition-all hover:bg-white text-muted-foreground hover:text-primary">
                   <SlidersHorizontal data-icon="inline-start" className="size-5" />
                </Button>
                
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger render={<Button size="icon" className="size-12 rounded-xl bg-primary hover:bg-primary/90 shadow-xl hover:shadow-primary/20 transition-all hover:-translate-y-0.5" />}>
                     <Plus data-icon="inline-start" className="size-6 text-white" />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-sans font-bold">Initialize Master Record</DialogTitle>
                      <DialogDescription>Add a new architectural asset to the 2026 catalog.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                       <div className="grid gap-2">
                          <Label htmlFor="name" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Product Name</Label>
                          <Input id="name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-12 bg-surface-low border-none rounded-xl font-bold" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                             <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Category</Label>
                             <Select onValueChange={v => v && setNewProduct({...newProduct, category: v})} value={newProduct.category}>
                                <SelectTrigger className="h-12 bg-surface-low border-none rounded-xl font-bold">
                                   <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="Accessories">Accessories</SelectItem>
                                   <SelectItem value="Electronics">Electronics</SelectItem>
                                   <SelectItem value="Home Decor">Home Decor</SelectItem>
                                   <SelectItem value="Fashion">Fashion</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                          <div className="grid gap-2">
                             <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Retail Price</Label>
                             <Input 
                               value={newProduct.price} 
                               onChange={e => {
                                 const val = e.target.value.replace(/[^0-9.]/g, '')
                                 setNewProduct({...newProduct, price: `$${val}`, priceValue: parseFloat(val) || 0})
                               }} 
                               className="h-12 bg-surface-low border-none rounded-xl font-bold" 
                             />
                          </div>
                       </div>
                       <div className="grid gap-2">
                          <Label htmlFor="sku" className="text-[10px] uppercase font-bold tracking-widest opacity-40">SKU Reference (REF)</Label>
                          <Input id="sku" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="SKU-CUR-XXX" className="h-12 bg-surface-low border-none rounded-xl font-bold" />
                       </div>
                       <div className="grid gap-2">
                          <Label htmlFor="image_url" className="text-[10px] uppercase font-bold tracking-widest opacity-40">High-Res Image URL</Label>
                          <Input id="image_url" value={newProduct.image} onChange={e => setNewProduct({...newProduct, image: e.target.value})} placeholder="https://..." className="h-12 bg-surface-low border-none rounded-xl font-bold" />
                       </div>
                       <div className="grid gap-2">
                          <Label htmlFor="description" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Asset Description</Label>
                          <textarea 
                            id="description" 
                            value={newProduct.description} 
                            onChange={e => setNewProduct({...newProduct, description: e.target.value})} 
                            className="min-h-[100px] w-full bg-surface-low border-none rounded-xl font-medium p-4 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                            placeholder="Briefly describe the architectural integrity of this asset..."
                          />
                       </div>
                       <div className="grid gap-2">
                          <Label htmlFor="tags" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Architectural Tags (Comma separated)</Label>
                          <Input 
                            id="tags" 
                            value={newProduct.tags?.join(", ")} 
                            onChange={e => {
                              const tags = e.target.value.split(",").map(t => t.trim()).filter(t => t !== "")
                              setNewProduct({...newProduct, tags})
                            }} 
                            placeholder="Minimalist, Steel, Carbon, High-End" 
                            className="h-12 bg-surface-low border-none rounded-xl font-bold" 
                          />
                       </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                       <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-bold rounded-xl h-12">Cancel</Button>
                       <Button onClick={handleAddProduct} className="font-bold rounded-xl h-12 bg-primary">Initialize Record</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
             </div>
          </div>
        </header>

        {/* Catalog Control Strip */}
        <section className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-border/10">
           <div className="flex flex-wrap items-center gap-4 md:gap-8">
              <DropdownMenu>
                 <DropdownMenuTrigger render={<button className="flex items-center gap-3 group cursor-pointer py-2 appearance-none border-none bg-transparent p-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-primary leading-none">Sort By: {sortType.replace('-', ' ')}</span>
                    <ChevronDown data-icon="inline-start" className="size-3 opacity-40 group-hover:text-primary transition-all duration-300" />
                 </button>} />
                 <DropdownMenuContent align="start" className="w-56 rounded-xl border-none shadow-2xl p-2 bg-white">
                    <DropdownMenuGroup>
                       <DropdownMenuLabel className="font-sans text-[10px] uppercase tracking-widest opacity-40 px-3 py-2">Display Hierarchy</DropdownMenuLabel>
                       <DropdownMenuItem onClick={() => setSortType("newest")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Recently Added</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setSortType("name")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Alphabetical (A-Z)</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setSortType("price-asc")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Price: Low to High</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setSortType("price-desc")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Price: High to Low</DropdownMenuItem>
                    </DropdownMenuGroup>
                 </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                 <DropdownMenuTrigger render={<button className="flex items-center gap-3 group cursor-pointer py-2 md:border-l md:border-border/10 md:pl-8 appearance-none border-none bg-transparent p-0">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors duration-300 group-hover:text-primary leading-none">Filter: {categoryFilter}</span>
                    <ChevronDown data-icon="inline-start" className="size-3 opacity-40 group-hover:text-primary transition-all duration-300" />
                 </button>} />
                 <DropdownMenuContent align="start" className="w-56 rounded-xl border-none shadow-2xl p-2 bg-white">
                    <DropdownMenuGroup>
                       <DropdownMenuLabel className="font-sans text-[10px] uppercase tracking-widest opacity-40 px-3 py-2">Series Collection</DropdownMenuLabel>
                       <DropdownMenuItem onClick={() => setCategoryFilter("all")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">All Series</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setCategoryFilter("Accessories")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Accessories</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setCategoryFilter("Electronics")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Electronics</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setCategoryFilter("Home Decor")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Home Decor</DropdownMenuItem>
                       <DropdownMenuItem onClick={() => setCategoryFilter("Fashion")} className="p-3 cursor-pointer font-bold text-xs rounded-lg">Fashion</DropdownMenuItem>
                    </DropdownMenuGroup>
                 </DropdownMenuContent>
              </DropdownMenu>
           </div>

           <div className="flex items-center gap-4 py-2 mt-4 md:mt-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">Syncing with Mainframe...</span>
              <Button onClick={handleExport} variant="ghost" className="gap-2 text-[10px] font-bold uppercase tracking-widest hover:bg-transparent px-0 ml-4 group">
                 <Download data-icon="inline-start" className="size-3 opacity-60 group-hover:text-primary transition-colors" /> <span className="group-hover:text-primary transition-colors">Export Gallery</span>
              </Button>
           </div>
        </section>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
           <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl">
              <DialogHeader>
                 <DialogTitle className="text-2xl font-sans font-extrabold">Edit Identity Record</DialogTitle>
                 <DialogDescription>Refine product profile for the primary catalog index.</DialogDescription>
              </DialogHeader>
              {activeProduct && (
                <div className="grid gap-6 py-6 border-y border-border/10 my-2">
                   <div className="grid gap-2">
                      <Label htmlFor="edit-name" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Architectural Name</Label>
                      <Input 
                         id="edit-name" 
                         value={activeProduct.name} 
                         onChange={e => setActiveProduct({...activeProduct, name: e.target.value})}
                         className="h-12 bg-surface-low border-none rounded-xl font-bold"
                      />
                   </div>
                   <div className="grid gap-2">
                      <Label htmlFor="edit-sku" className="text-[10px] uppercase font-bold tracking-widest opacity-40">SKU Reference (Immutable)</Label>
                      <Input 
                         id="edit-sku" 
                         value={activeProduct.sku} 
                         disabled 
                         className="h-12 bg-zinc-100 border-none rounded-xl font-bold opacity-60 cursor-not-allowed"
                      />
                   </div>
                   <div className="grid gap-2">
                      <Label htmlFor="edit-image" className="text-[10px] uppercase font-bold tracking-widest opacity-40">High-Res Image URL</Label>
                      <Input 
                         id="edit-image" 
                         value={activeProduct.image} 
                         onChange={e => setActiveProduct({...activeProduct, image: e.target.value})}
                         className="h-12 bg-surface-low border-none rounded-xl font-bold"
                      />
                   </div>
                   <div className="grid gap-2">
                      <Label htmlFor="edit-description" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Asset Description</Label>
                      <textarea 
                        id="edit-description" 
                        value={activeProduct.description || ""} 
                        onChange={e => setActiveProduct({...activeProduct, description: e.target.value})} 
                        className="min-h-[120px] w-full bg-surface-low border-none rounded-xl font-medium p-4 text-sm focus-visible:ring-1 focus-visible:ring-primary/20"
                      />
                   </div>
                   <div className="grid gap-2">
                      <Label htmlFor="edit-tags" className="text-[10px] uppercase font-bold tracking-widest opacity-40">Architectural Tags (Comma separated)</Label>
                      <Input 
                         id="edit-tags" 
                         value={activeProduct.tags?.join(", ")} 
                         onChange={e => {
                            const tags = e.target.value.split(",").map(t => t.trim()).filter(t => t !== "")
                            setActiveProduct({...activeProduct, tags})
                         }}
                         className="h-12 bg-surface-low border-none rounded-xl font-bold"
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="grid gap-2">
                         <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">System Status</Label>
                         <Select onValueChange={v => setActiveProduct({...activeProduct, status: v as any})} value={activeProduct.status}>
                            <SelectTrigger className="h-12 bg-surface-low border-none rounded-xl font-bold">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="Published">Published</SelectItem>
                               <SelectItem value="Draft">Draft</SelectItem>
                               <SelectItem value="Archived">Archived</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="grid gap-2">
                         <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Unit Price</Label>
                         <Input 
                            value={activeProduct.price} 
                            onChange={e => {
                               const val = e.target.value.replace(/[^0-9.]/g, '')
                               setActiveProduct({...activeProduct, price: `$${val}`, priceValue: parseFloat(val) || 0})
                            }}
                            className="h-12 bg-surface-low border-none rounded-xl font-bold"
                         />
                      </div>
                   </div>
                </div>
              )}
              <DialogFooter>
                 <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="h-12 rounded-xl font-bold">Discard Changes</Button>
                 <Button onClick={handleUpdateProduct} className="h-12 rounded-xl font-bold bg-primary px-8">Sync Identity</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>

        <section className="flex flex-col gap-10 mt-4">
           <ProductCatalogGrid 
              products={filteredProducts} 
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onEdit={(p) => {
                 setActiveProduct(p)
                 setIsEditDialogOpen(true)
              }}
           />
        </section>
      </div>
    </DashboardLayout>
  )
}
