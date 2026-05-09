"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  getExpandedRowModel,
  VisibilityState,
} from "@tanstack/react-table"
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Truck,
  CircleDot,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Settings2,
  Calendar,
  DollarSign,
  ArrowRight,
  Ban,
  Package,
  Info,
  Clock,
  XCircle,
  Edit3,
  FileText,
  Send
} from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InvoiceTemplate } from "@/components/dashboard/invoice-template"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// --- Types ---

interface Invoice {
  id: string
  invoice_number: string
  seller_name: string
  customer_name: string
  biller_address?: string
  status: string
  currency: string
  subtotal: number | string
  tax_amount: number | string
  discount_amount: number | string
  discount_type?: string
  total_price: number | string
  issue_date?: string
  due_date?: string
  created_at: string
  items?: any[]
  customer_email?: string
  customer_phone?: string
}

// --- Components ---

const StatsCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <div className={cn("size-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800", color)}>
        <Icon className="size-4" />
      </div>
    </div>
    <span
      className="text-3xl font-black text-gray-900 dark:text-white tracking-tight"
      suppressHydrationWarning
    >
      {value}
    </span>
  </div>
)

const StatusBadge = ({ status }: { status: string }) => {
  const key = (status || '').toLowerCase()
  const styles: Record<string, { bg: string, text: string, icon: any }> = {
    "draft":     { bg: "bg-gray-100 text-gray-600 border-none",     text: "Draft",     icon: Clock },
    "sent":      { bg: "bg-blue-50 text-blue-600 border-none",      text: "Sent",      icon: Send },
    "paid":      { bg: "bg-emerald-50 text-emerald-600 border-none",text: "Paid",      icon: CheckCircle },
    "overdue":   { bg: "bg-rose-50 text-rose-600 border-none",      text: "Overdue",   icon: XCircle },
    "cancelled": { bg: "bg-rose-50 text-rose-500 border-none",      text: "Cancelled", icon: Ban },
    "new":       { bg: "bg-blue-50 text-blue-600 border-none",      text: "New",       icon: Info },
  }

  const s = styles[key] || styles["draft"]
  const Icon = s.icon

  return (
    <Badge className={cn("font-bold text-[8px] uppercase tracking-widest gap-1.5 px-2 py-1 shadow-none transition-all", s.bg)}>
      <Icon className="size-3" /> {s.text}
    </Badge>
  )
}

// --- Page ---

