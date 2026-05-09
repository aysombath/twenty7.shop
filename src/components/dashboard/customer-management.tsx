"use client"

import * as React from "react"
import {
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  ChevronRight,
  UserCircle,
  Activity,
  MapPin,
  RefreshCw,
  LayoutGrid,
  Settings2,
  ChevronFirst,
  ChevronLeft,
  ChevronLast,
  ArrowUpDown,
  Trash2,
  Plus,
  DollarSign,
  List,
  Pencil,
  Eye,
  Layers,
  Download,
  Hash,
  ArrowRight,
  UploadCloud,
  FileDown
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as XLSX from "xlsx"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import Link from "next/link"

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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface Customer {
  id: string
  name: string
  username?: string
  email: string
  phone?: string
  address?: string
  orders: number
  completed_orders?: number
  paid_invoices?: number
  totalSpent: string
  totalSpentValue: number
  status: string
  lastOrder: string
  avatar?: string
  role?: string
}

const columnHelper = createColumnHelper<Customer>()

export function CustomerManagement() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    select: true,
    username: true,
    role: true,
    status: true,
    orders: true,
    totalSpent: true,
  })

  // Custom row selection
  const [rowSelection, setRowSelection] = React.useState({})

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = React.useState(false)
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingClient, setEditingClient] = React.useState<Customer | null>(null)
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [historyCustomer, setHistoryCustomer] = React.useState<Customer | null>(null)

  const [newClient, setNewClient] = React.useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    status: "Active",
    role: "Client",
    password: ""
  })

  // ── Import/Template Logic ──────────────────────────────────────────────────
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = React.useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsImporting(true)
    
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
        
        toast.loading(`Importing ${rows.length} client(s)...`, { id: "import-toast" })
        
        let successCount = 0
        let errors = 0
        
        await Promise.allSettled(rows.map(async (row) => {
           const res = await fetch('/api/customers', {
             method: 'POST',
             headers: { 
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
             },
             body: JSON.stringify({
               name: row.Name || row.name || 'Untitled Client',
               email: row.Email || row.email || '',
               username: row.Username || row.username || '',
               phone: row.Phone || row.phone || '',
               address: row.Address || row.address || '',
               status: row.Status || row.status || 'Active',
               role: row.Role || row.role || 'Client'
             })
           })
           const j = await res.json()
           if (j.success) successCount++
           else errors++
        }))

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} clients. ${errors > 0 ? `(${errors} failed)` : ''}`, { id: "import-toast" })
          queryClient.invalidateQueries({ queryKey: ['customers'] })
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
      Name: "Marcus Aurelius",
      Email: "marcus@rome.com",
      Username: "emperor_01",
      Phone: "+123456789",
      Address: "Palatine Hill, Rome",
      Status: "VIP",
      Role: "Client"
    }, {
      Name: "Elena Gilbert",
      Email: "elena@mystic.com",
      Username: "doppelganger",
      Phone: "+987654321",
      Address: "Mystic Falls, VA",
      Status: "Active",
      Role: "Client"
    }]
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "ClientTemplate")
    XLSX.writeFile(wb, "clients_import_template.xlsx")
  }

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: customerData, isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const result = await response.json()
      if (!result.success) throw new Error(result.error)

      const mapped = result.data.map((c: any) => ({
        ...c,
        id: c.id.toString(),
        totalSpent: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.total_spent || 0),
        totalSpentValue: Number(c.total_spent || 0),
        lastOrder: c.last_order ? new Date(c.last_order).toLocaleDateString() : "Never"
      }))

      return {
        customers: mapped as Customer[],
        stats: result.stats || { total_customers: mapped.length, total_ltv: 0, active_count: mapped.length }
      }
    }
  })

  // ── History Intelligence ───────────────────────────────────────────────────
  const { data: historyOrders = [], isLoading: isLoadingHistoryOrders } = useQuery({
    queryKey: ["history-orders", historyCustomer?.name],
    queryFn: async () => {
      if (!historyCustomer) return [];
      const res = await fetch(`/api/orders?customer_name=${encodeURIComponent(historyCustomer.name)}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      });
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!historyCustomer && isHistoryOpen
  });

  const { data: historyInvoices = [], isLoading: isLoadingHistoryInvoices } = useQuery({
    queryKey: ["history-invoices", historyCustomer?.email],
    queryFn: async () => {
      if (!historyCustomer) return [];
      const res = await fetch(`/api/invoices?customer_email=${encodeURIComponent(historyCustomer.email)}`, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      });
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!historyCustomer && isHistoryOpen
  });

  const customers = customerData?.customers || []
  const stats = customerData?.stats || { total_customers: 0, total_ltv: 0, active_count: 0 }

  // ── Mutations ────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (client: typeof newClient) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify(client)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success("Client Registered", { description: "Master index updated." })
      setIsRegisterOpen(false)
      setNewClient({ name: "", username: "", email: "", phone: "", address: "", status: "Active", role: "Client", password: "" })
    },
    onError: (e: any) => toast.error("Error", { description: e.message })
  })

  const updateMutation = useMutation({
    mutationFn: async (client: any) => {
      const res = await fetch('/api/customers', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        },
        body: JSON.stringify(client)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success("Identity Synchronized", { description: "Master index updated." })
      setIsEditOpen(false)
    },
    onError: (e: any) => toast.error("Synchronization Failure", { description: e.message })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/customers?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      toast.success("Identity Purged")
    },
    onError: (e: any) => toast.error("Error", { description: e.message })
  })

  // ── Table definitions ────────────────────────────────────────────────────────
  const columns = React.useMemo(() => [
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
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-2 hover:text-gray-900 transition-colors">
          Client <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => (
        <div className="flex items-center gap-4 py-1">
          <Avatar className="size-10 rounded-lg border border-gray-100 shadow-sm">
            <AvatarImage src={info.row.original.avatar} />
            <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-[10px]">{info.getValue().substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-bold text-gray-900 leading-none mb-1">{info.getValue()}</span>
            <span className="text-[10px] text-gray-400 font-medium">{info.row.original.email}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('username', {
      header: 'System ID',
      cell: info => <span className="font-mono text-[10px] text-gray-400">{info.getValue() || "N/A"}</span>,
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: info => (
        <Badge variant="outline" className="text-[9px] px-2 h-5 uppercase tracking-tighter font-bold bg-gray-50/50 border-gray-100 text-gray-500">
          {info.getValue() || 'Client'}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Tier',
      cell: info => {
        const status = info.getValue()
        return (
          <Badge
            variant="secondary"
            className={cn(
              "rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase h-5 border-none",
              status === 'VIP' ? "bg-amber-50 text-amber-600" :
                status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                  "bg-gray-50 text-gray-400"
            )}
          >
            {status}
          </Badge>
        )
      },
    }),
    columnHelper.accessor('completed_orders', {
      header: 'Completed Orders',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-blue-50 flex items-center justify-center">
            <ShoppingBag className="size-3 text-blue-600" />
          </div>
          <span className="font-black text-xs text-gray-900">{info.getValue() || 0}</span>
        </div>
      ),
    }),
    columnHelper.accessor('paid_invoices', {
      header: 'Paid Invoices',
      cell: info => (
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-emerald-50 flex items-center justify-center">
            <CreditCard className="size-3 text-emerald-600" />
          </div>
          <span className="font-black text-xs text-gray-900">{info.getValue() || 0}</span>
        </div>
      ),
    }),
    columnHelper.accessor('totalSpentValue', {
      id: 'totalSpent',
      header: ({ column }) => (
        <div className="text-right">
          <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="inline-flex items-center gap-2 hover:text-gray-900 transition-colors">
            Spent <ArrowUpDown className="size-3" />
          </button>
        </div>
      ),
      cell: info => (
        <div className="text-right">
          <span className="font-black text-gray-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(info.getValue())}
          </span>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      cell: info => (
        <div className="flex justify-end pr-2" onClick={e => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="icon" className="size-8 hover:bg-gray-50 rounded-lg">
                <MoreHorizontal className="size-4 text-gray-400" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56 bg-white border-none shadow-2xl rounded-xl p-2 z-50">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-[10px] px-3 py-2 uppercase font-black opacity-30 tracking-widest">Management</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100 my-1 font-normal opacity-10" />
                <DropdownMenuItem className="rounded-lg py-2.5 px-3 cursor-pointer flex items-center gap-2 text-xs font-bold leading-none hover:bg-gray-50" onClick={() => { setHistoryCustomer(info.row.original); setIsHistoryOpen(true); }}>
                  <ShoppingBag className="size-4 opacity-40" />
                  <span>Purchase History</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="rounded-lg py-2.5 px-3 cursor-pointer flex items-center gap-2 text-xs font-bold leading-none hover:bg-gray-50" onClick={() => { setEditingClient(info.row.original); setIsEditOpen(true); }}>
                  <Pencil className="size-4 opacity-40" />
                  <span>Modify Identity</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-gray-100 my-1 font-normal opacity-10" />
              <DropdownMenuItem className="text-rose-500 focus:text-rose-600 rounded-lg py-2.5 px-3 cursor-pointer flex items-center gap-2 text-xs font-bold leading-none" onClick={() => { if (confirm("Permanently purge this record?")) deleteMutation.mutate(info.row.original.id); }}>
                <Trash2 className="size-4 opacity-40" />
                <span>Purge Client</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    })
  ], [deleteMutation, updateMutation])

  const table = useReactTable({
    data: customers,
    columns,
    state: { sorting, columnVisibility, globalFilter: searchTerm, rowSelection },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  // Hydration fix
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-8 font-sans">

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
            <span>Clients</span>
            <span className="opacity-30">/</span>
            <span className="text-foreground">Registry</span>
          </nav>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Client Relationships</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
          
          <Button onClick={downloadTemplate} variant="outline" className="h-11 px-4 rounded-xl bg-card border-border/50 text-muted-foreground gap-2 font-bold text-[10px] uppercase tracking-widest hover:border-primary hover:text-primary transition-all">
            <FileDown className="size-4" /> Template
          </Button>
          
          <Button onClick={() => fileInputRef.current?.click()} disabled={isImporting} variant="outline" className="h-11 px-4 rounded-xl bg-emerald-50/30 text-emerald-600 border-emerald-500/20 hover:bg-emerald-50 gap-2 font-black text-[10px] uppercase tracking-widest transition-all">
            <UploadCloud className="size-4" /> Import Excel
          </Button>

          <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
            <DialogTrigger render={
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold h-11 px-6 text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">
                <Plus className="size-4 mr-2" /> Enroll Client
              </Button>
            } />
            <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl p-8 bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Enroll Record</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Initialize a new relationship entry in the master ledger.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Legal Name</Label>
                  <Input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Architecture ID</Label>
                  <Input value={newClient.username} onChange={e => setNewClient({ ...newClient, username: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Primary Email</Label>
                  <Input value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Contact Link</Label>
                  <Input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
              </div>
              <DialogFooter className="gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsRegisterOpen(false)} className="h-12 rounded-xl font-bold text-gray-400 px-6">Cancel</Button>
                <Button onClick={() => createMutation.mutate(newClient)} className="h-12 rounded-xl font-bold bg-blue-600 px-10 text-white shadow-lg shadow-blue-500/20">Authorize</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ─── Modify Identity Dialog ────────────────────────────────────────────── */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl p-8 bg-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">Modify Identity</DialogTitle>
                <DialogDescription className="font-medium text-gray-400">Update the cryptographic and logistical identifiers for this node.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {editingClient && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Legal Name</Label>
                      <Input value={editingClient.name} onChange={e => editingClient && setEditingClient({ ...editingClient, name: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Architecture ID</Label>
                      <Input value={editingClient.username || ""} onChange={e => editingClient && setEditingClient({ ...editingClient, username: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Primary Email</Label>
                      <Input value={editingClient.email} onChange={e => editingClient && setEditingClient({ ...editingClient, email: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Contact Link</Label>
                      <Input value={editingClient.phone || ""} onChange={e => editingClient && setEditingClient({ ...editingClient, phone: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Logistics Primary Address</Label>
                      <Input value={editingClient.address || ""} onChange={e => editingClient && setEditingClient({ ...editingClient, address: e.target.value })} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Assigned Tier</Label>
                      <Select value={editingClient.status || "Active"} onValueChange={v => setEditingClient(prev => prev ? { ...prev, status: v as string } : null)}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none font-bold text-sm rounded-xl focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 font-bold">
                          <SelectItem value="Active" className="rounded-xl">Active Client</SelectItem>
                          <SelectItem value="VIP" className="rounded-xl">VIP Tier</SelectItem>
                          <SelectItem value="Suspended" className="rounded-xl text-rose-500">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">System Role</Label>
                      <Select value={editingClient.role || "Client"} onValueChange={v => setEditingClient(prev => prev ? { ...prev, role: v as string } : null)}>
                        <SelectTrigger className="h-12 bg-gray-50 border-none font-bold text-sm rounded-xl focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 font-bold">
                          <SelectItem value="Client" className="rounded-xl">Client Participant</SelectItem>
                          <SelectItem value="Staff" className="rounded-xl">Internal Staff</SelectItem>
                          <SelectItem value="Admin" className="rounded-xl">Executive Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter className="gap-2 pt-4">
                <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="h-12 rounded-xl font-bold text-gray-400 px-6">Cancel</Button>
                <Button onClick={() => updateMutation.mutate(editingClient)} className="h-12 rounded-xl font-bold bg-amber-600 px-10 text-white shadow-lg shadow-amber-500/20">Execute Update</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Customers", value: stats.total_customers.toString(), icon: UserCircle, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Customer LTV", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.total_ltv || 0), icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-500/10" },
          { label: "Active Customers", value: stats.active_count.toString(), icon: Activity, color: "text-blue-600", bg: "bg-blue-500/10" }
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-foreground tabular-nums">{stat.value}</h3>
            </div>
            <div className={cn("size-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("size-6 opacity-80", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Integrated Listing */}
      <div className="bg-card border border-border/50 p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm space-y-6 md:space-y-8">

        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
          <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1">
            <div className="relative group flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search master index..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-secondary/30 border-none rounded-2xl font-bold text-sm focus-visible:ring-primary/20 shadow-none"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v: string | null) => { 
                if (!v) return;
                setStatusFilter(v); 
                table.getColumn('status')?.setFilterValue(v === 'all' ? undefined : v); 
            }}>
              <SelectTrigger className="w-full md:w-56 h-12 bg-secondary/30 border-none rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground shadow-none">
                <Filter className="size-3 mr-2 opacity-50" />
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border/10 rounded-[20px] shadow-2xl p-2">
                <SelectItem value="all" className="font-bold text-[10px] uppercase tracking-widest rounded-xl">All Records</SelectItem>
                <SelectItem value="Active" className="font-bold text-[10px] uppercase tracking-widest text-emerald-600 rounded-xl">Active</SelectItem>
                <SelectItem value="VIP" className="font-bold text-[10px] uppercase tracking-widest text-amber-600 rounded-xl">VIP</SelectItem>
                <SelectItem value="Inactive" className="font-bold text-[10px] uppercase tracking-widest rounded-xl">Legacy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-none pt-4 md:pt-0">
            <div className="flex bg-secondary/30 rounded-2xl p-1.5">
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className={cn("size-9 rounded-xl transition-all", viewMode === "table" && "bg-background shadow-lg scale-110")}
              >
                <List className="size-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("cards")}
                className={cn("size-9 rounded-xl transition-all", viewMode === "cards" && "bg-background shadow-lg scale-110")}
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border-none text-muted-foreground">
                  <Settings2 className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-64 bg-popover border-border/10 shadow-3xl rounded-[24px] p-3 z-50">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[10px] px-4 py-3 uppercase font-black opacity-30 tracking-widest">Visibility Settings</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/10 my-2" />
                  {table.getAllLeafColumns().map(column => column.getCanHide() && (
                    <div key={column.id} className="flex items-center border-none gap-4 px-4 py-3 hover:bg-secondary/50 rounded-xl cursor-pointer transition-all" onClick={() => column.toggleVisibility()}>
                      <Checkbox checked={column.getIsVisible()} className="rounded-md data-[state=checked]:bg-primary border-border" />
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{column.id.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {viewMode === "table" ? (
          <div className="rounded-2xl border border-gray-50 dark:border-gray-800 overflow-x-auto">
            <Table>
              <TableHeader className="bg-secondary/20">
                {table.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id} className="border-none hover:bg-transparent">
                    {headerGroup.headers.map(header => (
                      <TableHead 
                        key={header.id} 
                        className={cn(
                          "h-10 md:h-14 px-3 md:px-8 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 whitespace-nowrap",
                          header.id === 'username' && "hidden md:table-cell",
                          header.id === 'role' && "hidden lg:table-cell",
                          header.id === 'status' && "hidden sm:table-cell",
                          header.id === 'completed_orders' && "hidden xl:table-cell",
                          header.id === 'paid_invoices' && "hidden 2xl:table-cell"
                        )}
                      >
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-72 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-10">
                        <RefreshCw className="size-10 animate-spin" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em]">Querying Engine...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-72 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-10">
                        <Layers className="size-10" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em]">Vault Uninitialized</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="group border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                    onClick={() => { setSelectedCustomer(row.original); setIsSheetOpen(true); }}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "px-3 md:px-8 h-auto py-3 md:py-6 first:rounded-l-xl last:rounded-r-xl",
                          cell.column.id === 'username' && "hidden md:table-cell",
                          cell.column.id === 'role' && "hidden lg:table-cell",
                          cell.column.id === 'status' && "hidden sm:table-cell",
                          cell.column.id === 'completed_orders' && "hidden xl:table-cell",
                          cell.column.id === 'paid_invoices' && "hidden 2xl:table-cell"
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[400px]">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-48 rounded-3xl bg-secondary/20 animate-pulse" />
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="col-span-full h-72 flex flex-col items-center justify-center opacity-10 gap-4">
                <Layers className="size-10" />
                <span className="text-[10px] uppercase font-black tracking-[0.3em]">Vault Uninitialized</span>
              </div>
            ) : table.getRowModel().rows.map(row => {
               const client = row.original
               return (
                <Card 
                  key={client.id} 
                  className="rounded-[32px] border-none shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all cursor-pointer bg-card overflow-hidden group p-1"
                  onClick={() => { setSelectedCustomer(client); setIsSheetOpen(true); }}
                >
                  <CardContent className="p-6 flex flex-col h-full gap-4">
                    <div className="flex justify-between items-start">
                      <Avatar className="size-14 rounded-2xl border-2 border-background shadow-lg ring-1 ring-primary/5">
                        <AvatarImage src={client.avatar} />
                        <AvatarFallback className="bg-primary/5 text-primary text-lg font-black">{client.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase border-none",
                          client.status === 'VIP' ? "bg-amber-50 text-amber-600" :
                          client.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                          "bg-gray-50 text-gray-400"
                        )}
                      >
                        {client.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-black text-lg tracking-tight truncate group-hover:text-primary transition-colors">{client.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-bold tracking-tight opacity-60 truncate">{client.email}</p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-border/5">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/40 leading-none mb-1">Spent</span>
                        <span className="text-xs font-black text-foreground/80">{client.totalSpent}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase font-black tracking-widest text-muted-foreground/40 leading-none mb-1">Orders</span>
                        <span className="text-xs font-black text-foreground/80">{client.completed_orders || 0} items</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
               )
            })}
          </div>
        )}

        {/* Pagination */}
        <div className="p-6 border-t border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
            Showing {table.getFilteredRowModel().rows.length === 0 ? 0 : table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} of {table.getFilteredRowModel().rows.length} results
          </span>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Per page</span>
              <Select value={table.getState().pagination.pageSize.toString()} onValueChange={v => table.setPageSize(Number(v))}>
                <SelectTrigger className="h-10 w-20 bg-secondary/20 border-none font-bold text-xs rounded-xl shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/10 rounded-xl shadow-2xl">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} variant="ghost" size="icon" className="h-10 w-10 rounded-xl opacity-30 hover:opacity-100 disabled:cursor-not-allowed">
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
                      "h-10 w-10 rounded-xl font-bold text-xs transition-all",
                      pageIdx === table.getState().pagination.pageIndex
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {pageIdx + 1}
                  </Button>
                )
              })}
              <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Details Profile Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="bg-background border-none shadow-2xl sm:max-w-xl p-0 overflow-y-auto w-full sm:w-[540px]">
          {selectedCustomer && (
            <div className="flex flex-col h-full bg-secondary/5">
              <div className="bg-card p-6 md:p-12 space-y-6 md:space-y-10 shadow-sm border-b border-border/10">
                <SheetHeader className="flex flex-col sm:flex-row items-center gap-4 md:gap-8 text-center sm:text-left">
                  <Avatar className="size-20 md:size-24 rounded-2xl md:rounded-[32px] border-4 border-background shadow-xl ring-1 ring-primary/10">
                    <AvatarImage src={selectedCustomer.avatar} />
                    <AvatarFallback className="bg-primary/5 text-primary text-2xl md:text-3xl font-black">{selectedCustomer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1 md:space-y-2">
                    <Badge variant="outline" className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-40 rounded-full">{selectedCustomer.status} Hierarchy</Badge>
                    <SheetTitle className="text-2xl md:text-4xl font-black tracking-tighter leading-none">{selectedCustomer.name}</SheetTitle>
                    <SheetDescription className="font-bold text-muted-foreground tracking-tight text-sm md:text-base">{selectedCustomer.email}</SheetDescription>
                  </div>
                </SheetHeader>

                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-300 mb-1 leading-none text-center">LTV Portfolio</p>
                    <p className="text-xl font-black text-center tracking-tight">{selectedCustomer?.totalSpent}</p>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100 flex flex-col items-center justify-center">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-300 mb-2 leading-none text-center">Master Activity</p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-blue-600">{selectedCustomer?.completed_orders || 0}</span>
                        <span className="text-[8px] uppercase font-bold opacity-30">Orders</span>
                      </div>
                      <div className="w-px h-6 bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-emerald-600">{selectedCustomer?.paid_invoices || 0}</span>
                        <span className="text-[8px] uppercase font-bold opacity-30">Paid</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
                    <p className="text-[9px] uppercase font-black tracking-widest text-gray-300 mb-1 leading-none text-center">Last Pulse</p>
                    <p className="text-[10px] font-black pt-1 uppercase tracking-tighter text-gray-500 text-center">{selectedCustomer?.lastOrder}</p>
                  </div>
                </div>
              </div>

                <div className="p-6 md:p-12 space-y-8 md:space-y-12">
                <section className="space-y-4 md:space-y-6">
                  <h4 className="text-[9px] md:text-[10px] uppercase font-black tracking-[0.3em] text-muted-foreground/40 flex items-center">
                    <span className="w-8 md:w-12 h-px bg-border/20 mr-3 md:mr-5" /> Identity Attributes
                  </h4>
                  <div className="grid gap-3 md:gap-4">
                    {[
                      { icon: Hash, label: "Registry Identity", val: selectedCustomer?.username || "restricted_profile" },
                      { icon: Phone, label: "Direct Comm Line", val: selectedCustomer?.phone || "Unlisted" },
                      { icon: MapPin, label: "Physical Locus", val: selectedCustomer?.address || "Global Remote" }
                    ].map((row, idx) => (
                      <div key={idx} className="flex items-center gap-4 md:gap-6 bg-card p-4 md:p-6 rounded-2xl md:rounded-[24px] shadow-sm border border-border/5 hover:shadow-md transition-all">
                        <div className="size-10 md:size-14 rounded-xl md:rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                          <row.icon className="size-5 md:size-6" />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-[8px] md:text-[9px] uppercase font-black tracking-widest text-muted-foreground/30 leading-none">{row.label}</p>
                          <p className="text-xs md:text-sm font-bold text-foreground/70 tracking-tight leading-relaxed truncate">{row.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-2">
                  <Button size="lg" className="w-full h-12 md:h-16 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl md:rounded-[24px] font-black text-[11px] md:text-[12px] uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-3 group">
                    Initialize Synthesis
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* ─── Modify Identity Dialog ────────────────────────────────────────────── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl border-none shadow-2xl p-8 bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Modify Identity</DialogTitle>
            <DialogDescription className="font-medium text-gray-400">Update the cryptographic and logistical identifiers for this node.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {editingClient && (
              <>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Legal Name</Label>
                  <Input value={editingClient?.name || ""} onChange={e => setEditingClient(prev => prev ? { ...prev, name: e.target.value } : null)} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Architecture ID</Label>
                  <Input value={editingClient?.username || ""} onChange={e => setEditingClient(prev => prev ? { ...prev, username: e.target.value } : null)} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Primary Email</Label>
                  <Input value={editingClient?.email || ""} onChange={e => setEditingClient(prev => prev ? { ...prev, email: e.target.value } : null)} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Contact Link</Label>
                  <Input value={editingClient?.phone || ""} onChange={e => setEditingClient(prev => prev ? { ...prev, phone: e.target.value } : null)} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Logistics Primary Address</Label>
                  <Input value={editingClient?.address || ""} onChange={e => setEditingClient(prev => prev ? { ...prev, address: e.target.value } : null)} className="h-12 bg-gray-50 border-none rounded-xl font-bold text-sm px-4 focus-visible:ring-blue-500/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Assigned Tier</Label>
                  <Select value={editingClient.status || "Active"} onValueChange={v => setEditingClient(prev => prev ? { ...prev, status: v as string } : null)}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none font-bold text-sm rounded-xl focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 font-bold">
                      <SelectItem value="Active" className="rounded-xl">Active Client</SelectItem>
                      <SelectItem value="VIP" className="rounded-xl">VIP Tier</SelectItem>
                      <SelectItem value="Suspended" className="rounded-xl text-rose-500">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">System Role</Label>
                  <Select value={editingClient.role || "Client"} onValueChange={v => setEditingClient(prev => prev ? { ...prev, role: v as string } : null)}>
                    <SelectTrigger className="h-12 bg-gray-50 border-none font-bold text-sm rounded-xl focus:ring-blue-500/20"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white border-none shadow-2xl rounded-2xl p-2 font-bold">
                      <SelectItem value="Client" className="rounded-xl">Client Participant</SelectItem>
                      <SelectItem value="Staff" className="rounded-xl">Internal Staff</SelectItem>
                      <SelectItem value="Admin" className="rounded-xl">Executive Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="ghost" onClick={() => setIsEditOpen(false)} className="h-12 rounded-xl font-bold text-gray-400 px-6">Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editingClient)} className="h-12 rounded-xl font-bold bg-amber-600 px-10 text-white shadow-lg shadow-amber-500/20">Execute Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Purchase History Dialog ────────────────────────────────────────────── */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-4xl bg-white border-none shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-10 bg-gray-50/50 border-b border-gray-100 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <ShoppingBag className="size-5 text-blue-600" />
                </div>
                <DialogTitle className="text-3xl font-black font-sans tracking-tight text-gray-900">Purchase History Suite</DialogTitle>
              </div>
              {historyCustomer && (
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{historyCustomer?.name}</p>
                  <p className="text-[10px] font-bold text-blue-600">{historyCustomer?.email}</p>
                </div>
              )}
            </div>
            <DialogDescription className="text-sm font-bold uppercase tracking-widest opacity-40">Holistic audit log of logistical and financial transactions.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-10 space-y-12">
            {/* Orders Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Logistical Orders</h4>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[9px] bg-blue-50 text-blue-600 border-none">{historyOrders.length} Records</Badge>
              </div>

              {isLoadingHistoryOrders ? (
                <div className="flex items-center justify-center py-10 opacity-20"><RefreshCw className="animate-spin" /></div>
              ) : historyOrders.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center grayscale opacity-30">
                  <ShoppingBag className="size-8 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No order history found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {historyOrders.map((order: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-50 hover:border-gray-100 p-6 rounded-2xl flex items-center justify-between transition-all group hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[10px] text-gray-400">#{order.order_number?.slice(-4) || '??'}</div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-gray-900 tracking-tight">{order.order_number}</p>
                          <p className="text-[10px] font-bold text-gray-400">{new Date(order.order_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Total</p>
                          <p className="text-sm font-black text-gray-900">{order.currency} {parseFloat(order.total_price).toFixed(2)}</p>
                        </div>
                        <Badge className={cn("rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase", order.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Invoices Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-400">Financial Invoices</h4>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold text-[9px] bg-emerald-50 text-emerald-600 border-none">{historyInvoices.length} Paid</Badge>
              </div>

              {isLoadingHistoryInvoices ? (
                <div className="flex items-center justify-center py-10 opacity-20"><RefreshCw className="animate-spin" /></div>
              ) : historyInvoices.length === 0 ? (
                <div className="py-12 border border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center grayscale opacity-30">
                  <CreditCard className="size-8 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No financial history found</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {historyInvoices.map((inv: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-50 hover:border-gray-100 p-6 rounded-2xl flex items-center justify-between transition-all group hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-[10px] text-gray-400">INV</div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-black text-gray-900 tracking-tight">{inv.invoice_number}</p>
                          <p className="text-[10px] font-bold text-gray-400">{new Date(inv.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-30">Amount</p>
                          <p className="text-sm font-black text-emerald-600">{inv.currency} {parseFloat(inv.total_price).toFixed(2)}</p>
                        </div>
                        <Badge className={cn("rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase", inv.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400")}>
                          {inv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <DialogFooter className="p-10 bg-gray-50 border-t border-gray-100">
            <Button variant="ghost" className="font-bold uppercase tracking-widest text-xs opacity-40 ml-auto" onClick={() => setIsHistoryOpen(false)}>Close Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
