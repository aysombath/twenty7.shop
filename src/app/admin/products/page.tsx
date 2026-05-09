"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Search, SlidersHorizontal, LayoutGrid, MoreVertical,
  Pencil, Eye, DollarSign, RefreshCcw, Trash, CheckCircle,
  XCircle, ChevronLeft, ChevronRight, ArrowUpDown, FileDown, UploadCloud,
  ChevronDown
} from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, getExpandedRowModel, flexRender,
  createColumnHelper, SortingState, VisibilityState, ExpandedState
} from "@tanstack/react-table"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Data Model ────────────────────────────────────────────────────────────────
type Product = {
  id: string
  name: string
  brand: string
  brandId: string
  category: string
  categoryId: string
  price: number
  sku: string
  quantity: number
  visible: boolean
  image: string
  variants: any[]
}

// ─── Fetcher ───────────────────────────────────────────────────────────────────
const fetchProducts = async (): Promise<Product[]> => {
  const res = await fetch('/api/products')
  const pJson = await res.json()
  if (!pJson.success) throw new Error(pJson.error || "Failed to fetch products")

  return pJson.data.map((p: any) => ({
    id: p.id.toString(),
    name: p.name,
    brand: p.brand_name || (p.brand_id ? 'Unknown Brand' : 'None'),
    brandId: p.brand_id ? String(p.brand_id) : '',
    category: p.category_name || (p.category ? 'Unknown Category' : 'None'),
    categoryId: p.category || '',
    price: parseFloat(p.price) || 0,
    sku: p.sku || 'N/A',
    quantity: p.stock || 0,
    visible: p.status === 'Active',
    image: (p.image_url && p.image_url.trim() !== "") ? p.image_url : `https://images.unsplash.com/photo-1523275335684?auto=format&fit=crop&w=40&h=40&q=80`,
    variants: Array.isArray(p.variants) ? p.variants : [],
  }))
}

// ─── Sub-components ────────────────────────────────────────────────────────────
const StatsCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{value}</h3>
    </div>
    <div className="size-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-50">
      <Icon className="size-6" />
    </div>
  </div>
)