export default function OrdersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("All")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)
  const [viewType, setViewType] = React.useState<"list" | "grid">("list")
  const [showFilters, setShowFilters] = React.useState(true)
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  // PDF Export States
  const [invoiceConfig, setInvoiceConfig] = React.useState<any>(null)
  const [selectedOrderForPdf, setSelectedOrderForPdf] = React.useState<any>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Ensure mounting guard and load settings
  React.useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('invoice_settings')
    if (saved) {
      try {
        setInvoiceConfig(JSON.parse(saved))
      } catch (e) { }
    } else {
      setInvoiceConfig({
        companyName: "Twenty 7 Shop",
        companyAddress: "123 Commerce St\nSan Francisco, CA 94105\n+1 (555) 123-4567",
        themeColor: "text-pink-600",
        showLogo: true,
        showQR: true,
        blocks: ['header', 'metadata', 'table', 'footer']
      })
    }
  }, [])

  const cleanPrice = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const cleaned = String(val).replace(/[^0-9.-]+/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  // Fetch invoices from real API
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  // Table Setup & Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Update failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success("Invoice status updated.")
    },
    onError: (e: any) => toast.error("Update failed", { description: e.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Delete failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success("Invoice deleted.")
    },
    onError: (e: any) => toast.error("Delete failed", { description: e.message }),
  })
  const columns = React.useMemo<ColumnDef<Invoice>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="size-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
      cell: info => <span className="font-mono text-xs font-bold text-blue-500 uppercase tracking-tight">{info.getValue() as string}</span>
    },
    {
      accessorKey: "customer_name",
      header: "Billed To",
      cell: info => <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{info.getValue() as string}</span>
    },
    {
      accessorKey: "seller_name",
      header: "Issued By",
      cell: info => <span className="text-xs font-semibold text-gray-500">{(info.getValue() as string) || '—'}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: info => <StatusBadge status={info.getValue() as string} />
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: info => <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{info.getValue() as string}</span>
    },
    {
      accessorKey: "total_price",
      header: "Total",
      cell: info => <span className="font-black text-sm text-gray-900 dark:text-white">${cleanPrice(info.getValue()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    },
    {
      accessorKey: "issue_date",
      header: "Issue Date",
      cell: info => {
        const v = info.getValue() as string
        return <span className="text-xs font-bold text-gray-500">{v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
      }
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: info => {
        const v = info.getValue() as string
        if (!v) return <span className="text-xs font-bold text-gray-400">—</span>
        const isPast = new Date(v) < new Date() 
        return <span className={`text-xs font-bold ${isPast ? 'text-rose-500' : 'text-gray-500'}`}>{new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const inv = row.original
        const invStatus = (inv.status || "draft").toLowerCase()

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity outline-none">
                  <MoreVertical className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-950 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl p-2 font-black z-50">

                {/* Status transitions */}
                {invStatus === 'draft' && (
                  <DropdownMenuItem
                    disabled={updateMutation.isPending || isExporting}
                    onClick={async () => {
                      toast.loading(`Updating & sending ${inv.invoice_number}...`, { id: 'send-toast' })
                      try {
                        // 1. Update status in DB
                        await updateMutation.mutateAsync({ id: inv.invoice_number, status: 'sent' })
                        
                        // 2. Map row to template format & generate PDF
                        const mappedOrder = {
                          order_number: inv.invoice_number,
                          customer_name: inv.customer_name,
                          seller_name: inv.seller_name,
                          order_date: inv.issue_date || inv.created_at,
                          status: 'sent',
                          total_price: inv.total_price,
                          subtotal: inv.subtotal,
                          tax_amount: inv.tax_amount,
                          discount_amount: inv.discount_amount,
                          discount_type: inv.discount_type,
                          currency: inv.currency,
                          address: { street: inv.biller_address || '' },
                          items: inv.items && inv.items.length > 0 ? inv.items : null,
                          notes: (inv as any).notes // fetch notes if exists
                        }
                        
                        setSelectedOrderForPdf(mappedOrder)
                        
                        // Give template time to mount before capture
                        setTimeout(async () => {
                          try {
                            const el = document.getElementById('pdf-invoice-print-node')
                            if (!el) throw new Error("Template node missing")
                            
                            const { toPng } = await import('html-to-image')
                            const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true })
                            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                            const pdfWidth = pdf.internal.pageSize.getWidth()
                            const elRect = el.getBoundingClientRect()
                            const pdfHeight = (elRect.height * pdfWidth) / elRect.width
                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                            
                            const pdfBase64 = pdf.output('datauristring')

                            // 3. Send via Resend
                            const emailRes = await fetch('/api/invoices/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                invoice_number: inv.invoice_number,
                                customer_email: inv.customer_email,
                                customer_name: inv.customer_name,
                                pdf_base64: pdfBase64,
                                seller_name: inv.seller_name
                              })
                            })
                            const emailJson = await emailRes.json()
                            if (!emailJson.success) throw new Error(emailJson.error || "Email failed")

                            toast.success(`✓ sent & emailed to: ${inv.customer_email || 'client'}`, { id: 'send-toast' })
                          } catch (err: any) {
                            console.error('Email error:', err)
                            toast.error(`Status updated, but email failed: ${err.message}`, { id: 'send-toast' })
                          } finally {
                            setSelectedOrderForPdf(null)
                          }
                        }, 600)
                      } catch (e: any) {
                        toast.error(`Operation failed: ${e.message}`, { id: 'send-toast' })
                      }
                    }}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-blue-600"
                  >
                    <Send className="size-3.5" /> Mark as Sent
                  </DropdownMenuItem>
                )}

                {invStatus === 'sent' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: inv.invoice_number, status: 'paid' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-emerald-600"
                  >
                    <CheckCircle className="size-3.5" /> Mark as Paid
                  </DropdownMenuItem>
                )}

                {['draft','sent'].includes(invStatus) && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: inv.invoice_number, status: 'cancelled' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-orange-600"
                  >
                    <XCircle className="size-3.5" /> Cancel Invoice
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />

                {/* PDF Download */}
                <DropdownMenuItem
                  disabled={isExporting}
                  onClick={async () => {
                    setIsExporting(true)
                    toast.loading(`Rendering PDF for ${inv.invoice_number}...`, { id: 'pdf-toast' })
                    try {
                      const mappedOrder = {
                        order_number: inv.invoice_number,
                        customer_name: inv.customer_name,
                        seller_name: inv.seller_name,
                        order_date: inv.issue_date || inv.created_at,
                        status: inv.status,
                        total_price: inv.total_price,
                        subtotal: inv.subtotal,
                        tax_amount: inv.tax_amount,
                        discount_amount: inv.discount_amount,
                        discount_type: inv.discount_type,
                        currency: inv.currency,
                        address: { street: inv.biller_address || '' },
                        items: inv.items && inv.items.length > 0 ? inv.items : null
                      }
                      setSelectedOrderForPdf(mappedOrder)
                      setTimeout(async () => {
                        const el = document.getElementById('pdf-invoice-print-node')
                        if (el) {
                          const { toPng } = await import('html-to-image')
                          const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true })
                          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                          const pdfWidth = pdf.internal.pageSize.getWidth()
                          const elRect = el.getBoundingClientRect()
                          const pdfHeight = (elRect.height * pdfWidth) / elRect.width
                          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                          pdf.save(`Invoice_${inv.invoice_number}.pdf`)
                          toast.success(`Downloaded Invoice_${inv.invoice_number}.pdf`, { id: 'pdf-toast' })
                        } else {
                          toast.error('Template node not found', { id: 'pdf-toast' })
                        }
                        setSelectedOrderForPdf(null)
                        setIsExporting(false)
                      }, 500)
                    } catch (e: any) {
                      toast.error(`PDF failed: ${e.message}`, { id: 'pdf-toast' })
                      setIsExporting(false)
                    }
                  }}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  <FileText className="size-3.5 opacity-60 text-blue-500" /> Download PDF
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />

                <DropdownMenuItem
                  onClick={() => { if (confirm("Delete this invoice permanently?")) deleteMutation.mutate(inv.invoice_number) }}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950"
                >
                  <Trash2 className="size-3.5" /> Delete Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [updateMutation, deleteMutation, isExporting])

  const filteredData = React.useMemo(() => {
    let data = invoices
    if (activeTab !== "All") {
      data = data.filter((inv: Invoice) => (inv.status || '').toLowerCase() === activeTab.toLowerCase())
    }
    if (searchTerm) {
      data = data.filter((inv: Invoice) =>
        (inv.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer_name  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.seller_name    || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return data
  }, [invoices, activeTab, searchTerm])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { rowSelection, columnVisibility },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  // Summary Calculations
  const pageTotal = table.getRowModel().rows.reduce((acc: number, row) => acc + cleanPrice(row.original.total_price), 0)
  const allTotal  = invoices.reduce((acc: number, inv: Invoice) => acc + cleanPrice(inv.total_price), 0)

  // Stats Calculation from API
  const stats = React.useMemo(() => {
    if (!isMounted) return { total: 0, open: 0, paid: 0, avgPrice: 0 }
    const totalCount = invoices.length
    const openCount  = invoices.filter((inv: Invoice) => ['draft','sent'].includes((inv.status ||'').toLowerCase())).length
    const paidCount  = invoices.filter((inv: Invoice) => (inv.status||'').toLowerCase() === 'paid').length
    const sumTotal   = invoices.reduce((acc: number, inv: Invoice) => acc + cleanPrice(inv.total_price), 0)
    const avgPrice   = totalCount > 0 ? sumTotal / totalCount : 0
    return { total: totalCount, open: openCount, paid: paidCount, avgPrice }
  }, [invoices, isMounted])

  if (!isMounted) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 font-sans">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-1">
             <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
               <Link href="/admin/invoices" className="hover:text-primary transition-colors">Financials</Link>
               <span className="opacity-20">/</span>
               <span className="text-gray-900 dark:text-white">Invoices</span>
             </nav>
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
               Invoice Registry
             </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 px-6 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 border-gray-200 shadow-sm">
                <FileText className="size-4 mr-2 opacity-50" /> Billing Config
             </Button>
             <Link href="/invoices/create">
               <Button className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  <Plus className="size-4 mr-2" /> New Invoice
               </Button>
             </Link>
          </div>
        </div>

        {/* Stats Cards Cluster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Volume", val: invoices.length, icon: Package, color: "text-blue-600" },
            { label: "Open Balance", val: stats.open, icon: Clock, color: "text-amber-500" },
            { label: "Paid Revenue", val: stats.paid, icon: CheckCircle, color: "text-emerald-500" },
            { label: "AOV (Projection)", val: `$${stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, icon: DollarSign, color: "text-purple-600" }
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border/5 rounded-[24px] md:rounded-[32px] p-5 md:p-8 flex flex-col gap-1 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{s.label}</span>
                <div className={cn("size-8 md:size-10 rounded-xl md:rounded-2xl flex items-center justify-center bg-secondary/50 group-hover:scale-110 transition-transform", s.color)}>
                  <s.icon className="size-4 md:size-5" />
                </div>
              </div>
              <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight" suppressHydrationWarning>{s.val}</span>
            </div>
          ))}
        </div>

        {/* Filters & Status Tabs */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {["All", "Draft", "Sent", "Paid", "Cancelled", "Overdue"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all",
                  activeTab === tab
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-secondary/40 text-muted-foreground/60 hover:text-foreground border border-transparent shadow-sm"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative group flex-1 max-w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Query invoice numbers or clients..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 bg-secondary/30 border-none rounded-2xl font-bold text-sm focus-visible:ring-primary/20 shadow-none focus:w-full transition-all" 
                />
             </div>
             
             <div className="flex items-center gap-3">
               <div className="flex items-center gap-1.5 p-1.5 bg-secondary/30 rounded-2xl border-none">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewType("grid")}
                    className={cn(
                      "size-9 rounded-xl transition-all",
                      viewType === "grid" ? "bg-white dark:bg-gray-800 text-primary shadow-sm scale-110" : "text-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <LayoutGrid className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewType("list")}
                    className={cn(
                      "size-9 rounded-xl transition-all",
                      viewType === "list" ? "bg-white dark:bg-gray-800 text-primary shadow-sm scale-110" : "text-muted-foreground/40 hover:text-foreground"
                    )}
                  >
                    <List className="size-4" />
                  </Button>
               </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-12 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border-none text-muted-foreground transition-all active:scale-95"
                    >
                      <Settings2 className="size-4" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-56 p-3 bg-white dark:bg-gray-950 rounded-[20px] border border-gray-100 dark:border-gray-800 shadow-2xl z-50">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Configure Viewport</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800 mb-2" />
                      <div className="flex flex-col gap-0.5">
                        {table
                          .getAllColumns()
                          .filter(
                            (column) =>
                              typeof column.accessorFn !== "undefined" && column.getCanHide()
                          )
                          .map((column) => {
                            const isVisible = column.getIsVisible();
                            return (
                              <div 
                                key={column.id} 
                                className="group flex items-center justify-between p-2 rounded-xl hover:bg-secondary/40 cursor-pointer transition-colors"
                                onClick={() => column.toggleVisibility(!isVisible)}
                              >
                                 <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground capitalize">{column.id.replace(/_/g, ' ')}</span>
                                 <div className={cn(
                                   "size-4 rounded-md flex items-center justify-center transition-all",
                                   isVisible ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/60 text-muted-foreground/40"
                                 )}>
                                   {isVisible && <CheckCircle className="size-2.5" />}
                                 </div>
                              </div>
                            );
                          })}
                      </div>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-8">
           {isLoading ? (
              <div className="bg-card border border-border/50 rounded-[32px] p-32 text-center border-dashed">
                <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 animate-pulse">Synchronizing Ledger...</p>
              </div>
           ) : invoices.length > 0 ? (
              viewType === "list" ? (
                <div className="bg-card border border-border/50 p-4 md:p-6 lg:p-8 rounded-2xl md:rounded-[32px] shadow-sm space-y-6 md:space-y-8 overflow-hidden">
                   <div className="overflow-x-auto lg:overflow-visible rounded-2xl border border-gray-50 dark:border-gray-800">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-secondary/20">
                          {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map(header => (
                                <th 
                                  key={header.id} 
                                  className={cn(
                                    "h-10 md:h-14 px-3 md:px-8 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 whitespace-nowrap",
                                    (header.column.id === 'seller_name' || header.column.id === 'currency') && "hidden xl:table-cell",
                                    (header.column.id === 'issue_date' || header.column.id === 'due_date') && "hidden lg:table-cell"
                                  )}
                                >
                                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {table.getRowModel().rows.map(row => (
                            <tr key={row.id} className="group hover:bg-secondary/5 transition-colors cursor-pointer select-none">
                              {row.getVisibleCells().map(cell => (
                                <td 
                                  key={cell.id} 
                                  className={cn(
                                    "px-3 md:px-8 h-auto py-3 md:py-6 first:rounded-l-2xl last:rounded-r-2xl align-middle",
                                    (cell.column.id === 'seller_name' || cell.column.id === 'currency') && "hidden xl:table-cell",
                                    (cell.column.id === 'issue_date' || cell.column.id === 'due_date') && "hidden lg:table-cell"
                                  )}
                                >
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-secondary/10 text-muted-foreground">
                          <tr className="group hover:bg-secondary/5 transition-colors">
                            {/* Dynamic ColSpan for alignment */}
                            <td colSpan={4} className="px-3 md:px-8 py-6 text-right hidden lg:table-cell xl:hidden">
                              <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Partial Settlement</span>
                                <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Page View</span>
                              </div>
                            </td>
                            <td colSpan={5} className="px-3 md:px-8 py-6 text-right hidden xl:table-cell">
                              <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Partial Settlement</span>
                                <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Page View</span>
                              </div>
                            </td>
                            <td colSpan={4} className="px-3 md:px-8 py-6 text-right lg:hidden">
                               <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Page View</span>
                              </div>
                            </td>

                            <td className="px-3 md:px-8 py-6 text-sm font-black text-foreground">
                              ${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td colSpan={1} className="px-3 md:px-8 py-6 lg:hidden"></td>
                            <td colSpan={3} className="px-3 md:px-8 py-6 hidden lg:table-cell xl:hidden"></td>
                            <td colSpan={3} className="px-3 md:px-8 py-6 hidden xl:table-cell"></td>
                          </tr>
                          <tr className="group hover:bg-secondary/5 transition-colors">
                            <td colSpan={4} className="px-3 md:px-8 py-6 text-right hidden lg:table-cell xl:hidden">
                              <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Total Exposure</span>
                                <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Global Registry</span>
                              </div>
                            </td>
                            <td colSpan={5} className="px-3 md:px-8 py-6 text-right hidden xl:table-cell">
                              <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Total Exposure</span>
                                <span className="text-[10px] font-black text-foreground uppercase tracking-widest">Global Registry</span>
                              </div>
                            </td>
                            <td colSpan={4} className="px-3 md:px-8 py-6 text-right lg:hidden">
                               <div className="flex flex-col gap-1 justify-end">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Global Registry</span>
                              </div>
                            </td>

                            <td className="px-3 md:px-8 py-6 text-sm font-black text-foreground">
                              ${allTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td colSpan={1} className="px-3 md:px-8 py-6 lg:hidden"></td>
                            <td colSpan={3} className="px-3 md:px-8 py-6 hidden lg:table-cell xl:hidden"></td>
                            <td colSpan={3} className="px-3 md:px-8 py-6 hidden xl:table-cell"></td>
                          </tr>
                        </tfoot>
                      </table>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {table.getRowModel().rows.map(row => (
                      <div key={row.id} className="bg-card border border-border/5 rounded-[32px] p-8 flex flex-col gap-6 shadow-sm hover:shadow-md transition-all relative group h-full cursor-pointer hover:-translate-y-1" onClick={() => row.toggleSelected()}>
                        <div className="flex items-center justify-between">
                          <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            className="size-4 rounded-lg bg-secondary/50 border-none data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                          />
                          <StatusBadge status={row.original.status as string} />
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Customer Registry</span>
                          <span className="text-base font-black text-foreground tracking-tight truncate group-hover:text-primary transition-colors">{row.original.customer_name}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-secondary/50">
                           <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Ledger Index</span>
                              <span className="font-mono text-[10px] font-black text-muted-foreground uppercase">{row.original.invoice_number}</span>
                           </div>
                           <div className="flex flex-col gap-1 text-right">
                              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Execution</span>
                              <span className="text-[10px] font-black text-muted-foreground">{row.original.issue_date ? new Date(row.original.issue_date).toLocaleDateString() : 'u2014'}</span>
                           </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-secondary/50 border-dashed">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Net Settlement</span>
                            <span className="font-black text-xl text-foreground flex items-baseline gap-1">
                              <span className="text-[10px] text-muted-foreground/50 font-bold uppercase">{row.original.currency}</span>
                              {parseFloat(String(row.original.total_price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                             {flexRender(row.getVisibleCells().find(c => c.column.id === 'actions')?.column.columnDef.cell, row.getVisibleCells().find(c => c.column.id === 'actions')?.getContext() as any)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Grid Summary Footer */}
                  <div className="bg-card border border-border/5 rounded-[32px] p-8 shadow-sm flex flex-col md:flex-row items-center justify-around gap-8">
                    <div className="flex flex-col items-center gap-1 group text-center">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Window Liquidity</span>
                      <span className="text-3xl font-black text-foreground tracking-tight group-hover:scale-105 transition-transform">${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest font-black italic">Page Total</span>
                    </div>
                    <div className="h-16 w-px bg-secondary/50 hidden md:block" />
                    <div className="flex flex-col items-center gap-1 group text-center">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Total Enterprise Revenue</span>
                      <span className="text-3xl font-black text-foreground tracking-tight group-hover:scale-105 transition-transform">${allTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] text-muted-foreground/50 mt-1 uppercase tracking-widest font-black italic">Global Ledger</span>
                    </div>
                  </div>
                </div>
              )
           ) : (
              <div className="bg-card border-2 border-dashed border-border/10 rounded-[40px] p-32 text-center">
                <Package className="size-16 mx-auto text-muted-foreground/10 mb-6" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">Archive Empty • No Invoices Tracked</p>
              </div>
           )}

           {/* Pagination Footer */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 pb-12">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 text-center md:text-left">
                Presenting <span className="text-foreground">{table.getState().pagination.pageIndex * pageSize + 1}</span> — <span className="text-foreground">{Math.min((table.getState().pagination.pageIndex + 1) * pageSize, filteredData.length)}</span> of <span className="text-foreground">{filteredData.length.toLocaleString()}</span> Registry Units
              </span>
              
              <div className="flex flex-wrap items-center justify-center gap-6">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Registry Scaler</span>
                    <select
                      value={pageSize}
                      onChange={e => {
                        const val = Number(e.target.value)
                        setPageSize(val)
                        table.setPageSize(val)
                      }}
                      className="bg-secondary/30 border-none rounded-xl text-[10px] font-black uppercase text-foreground px-4 py-2 cursor-pointer outline-none focus:ring-1 focus:ring-primary/20 appearance-none min-w-[80px] text-center"
                    >
                      {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s} Units</option>)}
                    </select>
                 </div>
                 
                 <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="size-10 rounded-xl bg-secondary/30 disabled:opacity-10 transition-all border-none"><ChevronLeft className="size-4" /></Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                         let pageIdx = i;
                         if (table.getState().pagination.pageIndex > 2) pageIdx = table.getState().pagination.pageIndex - 2 + i;
                         if (pageIdx >= table.getPageCount() || pageIdx < 0) return null;

                         return (
                            <Button 
                               key={pageIdx} 
                               onClick={() => table.setPageIndex(pageIdx)} 
                               variant={pageIdx === table.getState().pagination.pageIndex ? "secondary" : "ghost"} 
                               className={cn("size-9 rounded-xl font-black text-[10px] transition-all tracking-widest", pageIdx === table.getState().pagination.pageIndex ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110" : "text-muted-foreground/40 hover:text-foreground")}
                            >
                               {pageIdx + 1}
                            </Button>
                         );
                      })}
                    </div>
                    <Button variant="ghost" size="icon" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} className="size-10 rounded-xl bg-secondary/30 disabled:opacity-10 transition-all border-none"><ChevronRight className="size-4" /></Button>
                 </div>
              </div>
           </div>
        </div>
      </div>
      {/* Hidden Ghost Container for Generating PDF Snapshot via html2canvas */}
      {selectedOrderForPdf && invoiceConfig && (
        <div className="fixed left-[200vw] top-0 z-[-1] pointer-events-none" style={{ backgroundColor: 'white' }}>
          <InvoiceTemplate
            id="pdf-invoice-print-node"
            config={invoiceConfig}
            order={selectedOrderForPdf as any}
          />
        </div>
      )}
    </DashboardLayout>
  )
}

