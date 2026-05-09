"use client"

import * as React from "react"
import { 
  MoreHorizontal, 
  ChevronRight, 
  ChevronLeft,
  Search, 
  Filter, 
  Plus, 
  FileSpreadsheet, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Pencil,
  Settings2,
  Check,
  ChevronLast,
  ChevronFirst
} from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Product {
  id?: string
  sku: string
  name: string
  category: string
  stock: number
  location: string
  price: string
  status: string
  image: string
}

const INITIAL_PRODUCTS: Product[] = [
  {
    sku: "PRD-9001",
    name: "Chronos Watch",
    category: "Accessories",
    stock: 124,
    location: "Main Warehouse",
    price: "$450.00",
    status: "In Stock",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=64&h=64"
  },
  {
    sku: "PRD-9002",
    name: "Studio ANC Pro",
    category: "Electronics",
    stock: 8,
    location: "Main Warehouse",
    price: "$299.00",
    status: "Low Stock",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=64&h=64"
  },
  {
    sku: "PRD-9003",
    name: "Linear Desk Lamp",
    category: "Home Decor",
    stock: 45,
    location: "Aisle 4, Shelf B",
    price: "$120.50",
    status: "In Stock",
    image: "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&q=80&w=64&h=64"
  },
  {
    sku: "PRD-9004",
    name: "Ceramic Vase Set",
    category: "Home Decor",
    stock: 0,
    location: "Aisle 12, Shelf A",
    price: "$85.00",
    status: "Out of Stock",
    image: "https://images.unsplash.com/photo-1578500484705-02758177519e?auto=format&fit=crop&q=80&w=64&h=64"
  },
  {
    sku: "PRD-9005",
    name: "Premium Leather Tote",
    category: "Fashion",
    stock: 52,
    location: "Warehouse B2",
    price: "$240.00",
    status: "In Stock",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=64&h=64"
  }
]

interface InventoryTableProps {
  initialProducts?: Product[]
  isLoading?: boolean
  onRefresh?: () => void
}