const columnHelper = createColumnHelper<Product>()

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = React.useState<ExpandedState>({})
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })

  // ── Mutations ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Delete failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Product deleted.")
    },
    onError: (e: any) => toast.error("Delete failed", { description: e.message }),
  })

  const updateMutation = useMutation({
    mutationFn: async (p: Product) => {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          name: p.name,
          category: p.categoryId,
          price: p.price,
          stock: p.quantity,
          status: p.visible ? 'Active' : 'Hidden',
          sku: p.sku,
          brand_id: p.brandId || null,
          tags: [],
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Update failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Product updated.")
    },
    onError: (e: any) => toast.error("Update failed", { description: e.message }),
  })

  // ── Import Mutation ─────────────────────────────────────────────────────────
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = React.useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
    // Use FileReader for generic array buffer
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows: any[] = XLSX.utils.sheet_to_json(sheet)
        
        if (rows.length === 0) {
          toast.error("File is empty", { id: "import-toast" })
          setIsImporting(false)
          return
        }
        
        toast.loading(`Importing ${rows.length} product(s)...`, { id: "import-toast" })
        
        let successCount = 0
        let errors = 0
        
        // Batch upload
        await Promise.allSettled(rows.map(async (row) => {
           const res = await fetch('/api/products', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               name: row.Name || row.name || 'Untitled Product',
               category: row.Category || row.category || 'Uncategorized',
               price: parseFloat(row.Price || row.price || 0),
               sku: row.SKU || row.sku || '',
               stock: parseInt(row.Stock || row.stock || row.Quantity || row.quantity || 0),
               description: row.Description || row.description || '',
               image_url: row.Image || row.image_url || null,
               status: row.Status || row.status || 'Active'
             })
           })
           const j = await res.json()
           if (j.success) successCount++
           else errors++
        }))

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} products. ${errors > 0 ? `(${errors} failed)` : ''}`, { id: "import-toast" })
          queryClient.invalidateQueries({ queryKey: ['products'] })
        } else {
           toast.error(`Import failed for all rows. Check format.`, { id: "import-toast" })
        }
      } catch (err) {
        toast.error("Failed to parse the file.", { id: "import-toast" })
      }
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    
    reader.readAsBinaryString(file)
  }

  const downloadTemplate = () => {
    const templateData = [{
      Name: "Example Product",
      Category: "Accessories",
      Price: 99.99,
      SKU: "EXP-001",
      Stock: 50,
      Description: "Premium material.",
      Status: "Active"
    }, {
      Name: "Basic T-Shirt",
      Category: "Apparel",
      Price: 19.99,
      SKU: "APP-TS-01",
      Stock: 100,
      Description: "Comfortable cotton tee.",
      Status: "Active"
    }]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    XLSX.writeFile(wb, "products_import_template.xlsx")
  }

  // ── Stats ────────────────────────────────────────────────────────────────────
  const stats = {
    total: products.length,
    inventory: products.reduce((acc, p) => acc + Number(p.quantity), 0),
    avg: products.reduce((acc, p) => acc + Number(p.price), 0) / (products.length || 1),
  }

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = React.useMemo(() => [
    columnHelper.display({
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        return row.getCanExpand() ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
            className="flex items-center justify-center size-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4 opacity-100 text-blue-500" />
            ) : (
              <ChevronRight className="size-4 opacity-40 group-hover:opacity-100" />
            )}
          </button>
        ) : null;
      },
    }),
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={v => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={v => row.toggleSelected(!!v)}
          onClick={e => e.stopPropagation()}
        />
      ),
      enableHiding: false,
    }),
    columnHelper.accessor('image', {
      id: 'image',
      header: 'Image',
      cell: info => (
        <img
          src={info.getValue()}
          alt={info.row.original.name}
          className="size-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700"
        />
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
          Name <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => <span className="text-sm font-black text-gray-900 dark:text-white">{info.getValue()}</span>,
    }),
    columnHelper.accessor('brand', {
      id: 'brand',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
          Brand <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('category', {
      id: 'category',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
          Category <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{info.getValue()}</span>,
    }),
    columnHelper.accessor('visible', {
      id: 'visibility',
      header: () => <div className="text-center">Visibility</div>,
      cell: info => (
        <div className="flex justify-center">
          {info.getValue() ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-rose-500" />}
        </div>
      ),
    }),
    columnHelper.accessor('price', {
      id: 'price',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
          Price <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => <span className="text-sm font-black text-gray-900 dark:text-white">${parseFloat(String(info.getValue() ?? 0)).toFixed(2)}</span>,
    }),
    columnHelper.accessor('sku', {
      id: 'sku',
      header: 'SKU',
      cell: info => <span className="text-xs font-mono font-bold opacity-40">{info.getValue()}</span>,
    }),
    columnHelper.accessor('quantity', {
      id: 'quantity',
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 dark:hover:text-white transition-colors">
          Quantity <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => <span className="text-sm font-bold text-gray-500 dark:text-gray-400 tabular-nums">{info.getValue() as number}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const prod = row.original
        return (
          <div className="text-right" onClick={e => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
                  <MoreVertical className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl shadow-xl p-1.5 z-50">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => window.location.href = `/admin/products/${prod.id}/edit`} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-bold">
                    <Pencil className="size-3.5 opacity-60" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-bold">
                    <Eye className="size-3.5 opacity-60" /> Show
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateMutation.mutate({ ...prod, price: Number(prod.price) + 10 })} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-bold text-orange-600 dark:text-orange-400">
                    <DollarSign className="size-3.5" /> Adjust price (+$10)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateMutation.mutate({ ...prod, quantity: Number(prod.quantity) + 50 })} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-bold">
                    <RefreshCcw className="size-3.5 opacity-60" /> Adjust stock (+50)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 my-1" />
                  <DropdownMenuItem
                    onClick={() => { if (confirm("Delete this product?")) deleteMutation.mutate(prod.id) }}
                    className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950 text-sm font-bold text-rose-600 dark:text-rose-400"
                  >
                    <Trash className="size-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableHiding: false,
    }),
  ], [updateMutation, deleteMutation])

  // ── Table ────────────────────────────────────────────────────────────────────
  const table = useReactTable({
    data: products,
    columns,
    state: { globalFilter, sorting, columnVisibility, rowSelection, expanded },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => row.original.variants.length > 0,
    enableRowSelection: true,
  })

  const selectedCount = Object.keys(rowSelection).length

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10 font-sans">

        {/* Breadcrumb & Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
              <span>Products</span>
              <span className="opacity-30">/</span>
              <span className="text-gray-900 dark:text-white">List</span>
            </nav>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Products</h1>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            
            <Button onClick={downloadTemplate} variant="outline" className="h-11 px-4 rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 gap-2 font-bold text-xs uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all">
              <FileDown className="size-4" /> Template
            </Button>
            
            <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="h-11 px-4 rounded-lg bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40 gap-2 font-black text-xs uppercase tracking-widest transition-all">
              <UploadCloud className="size-4" /> Import Excel
            </Button>
            
            <Link href="/admin/products/create">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-6 rounded-lg gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest">
                <Plus className="size-4" /> New product
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard label="Total Products" value={stats.total} icon={MoreVertical} />
          <StatsCard label="Product Inventory" value={stats.inventory.toLocaleString()} icon={Plus} />
          <StatsCard label="Average Price" value={`$${stats.avg.toFixed(2)}`} icon={DollarSign} />
        </div>

        {/* Table container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {selectedCount > 0 && (
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-none font-bold rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-widest animate-in fade-in zoom-in-95">
                  {selectedCount} selected for action
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search"
                  value={globalFilter ?? ""}
                  onChange={e => table.setGlobalFilter(e.target.value)}
                  className="pl-10 h-10 w-full md:w-64 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold"
                />
              </div>

              {/* Column Visibility Toggle */}
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="icon" className="h-10 w-10 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <SlidersHorizontal className="size-4 text-gray-400" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl z-50">
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Toggle Columns</div>
                  {table.getAllLeafColumns().filter(col => col.getCanHide()).map(column => (
                    <div
                      key={column.id}
                      className="flex items-center gap-3 w-full p-2 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer rounded-lg"
                      onClick={() => column.toggleVisibility()}
                    >
                      <Checkbox checked={column.getIsVisible()} onCheckedChange={() => column.toggleVisibility()} />
                      <span className="text-sm font-bold capitalize select-none">{column.id}</span>
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="icon" className="h-10 w-10 border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <LayoutGrid className="size-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="size-4 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="size-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                    <div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded" />
                    <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded ml-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          className={cn(
                            "py-4 px-3 pl-6 first:pl-6 last:pr-6 whitespace-nowrap text-[9px] md:text-[10px] font-black uppercase tracking-widest text-gray-500 text-left",
                            header.id === 'sku' && "hidden lg:table-cell",
                            header.id === 'category' && "hidden md:table-cell",
                            header.id === 'quantity' && "hidden sm:table-cell",
                            header.id === 'status' && "hidden xl:table-cell"
                          )}
                        >
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">
                        No matching assets in the vault registry
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map(row => (
                      <React.Fragment key={row.id}>
                        <tr
                          onClick={() => router.push(`/admin/products/${row.original.id}/edit`)}
                          className={cn(
                            "group transition-all hover:bg-gray-50/80 dark:hover:bg-gray-800 select-none cursor-pointer",
                            row.getIsSelected() && "bg-blue-50/30 dark:bg-blue-900/10",
                            row.getIsExpanded() && "bg-blue-50/10 dark:bg-blue-900/5 border-b-transparent"
                          )}
                        >
                          {row.getVisibleCells().map(cell => (
                            <td 
                              key={cell.id} 
                              className={cn(
                                "py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle",
                                cell.column.id === 'expander' && "w-10 pr-0",
                                cell.column.id === 'select' && "w-10 px-0"
                              )}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                        {row.getIsExpanded() && (
                          <tr className="bg-gray-50/30 dark:bg-gray-950/30 border-b border-gray-100 dark:border-gray-800/50">
                            <td colSpan={columns.length} className="p-0">
                              <div className="py-2 px-6 ml-14 border-l-2 border-blue-500/30 animate-in slide-in-from-top-1 duration-200">
                                <div className="space-y-1">
                                  <div className="grid grid-cols-12 gap-4 py-2 px-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                                    <div className="col-span-5">Variant Attribute</div>
                                    <div className="col-span-2">SKU</div>
                                    <div className="col-span-2">Price</div>
                                    <div className="col-span-2 text-right">Stock</div>
                                  </div>
                                  {row.original.variants.map((v: any, idx: number) => (
                                    <div key={idx} className="grid grid-cols-12 gap-4 py-3 px-4 rounded-xl hover:bg-white dark:hover:bg-gray-900 transition-colors items-center group/variant">
                                      <div className="col-span-5 flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700">
                                          <img src={v.image_url || row.original.image} className="size-full object-cover" />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{v.name}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-[10px] font-mono font-bold opacity-40">{v.sku}</span>
                                      </div>
                                      <div className="col-span-2">
                                        <span className="text-xs font-black text-gray-900 dark:text-white">${parseFloat(String(v.price || 0)).toFixed(2)}</span>
                                      </div>
                                      <div className="col-span-2 text-right">
                                        <span className={cn(
                                          "text-xs font-bold tabular-nums",
                                          Number(v.stock) <= 5 ? "text-rose-500" : "text-emerald-500"
                                        )}>
                                          {v.stock}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Showing {table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} results
            </span>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Per page</span>
                <Select value={table.getState().pagination.pageSize.toString()} onValueChange={v => table.setPageSize(Number(v))}>
                  <SelectTrigger className="h-9 w-20 bg-gray-50 dark:bg-gray-800 border-none font-bold text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} variant="ghost" size="icon" className="h-9 w-9 rounded-xl opacity-30 hover:opacity-100 disabled:cursor-not-allowed">
                  <ChevronLeft className="size-4" />
                </Button>
                {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                  let pageIdx = i
                  if (table.getState().pagination.pageIndex > 2) {
                    pageIdx = table.getState().pagination.pageIndex - 2 + i
                  }
                  if (pageIdx >= table.getPageCount()) return null
                  return (
                    <Button
                      key={pageIdx}
                      onClick={() => table.setPageIndex(pageIdx)}
                      variant={pageIdx === table.getState().pagination.pageIndex ? "secondary" : "ghost"}
                      className={cn(
                        "h-9 w-9 rounded-xl font-bold text-xs transition-all",
                        pageIdx === table.getState().pagination.pageIndex
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      )}
                    >
                      {pageIdx + 1}
                    </Button>
                  )
                })}
                <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
