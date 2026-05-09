"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { 
  Check, 
  Trash, 
  Plus, 
  Search, 
  X,
  GripVertical,
  ExternalLink,
  Bold, Italic, Underline, Link2, List, AlignLeft, Quote, Code, ArrowLeft,
  Calendar, RotateCw, Copy, RotateCcw,
  Sparkles, Clock, Truck, CheckCircle, CheckCircle2, XCircle
} from "lucide-react"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { cn } from "@/lib/utils"

// ─── REUSABLE COMPONENTS ────────────────────────────────────────────────────────

const FormInput = ({ label, required, prefix, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, required?: boolean, prefix?: string }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && (
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">{prefix}</span>
      )}
      <input 
        className={cn(
          "h-11 w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:bg-gray-50 disabled:dark:bg-gray-900 disabled:text-gray-500 disabled:cursor-not-allowed",
          prefix && "pl-8"
        )}
        {...props}
      />
    </div>
  </div>
)

const SelectDropdown = ({ label, required, children, icon: Icon, onClear, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string, required?: boolean, icon?: any, onClear?: () => void }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && (
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="size-4" />
        </span>
      )}
      <select 
        className={cn(
          "h-11 w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 text-sm font-medium shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50",
          Icon && "pl-9"
        )}
        {...props}
      >
        <option value="" disabled>Select {label ? label.toLowerCase() : 'an option'}...</option>
        {children}
      </select>
      {onClear ? (
        <button type="button" onClick={onClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
           <X className="size-4" />
        </button>
      ) : (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
      )}
    </div>
  </div>
)