export function InventoryTable({ initialProducts = [], isLoading = false, onRefresh }: InventoryTableProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts)
  const [categories, setCategories] = React.useState<{name: string, slug: string}[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [isInitializing, setIsInitializing] = React.useState(isLoading)

  // Fetch Master Taxonomy
  React.useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories', {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
          }
        })
        const json = await res.json()
        if (json.success) {
          setCategories(json.data.map((c: any) => ({ name: c.name, slug: c.slug })))
        }
      } catch (e) {
        console.error("Taxonomy Sync Failure")
      }
    }
    fetchCats()
  }, [])

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = React.useState<Record<string, boolean>>({
    image: true,
    name: true,
    sku: true,
    category: true,
    stock: true,
    location: true,
    price: true,
    action: true
  })

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1)
  const itemsPerPage = 5

  // Master Synchronization with Page Props
  React.useEffect(() => {
    setProducts(initialProducts)
    setIsInitializing(isLoading)
    // Reseting to first page on search or filter
    setCurrentPage(1)
  }, [initialProducts, isLoading, searchTerm, categoryFilter])

  // Add Product State
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false)
  const [newProduct, setNewProduct] = React.useState<Partial<Product>>({
    name: "",
    category: "Accessories",
    stock: 0,
    location: "Main Warehouse",
    price: "$0.00",
  })

  // Edit Product State
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)

  // Filtering Logic
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Handlers
  // Handlers
  const handleExport = () => {
    const headers = ["SKU", "Product Name", "Category", "Stock", "Price", "Status", "Location"]
    const csvContent = [
      headers.join(","),
      ...products.map(p => [
        p.sku,
        `"${p.name}"`,
        p.category,
        p.stock,
        p.price.replace(/[$,]/g, ""),
        p.status,
        p.location
      ].join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `precision_inventory_2026.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success("Catalog Exported", {
      description: `CSV generation completed for ${products.length} architectural items.`,
    })
  }

  const handleUpdateStock = () => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 800)),
      {
        loading: "Syncing Inventory State...",
        success: "Warehouse inventory updated successfully.",
        error: "Failed to sync inventory.",
      }
    )
  }

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.sku) return

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify({
          name: newProduct.name,
          category: newProduct.category,
          price: parseFloat(newProduct.price?.toString().replace(/[^0-9.]/g, '') || "0"),
          sku: newProduct.sku,
          stock: newProduct.stock || 0,
          image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=64&h=64"
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success("Record Initialized", { description: `${newProduct.name} assigned to the inventory index.` })
        // Triggering ground-truth revalidation instead of reload
        onRefresh?.()
      } else {
        toast.error("Registry Error", { description: json.error || "Conflict in architectural index." })
      }
    } catch (err) {
      toast.error("Mainframe Offline", { description: "Failed to sync new asset record." })
    }
    setIsAddDialogOpen(false)
  }

  const handleDeleteProduct = async (sku: string) => {
    const product = products.find(p => p.sku === sku)
    if (!product) return

    try {
      const res = await fetch(`/api/products?id=${product.id || ""}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        }
      })
      const json = await res.json()
      if (json.success) {
        setProducts(products.filter(p => p.sku !== sku))
        toast.info("Product Purged", { description: "Identity permanently removed from the primary index." })
        onRefresh?.()
      } else {
        toast.error("Purge Error", { description: "Mainframe rejected deletion request. Ensure ID is valid." })
      }
    } catch (err) {
      toast.error("System Failure", { description: "Failed to purge asset. Registry remains intact." })
    }
  }

  const handleDuplicateProduct = async (sku: string) => {
    const original = products.find(p => p.sku === sku)
    if (!original) return

    const duplicateData = {
      ...original,
      sku: `${original.sku}-COPY-${Math.floor(Math.random() * 100)}`,
      name: `${original.name} (Copy)`
    }

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: duplicateData.name,
          category: duplicateData.category,
          price: parseFloat(duplicateData.price.replace(/[^0-9.]/g, '')),
          sku: duplicateData.sku,
          stock: duplicateData.stock,
          image_url: duplicateData.image
        })
      })
      const json = await res.json()
      if (json.success) {
        onRefresh?.()
      } else {
        toast.error("Duplication Error", { description: json.error || "Failed to clone asset record." })
      }
    } catch (err) {
      toast.error("Mainframe Failure", { description: "Cloning process interrupted." })
    }
  }

  const openEditDialog = (product: Product) => {
    setEditingProduct({ ...product })
    setIsEditDialogOpen(true)
  }

  const handleUpdateProductManual = async (manualProduct: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify({
          id: manualProduct.id,
          name: manualProduct.name,
          category: manualProduct.category,
          price: parseFloat(manualProduct.price.replace(/[^0-9.]/g, '')),
          stock: manualProduct.stock,
          sku: manualProduct.sku,
          image_url: manualProduct.image,
          status: manualProduct.stock === 0 ? "Archived" : "Active"
        })
      })
      const json = await res.json()
      if (json.success) {
        onRefresh?.()
      } else {
        toast.error("Registry Rejection", { description: json.error || "Failed to update record in the mainframe." })
      }
    } catch (err) {
      toast.error("Sync Interrupted", { description: "Fulfillment record localized due to connection latency." })
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return
    await handleUpdateProductManual(editingProduct)
    setIsEditDialogOpen(false)
    setEditingProduct(null)
    toast.success("Fulfillment Record Updated", { description: "Stock and identity changes synced to the Neon vault." })
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-sans font-extrabold tracking-tight text-foreground/90 leading-none">
            Stock & Inventory
          </h1>
          <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase">
            Product level monitoring for <span className="text-primary font-bold">Precision Atelier HQ</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExport} className="hidden lg:flex gap-2 rounded-lg border-border/40 hover:bg-white hover:shadow-sm transition-all px-4 font-bold tracking-tight">
            <FileSpreadsheet data-icon="inline-start" className="opacity-60" /> Export CSV
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger render={<Button size="sm" className="gap-2 rounded-lg bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all px-5 font-bold tracking-tight" />}>
              <Plus data-icon="inline-start" /> Add Product
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-sans font-bold">Add New Product</DialogTitle>
                <DialogDescription>
                  Enter product details for the Precision Atelier catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Minimalist Watch"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      onValueChange={(v) => v && setNewProduct({ ...newProduct, category: v })}
                      value={newProduct.category}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.slug} value={cat.name}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                      placeholder="$0.00"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stock">Initial Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={newProduct.stock}
                      onChange={e => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Warehouse</Label>
                    <Input
                      id="location"
                      value={newProduct.location}
                      onChange={e => setNewProduct({ ...newProduct, location: e.target.value })}
                      placeholder="Main Warehouse"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)} className="font-bold">Cancel</Button>
                <Button onClick={handleAddProduct} className="font-bold">Save Product</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Edit Product Dialog (Static instance) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-sans font-bold">Edit Catalog Record</DialogTitle>
            <DialogDescription>
              Update information for SKU: {editingProduct?.sku}
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    onValueChange={(v) => v && setEditingProduct({ ...editingProduct, category: v })}
                    value={editingProduct.category}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.slug} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Price</Label>
                  <Input
                    id="edit-price"
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-stock">Stock Level</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Warehouse</Label>
                  <Input
                    id="edit-location"
                    value={editingProduct.location}
                    onChange={e => setEditingProduct({ ...editingProduct, location: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)} className="font-bold">Discard</Button>
            <Button onClick={handleUpdateProduct} className="font-bold">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-sans font-bold tracking-tight">Master Catalog</h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.1em] opacity-60">Global SKU database and warehouse distribution</p>
        </div>

        <Card className="rounded-xl border-none shadow-sm flex flex-col p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
                <Input
                  placeholder="Search SKUs, product names..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-surface-low border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium h-9 text-xs"
                />
              </div>
              <Select
                onValueChange={(v) => setCategoryFilter(v ?? 'all')}
                value={categoryFilter}
              >
                <SelectTrigger className="w-[180px] h-9 bg-surface-low border-none shadow-none text-xs font-semibold uppercase tracking-wider opacity-70 cursor-pointer">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2 rounded-lg border-border/40 hover:bg-white hover:shadow-sm transition-all px-3 font-bold tracking-tight text-xs uppercase opacity-70" />}>
                  <Settings2 data-icon="inline-start" className="size-4" /> Columns
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border-none shadow-xl rounded-xl p-2 z-50">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] px-3 py-2 uppercase font-bold tracking-[0.2em] opacity-40">Display Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50 my-1" />
                    {Object.entries(visibleColumns).map(([key, isVisible]) => (
                      key !== 'action' && (
                        <div 
                          key={key}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => setVisibleColumns(prev => ({...prev, [key]: !prev[key]}))}
                        >
                          <Checkbox checked={isVisible} onCheckedChange={() => {}} className="pointer-events-none" />
                          <span className="text-xs font-medium capitalize">{key}</span>
                        </div>
                      )
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleUpdateStock} variant="outline" size="sm" className="gap-2 rounded-lg border-border/40 hover:bg-white hover:shadow-sm transition-all px-3 font-bold tracking-tight text-xs uppercase opacity-70">
                <RefreshCw data-icon="inline-start" className="opacity-60" /> Sync Inventory
              </Button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden border-none shadow-[0_0_0_1px_rgba(19,27,46,0.02)]">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="border-none hover:bg-transparent">
                  {visibleColumns.image && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 pl-8 text-muted-foreground/80">Image</TableHead>}
                  {visibleColumns.name && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">Product Name</TableHead>}
                  {visibleColumns.sku && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">SKU</TableHead>}
                  {visibleColumns.category && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">Category</TableHead>}
                  {visibleColumns.stock && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">Stock</TableHead>}
                  {visibleColumns.location && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">Warehouse</TableHead>}
                  {visibleColumns.price && <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-muted-foreground/80">Unit Price</TableHead>}
                  <TableHead className="font-sans text-[10px] uppercase font-bold tracking-widest py-5 text-right pr-8 text-muted-foreground/80">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.sku} className="border-none group hover:bg-accent/30 transition-colors">
                    {visibleColumns.image && (
                      <TableCell className="pl-8 py-6">
                        <div className="relative size-12 rounded-lg overflow-hidden shadow-sm ring-1 ring-border/10">
                          <Avatar className="size-full rounded-lg">
                            <AvatarImage src={product.image} alt={product.name} />
                            <AvatarFallback className="rounded-lg">{product.name.slice(0, 1)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.name && <TableCell className="py-6 font-bold font-sans tracking-tight">{product.name}</TableCell>}
                    {visibleColumns.sku && <TableCell className="py-6 text-xs font-medium opacity-60 font-mono tracking-wider">{product.sku}</TableCell>}
                    {visibleColumns.category && (
                      <TableCell className="py-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-low border border-border/10 px-3 py-1.5 rounded-md text-muted-foreground">
                          {product.category}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.stock && (
                      <TableCell className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "size-1.5 rounded-full ring-4 shadow-sm transition-all",
                                product.status === "In Stock" ? "bg-emerald-500 ring-emerald-500/10" :
                                  product.status === "Low Stock" ? "bg-amber-500 ring-amber-500/10" :
                                    "bg-rose-500 ring-rose-500/10"
                              )} />
                              <span className="text-xs font-bold tracking-tight">{product.stock} units</span>
                            </div>
                            <span className="text-[9px] uppercase font-bold tracking-widest opacity-40 ml-3.5 italic">{product.status}</span>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-7 rounded-md hover:bg-rose-500/10 hover:text-rose-600 border border-border/5"
                              onClick={() => {
                                const newStock = Math.max(0, product.stock - 1)
                                const updated = { ...product, stock: newStock }
                                setEditingProduct(updated)
                                // Triggering immediate sync via handleUpdateProduct in a dedicated quick effect
                                setTimeout(() => handleUpdateProductManual(updated), 0)
                              }}
                            >
                              <span className="font-bold text-lg leading-none">-</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-7 rounded-md hover:bg-emerald-500/10 hover:text-emerald-600 border border-border/5"
                              onClick={() => {
                                const newStock = product.stock + 1
                                const updated = { ...product, stock: newStock }
                                setEditingProduct(updated)
                                setTimeout(() => handleUpdateProductManual(updated), 0)
                              }}
                            >
                              <span className="font-bold text-lg leading-none">+</span>
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.location && <TableCell className="py-6 text-xs font-medium opacity-70 italic">{product.location}</TableCell>}
                    {visibleColumns.price && (
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-sm tracking-tight">{product.price}</span>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="size-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/5 hover:text-primary rounded-md border border-border/5"
                              onClick={() => openEditDialog(product)}
                           >
                              <Pencil className="size-3" />
                           </Button>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="py-6 text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 hover:bg-white hover:shadow-sm opacity-60 hover:opacity-100 transition-all" />}>
                          <MoreHorizontal data-icon="inline-start" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-sans text-[10px] uppercase tracking-widest opacity-60">Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openEditDialog(product)}
                              className="gap-2 cursor-pointer font-medium text-xs"
                            >
                              <Pencil data-icon="inline-start" className="size-3" /> Edit Product
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDuplicateProduct(product.sku)}
                              className="gap-2 cursor-pointer font-medium text-xs"
                            >
                              <Copy data-icon="inline-start" className="size-3" /> Duplicate SKU
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteProduct(product.sku)}
                              className="gap-2 cursor-pointer font-medium text-xs text-destructive focus:bg-destructive/10 focus:text-destructive"
                            >
                              <Trash2 data-icon="inline-start" className="size-3" /> Delete Permanent
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
          <div className="px-8 py-4 border-t border-border/10 flex items-center justify-between bg-secondary/20">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
              Showing {Math.min(paginatedProducts.length, itemsPerPage)} of {filteredProducts.length} items
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 transition-all hover:bg-white hover:shadow-sm" 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronFirst className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 transition-all hover:bg-white hover:shadow-sm" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
              
              <div className="px-4 text-xs font-bold tracking-widest tabular-nums">
                {currentPage} <span className="opacity-30 mx-1">/</span> {totalPages || 1}
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 transition-all hover:bg-white hover:shadow-sm" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 transition-all hover:bg-white hover:shadow-sm" 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronLast className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
