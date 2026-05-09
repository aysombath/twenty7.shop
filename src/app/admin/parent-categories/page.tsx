"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus, Search, SlidersHorizontal, Pencil, Eye, EyeOff, Trash2,
  ChevronLeft, ChevronRight, ArrowUpDown, Download, CheckCircle,
  XCircle, FolderTree, MoreVertical
} from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel,
  getSortedRowModel, flexRender, createColumnHelper, SortingState
} from "@tanstack/react-table"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type ParentCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  visibility: boolean
  updated_at: string | null
}

const fetchParentCategories = async (): Promise<ParentCategory[]> => {
  const res = await fetch('/api/parent-categories')
  const json = await res.json()
  if (json.success && Array.isArray(json.data)) {
    return json.data
  } else if (Array.isArray(json)) {
    return json
  }
  throw new Error(json.error || "Unexpected response")
}

const columnHelper = createColumnHelper<ParentCategory>()

export default function ParentCategoriesPage() {
  const queryClient = useQueryClient()
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: fetchParentCategories
  })

  const visibilityMutation = useMutation({
    mutationFn: async (item: ParentCategory) => {
      const res = await fetch('/api/parent-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, name: item.name, slug: item.slug, description: item.description, visibility: !item.visibility })
      })
      const json = await res.json()
      if (!json.success) throw new Error("Failed to update visibility")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-categories'] })
      toast.success("Visibility updated.")
    },
    onError: () => toast.error("Update failed.")
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/parent-categories?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error("Delete failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-categories'] })
      toast.success("Category deleted.")
    },
    onError: () => toast.error("Delete failed.")
  })

  const handleDelete = (id: string) => {
    if (confirm("Permanently delete this parent category?")) {
      deleteMutation.mutate(id)
    }
  }

  const toggleVisibility = (item: ParentCategory) => {
    visibilityMutation.mutate(item)
  }

  const columns = React.useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: () => <Checkbox />,
      cell: () => <Checkbox />,
    }),
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <button onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="flex items-center gap-1.5 uppercase">
          Name <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: info => (
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{info.getValue()}</span>
          <span className="text-[10px] font-bold text-gray-400 opacity-60">ID: {info.row.original.id}</span>
        </div>
      )
    }),
    columnHelper.accessor('slug', {
      header: 'Slug',
      cell: info => (
        <span className="text-xs font-bold text-gray-500 font-mono">/{info.getValue() || '—'}</span>
      )
    }),
    columnHelper.accessor('visibility', {
      header: () => <div className="text-center">Visibility</div>,
      cell: info => (
        <div className="flex justify-center">
          {info.getValue() ? <CheckCircle className="size-4 text-emerald-500" /> : <XCircle className="size-4 text-rose-500" />}
        </div>
      )
    }),
    columnHelper.accessor('updated_at', {
      header: 'Last Modified',
      cell: info => (
        <span className="text-xs font-bold text-gray-500 tabular-nums">
          {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString() : '—'}
        </span>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: info => {
        const item = info.row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-20 hover:opacity-100 transition-all"><MoreVertical className="size-4" /></Button>} />
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-950 p-1.5 rounded-xl shadow-2xl border-none z-50">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => toggleVisibility(item)} className="flex items-center gap-2 p-2.5 rounded-lg font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-gray-50">
                    {item.visibility ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />} Toggle visibility
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = `/admin/parent-categories/${item.id}/edit`} className="flex items-center gap-2 p-2.5 rounded-lg font-bold text-xs uppercase tracking-widest cursor-pointer hover:bg-gray-50">
                    <Pencil className="size-3.5" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5 opacity-10" />
                  <DropdownMenuItem onClick={() => handleDelete(item.id)} className="flex items-center gap-2 p-2.5 rounded-lg font-bold text-xs uppercase tracking-widest text-rose-600 cursor-pointer hover:bg-rose-50">
                    <Trash2 className="size-3.5" strokeWidth={3} /> Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    })
  ], [])

  const table = useReactTable({
    data: items,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Hydration fix
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 font-sans">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-1">
             <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
               <Link href="/admin/parent-categories" className="hover:text-primary transition-colors">Taxonomy</Link>
               <span className="opacity-20">/</span>
               <span className="text-gray-900 dark:text-white">Hierarchy</span>
             </nav>
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
               Parent Categories
             </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 px-6 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-50 border-gray-200 shadow-sm">
                <Download className="size-4 mr-2 opacity-50" /> Export Tree
             </Button>
             <Link href="/admin/parent-categories/create">
               <Button className="h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  <Plus className="size-4 mr-2" /> Create Root
               </Button>
             </Link>
          </div>
        </div>

        {/* Stats Cards Cluster */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Roots", val: items.length, icon: FolderTree, color: "text-blue-600" },
            { label: "Public Status", val: items.filter(i => i.visibility).length, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Restricted", val: items.filter(i => !i.visibility).length, icon: XCircle, color: "text-rose-600" },
            { label: "Modified", val: items.filter(i => i.updated_at && (new Date().getTime() - new Date(i.updated_at).getTime() < 86400000)).length, icon: Pencil, color: "text-amber-600" }
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

        {/* Table Container */}
        <div className="bg-card border border-border/50 p-4 md:p-8 rounded-2xl md:rounded-[32px] shadow-sm space-y-6 md:space-y-8">
           {/* Toolbar */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative group flex-1 max-w-full md:max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                 <Input 
                   placeholder="Search taxonomy hierarchy..." 
                   value={globalFilter ?? ""}
                   onChange={e => table.setGlobalFilter(e.target.value)}
                   className="pl-12 h-12 bg-secondary/30 border-none rounded-2xl font-bold text-sm focus-visible:ring-primary/20 shadow-none" 
                 />
              </div>
              <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-secondary/30 hover:bg-secondary/50 border-none text-muted-foreground"><SlidersHorizontal className="size-4" /></Button>
           </div>

           {/* Brand Table */}
           <div className="rounded-2xl border border-gray-50 dark:border-gray-800 overflow-x-auto overflow-y-hidden">
              <table className="w-full text-left">
                 <thead className="bg-secondary/20">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th 
                            key={header.id} 
                            className={cn(
                              "h-10 md:h-14 px-3 md:px-8 text-[9px] md:text-[10px] uppercase font-black tracking-widest text-muted-foreground/50 whitespace-nowrap",
                              header.id === 'slug' && "hidden lg:table-cell",
                              header.id === 'visibility' && "hidden sm:table-cell",
                              header.id === 'updated_at' && "hidden md:table-cell"
                            )}
                          >
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {isLoading ? (
                       <tr><td colSpan={columns.length} className="py-20 text-center text-[10px] opacity-10 font-black tracking-[0.3em] uppercase">Indexing roots...</td></tr>
                    ) : table.getRowModel().rows.length === 0 ? (
                       <tr><td colSpan={columns.length} className="py-20 text-center text-[10px] opacity-10 font-black tracking-[0.3em] uppercase">No hierarchy found</td></tr>
                    ) : (
                       table.getRowModel().rows.map(row => (
                         <tr key={row.id} className="group hover:bg-secondary/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/admin/parent-categories/${row.original.id}/edit`}>
                           {row.getVisibleCells().map(cell => (
                             <td 
                               key={cell.id} 
                               className={cn(
                                 "px-3 md:px-8 h-auto py-3 md:py-6 first:rounded-l-2xl last:rounded-r-2xl align-middle",
                                 cell.column.id === 'slug' && "hidden lg:table-cell",
                                 cell.column.id === 'visibility' && "hidden sm:table-cell",
                                 cell.column.id === 'updated_at' && "hidden md:table-cell"
                               )}
                             >
                               {flexRender(cell.column.columnDef.cell, cell.getContext())}
                             </td>
                           ))}
                         </tr>
                       ))
                    )}
                 </tbody>
              </table>
           </div>

           {/* Pagination Footer */}
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                Displaying {table.getFilteredRowModel().rows.length} taxonomy entries
              </span>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Scale</span>
                    <Select value={table.getState().pagination.pageSize.toString()} onValueChange={v => table.setPageSize(Number(v))}>
                       <SelectTrigger className="h-9 w-20 bg-secondary/30 border-none rounded-xl font-bold text-xs shadow-none">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="bg-popover rounded-xl shadow-2xl border-border/10 font-bold p-1">
                          <SelectItem value="10" className="rounded-lg text-[10px] uppercase font-black tracking-widest">10 Units</SelectItem>
                          <SelectItem value="25" className="rounded-lg text-[10px] uppercase font-black tracking-widest">25 Units</SelectItem>
                          <SelectItem value="50" className="rounded-lg text-[10px] uppercase font-black tracking-widest">50 Units</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} className="size-10 rounded-xl bg-secondary/30 disabled:opacity-10 transition-all border-none"><ChevronLeft className="size-4" /></Button>
                    <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(table.getPageCount(), 5) }, (_, i) => {
                       let pageIdx = i;
                       if (table.getState().pagination.pageIndex > 2) {
                          pageIdx = table.getState().pagination.pageIndex - 2 + i;
                       }
                       if (pageIdx >= table.getPageCount()) return null;

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
    </DashboardLayout>
  )
}