const StatusPickerGroup = ({ value, onChange }: { value: string, onChange: (s: string) => void }) => {
  const statuses = [
    { id: "New", label: "New", icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50 border-blue-200", darkBg: "dark:bg-blue-900/20 dark:border-blue-800" },
    { id: "Processing", label: "Processing", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 border-amber-200", darkBg: "dark:bg-amber-900/20 dark:border-amber-800" },
    { id: "Shipped", label: "Shipped", icon: Truck, color: "text-green-500", bg: "bg-green-50 border-green-400", darkBg: "dark:bg-green-900/20 dark:border-green-800" },
    { id: "Delivered", label: "Delivered", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-300", darkBg: "dark:bg-emerald-900/20 dark:border-emerald-800" },
    { id: "Completed", label: "Completed", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-600 text-white border-none", darkBg: "dark:bg-emerald-900 dark:border-emerald-800" },
    { id: "Cancelled", label: "Cancelled", icon: XCircle, color: "text-rose-500", bg: "bg-rose-50 border-rose-200", darkBg: "dark:bg-rose-900/20 dark:border-rose-800" },
  ]
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Status <span className="text-rose-500">*</span></label>
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map(s => {
          const isActive = value.toLowerCase() === s.id.toLowerCase()
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className={cn(
                "h-10 px-4 rounded-lg text-sm font-bold flex items-center gap-2 transition-all border outline-none",
                isActive 
                  ? cn(s.bg, s.darkBg, s.color, "shadow-sm ring-1 ring-black/5")
                  : "bg-white dark:bg-gray-950 text-gray-500 border-gray-200 dark:border-gray-800 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50"
              )}
            >
              <s.icon className={cn("size-4", isActive ? s.color : "text-gray-400")} /> {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <div className="flex flex-col w-full border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
    <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      {[
        { icon: Bold, label: "Bold" }, { icon: Italic, label: "Italic" }, { icon: Underline, label: "Underline" }, 
        { icon: Link2, label: "Link" }, { icon: List, label: "Lists" }, { icon: AlignLeft, label: "Align Left" },
        { icon: Quote, label: "Quote" }, { icon: Code, label: "Code" }
      ].map((item, i) => (
        <button key={i} type="button" title={item.label} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors">
          <item.icon className="size-4" />
        </button>
      ))}
    </div>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="Add hidden instructions, tracking metadata, or carrier references..."
      className="w-full min-h-[160px] p-4 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 resize-y outline-none leading-relaxed"
    />
  </div>
)

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────────

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { id } = React.use(params)
  
  const [mounted, setMounted] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => { setMounted(true) }, [])

  // Form State
  const [form, setForm] = React.useState({
    number: "",
    customerId: "",
    status: "",
    currency: "USD",
    address: { country: "US", street: "", city: "", state: "", zip: "" },
    notes: "",
    items: [{ id: "1", productId: "", quantity: 1, unitPrice: 0 }],
    order_date: new Date().toISOString()
  })

  // Queries
  const { data: order, isLoading: isOrderLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`)
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json.data
    }
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  // Load Order Data into Form
  React.useEffect(() => {
    if (order) {
      setForm(f => ({
        ...f,
        number: order.order_number || id,
        customerId: order.customer_name || "",
        status: order.status || "New",
        currency: order.currency || "USD",
        order_date: order.order_date || new Date().toISOString(),
        items: order.items && order.items.length > 0 ? order.items : f.items,
        notes: order.notes || "",
        address: order.address || { country: "US", street: "", city: "", state: "", zip: "" }
      }))
    }
  }, [order, id])

  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      return json
    },
    onSuccess: () => {
      toast.success("Order changes saved successfully.")
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      router.push('/admin/orders')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleSave = () => {
    setIsSubmitting(true)
    const total_price = form.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)
    
    // We pass only base fields to match standard neon schema functionality
    editMutation.mutate(
      { 
        status: form.status, 
        currency: form.currency, 
        customer_name: form.customerId,
        total_price: total_price > 0 ? total_price : undefined,
        items: form.items,
        notes: form.notes,
        address: form.address
      }, 
      { onSettled: () => setIsSubmitting(false) }
    )
  }

  // Formatting helpers
  const getTimeAgo = (dateStr: string) => {
    const years = new Date().getFullYear() - new Date(dateStr).getFullYear()
    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`
    return `4 months ago` // Mocked fallback
  }

  const handleProductSelect = (itemId: string, productName: string) => {
    const matched = products.find((p: any) => p.name === productName)
    setForm(f => ({
      ...f, items: f.items.map(i => i.id === itemId ? { 
        ...i, productId: productName, unitPrice: matched ? parseFloat(matched.price || 0) : i.unitPrice 
      } : i)
    }))
  }

  if (!mounted) return null
  if (isOrderLoading) return <DashboardLayout><div className="flex h-[80vh] items-center justify-center"><div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="bg-[#F9FAFB] dark:bg-black min-h-screen pb-32">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8 font-sans">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
                <Link href="/admin/orders" className="hover:text-blue-600 transition-colors">Orders</Link>
                <span className="opacity-30">/</span>
                <span className="text-gray-600 dark:text-gray-300">{form.number}</span>
                <span className="opacity-30">/</span>
                <span className="text-gray-900 dark:text-white">Edit</span>
              </nav>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                Edit Order {form.number}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2">
                <Copy className="size-4" /> Replicate
              </button>
              <button type="button" className="h-10 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2">
                <Trash className="size-4" /> Delete
              </button>
            </div>
          </div>

          {/* 75/25 Layout Grid */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* 75% MAIN COLUMN */}
            <div className="flex-[3] w-full flex flex-col gap-6">
              
              {/* Order Details Form Card */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden text-gray-900 dark:text-gray-100">
                <div className="p-6 md:p-8 flex flex-col gap-8">
                  
                  {/* Top Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                      label="Number" 
                      value={form.number} 
                      readOnly 
                      disabled 
                    />
                    
                    <div className="flex items-end gap-2 w-full">
                      <div className="flex-1">
                        <SelectDropdown 
                          label="Customer" 
                          icon={Search}
                          required 
                          value={form.customerId} 
                          onClear={() => setForm({...form, customerId: ""})}
                          onChange={e => setForm({...form, customerId: e.target.value})}
                        >
                          {customers.map((c: any) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          {/* Fallback if missing in db */}
                          {!customers.find((c: any) => c.name === form.customerId) && form.customerId && (
                             <option value={form.customerId}>{form.customerId}</option>
                          )}
                        </SelectDropdown>
                      </div>
                      <button type="button" className="shrink-0 size-11 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center">
                        <Plus className="size-5" />
                      </button>
                    </div>

                    <div className="md:col-span-2 mt-2">
                       <StatusPickerGroup value={form.status} onChange={s => setForm({...form, status: s})} />
                    </div>

                    <SelectDropdown 
                      label="Currency" 
                      required 
                      icon={Search}
                      value={form.currency} 
                      onChange={e => setForm({...form, currency: e.target.value})}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </SelectDropdown>
                    
                    <SelectDropdown 
                      label="Country" 
                      icon={Search}
                      value={form.address.country} 
                      onChange={e => setForm({...form, address: {...form.address, country: e.target.value}})}
                    >
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                    </SelectDropdown>

                  </div>

                  {/* Address Grid */}
                  <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-8 mt-2">
                     <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Shipping Origin</h3>
                     <FormInput 
                       label="Street address" 
                       value={form.address.street} 
                       onChange={e => setForm({...form, address: {...form.address, street: e.target.value}})}
                     />
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <FormInput 
                         label="City" 
                         value={form.address.city} 
                         onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})}
                       />
                       <FormInput 
                         label="State / Province" 
                         value={form.address.state} 
                         onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})}
                       />
                       <FormInput 
                         label="Zip / Postal code" 
                         value={form.address.zip} 
                         onChange={e => setForm({...form, address: {...form.address, zip: e.target.value}})}
                       />
                     </div>
                  </div>

                  {/* Notes */}
                  <div className="flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800 pt-8 mt-2">
                     <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-2">Order Notes</h3>
                     <RichTextEditor value={form.notes} onChange={v => setForm({...form, notes: v})} />
                  </div>
                  
                </div>
              </div>

              {/* Order Items Table Section */}
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order items</h2>
                  <button type="button" onClick={() => setForm(f => ({...f, items: [{ id: "1", productId: "", quantity: 1, unitPrice: 0 }]}))} className="h-8 px-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-bold text-xs rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1.5 border border-rose-200 dark:border-rose-800">
                    <RotateCcw className="size-3.5" /> Reset
                  </button>
                </div>
                
                <div className="overflow-x-auto p-0">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                     <thead className="bg-[#F9FAFB] dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
                       <tr>
                          <th className="w-12 py-3 px-4"></th>
                          <th className="py-3 px-4 font-bold text-gray-500 w-1/2">Product</th>
                          <th className="py-3 px-4 font-bold text-gray-500 w-24">Quantity</th>
                          <th className="py-3 px-4 font-bold text-gray-500 w-32">Unit Price</th>
                          <th className="py-3 px-4 w-24 text-right">Actions</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                       {form.items.map((item, idx) => (
                         <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                           <td className="p-4 text-center">
                             <GripVertical className="size-4 text-gray-300 mx-auto cursor-grab active:cursor-grabbing" />
                           </td>
                           <td className="p-4">
                              <SelectDropdown 
                                icon={Search}
                                value={item.productId}
                                onClear={() => handleProductSelect(item.id, "")}
                                onChange={e => handleProductSelect(item.id, e.target.value)}
                              >
                                {products.map((p: any) => (
                                  <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                              </SelectDropdown>
                           </td>
                           <td className="p-4">
                              <input 
                                type="number" min="1" 
                                value={item.quantity}
                                onChange={e => setForm(f => ({...f, items: f.items.map(i => i.id === item.id ? { ...i, quantity: parseInt(e.target.value) || 0 } : i)}))}
                                className="h-11 w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-3 text-sm font-bold tabular-nums outline-none transition-all focus:border-blue-500"
                              />
                           </td>
                           <td className="p-4">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input 
                                  type="number" min="0" step="0.01"
                                  value={item.unitPrice}
                                  onChange={e => setForm(f => ({...f, items: f.items.map(i => i.id === item.id ? { ...i, unitPrice: parseFloat(e.target.value) || 0 } : i)}))}
                                  className="h-11 w-full bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-7 pr-3 text-sm font-bold tabular-nums outline-none transition-all focus:border-blue-500"
                                />
                              </div>
                           </td>
                           <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button type="button" title="View external" className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                  <ExternalLink className="size-4" />
                                </button>
                                <button 
                                  type="button" 
                                  title="Remove"
                                  onClick={() => setForm(f => ({...f, items: f.items.filter(i => i.id !== item.id)}))}
                                  className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash className="size-4" />
                                </button>
                              </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                  <button 
                    type="button" 
                    onClick={() => setForm(f => ({...f, items: [...f.items, { id: Math.random().toString(), productId: "", quantity: 1, unitPrice: 0 }]}))}
                    className="h-10 px-6 rounded-lg text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900 hover:border-gray-300 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Plus className="size-4" /> Add to order items
                  </button>
                </div>
              </div>

            </div>

            {/* 25% SIDEBAR */}
            <div className="flex-1 w-full flex flex-col gap-6 sticky top-8">
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-5">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Metadata</h2>
                 <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="text-sm text-gray-500 font-medium">Order date</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">{getTimeAgo(form.order_date)}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 font-medium">Last modified at</span>
                    <span className="text-sm text-gray-900 dark:text-gray-100 font-bold">4 months ago</span>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Global Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex items-center justify-center sm:justify-end gap-3 px-4 lg:px-8">
        <Link href="/admin/orders">
          <button type="button" className="h-11 px-8 rounded-lg font-bold text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors bg-white dark:bg-gray-900">
            Cancel
          </button>
        </Link>
        <button 
          type="button" 
          onClick={handleSave}
          disabled={isSubmitting}
          className="h-11 px-8 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
        >
          {isSubmitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="size-4" />} Save changes
        </button>
      </div>
    </DashboardLayout>
  )
}
