"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Check, 
  ChevronRight, 
  Plus, 
  Trash,
  Bold, 
  Italic, 
  Underline, 
  Link2, 
  List, 
  AlignLeft, 
  Quote, 
  Code,
  Package
} from "lucide-react"
import { toast } from "sonner"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────────
type OrderStatus = "new" | "processing" | "shipped" | "delivered" | "cancelled"

type OrderItem = {
  id: string
  productId: string
  quantity: number
  unitPrice: number
}

type OrderFormState = {
  number: string
  customerId: string
  status: OrderStatus
  currency: string
  address: {
    country: string
    street: string
    city: string
    state: string
    zip: string
  }
  notes: string
  items: OrderItem[]
}

// ─── Reusable Components ────────────────────────────────────────────────────────

const FormInput = ({ 
  label, required, disabled, prefix, ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string, required?: boolean, prefix?: string }) => (
  <div className="flex flex-col gap-2 w-full">
    {label && (
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">{prefix}</span>
      )}
      <input 
        disabled={disabled}
        className={cn(
          "h-11 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed",
          prefix && "pl-8"
        )}
        {...props}
      />
    </div>
  </div>
)

const SelectDropdown = ({ label, required, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, required?: boolean }) => (
  <div className="flex flex-col gap-2 w-full">
    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select 
      className="h-11 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
      {...props}
    >
      <option value="" disabled>Select {label.toLowerCase()}</option>
      {children}
    </select>
  </div>
)

const StatusPicker = ({ value, onChange }: { value: OrderStatus, onChange: (s: OrderStatus) => void }) => {
  const statuses: { id: OrderStatus, label: string }[] = [
    { id: "new", label: "New" },
    { id: "processing", label: "Processing" },
    { id: "shipped", label: "Shipped" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ]
  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status <span className="text-rose-500">*</span></label>
      <div className="flex flex-wrap items-center gap-2">
        {statuses.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            className={cn(
              "h-10 px-5 rounded-full text-xs font-bold transition-all border",
              value === s.id 
                ? "bg-blue-50 text-blue-600 border-blue-200 shadow-sm"
                : "bg-white dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => {
  return (
    <div className="flex flex-col w-full border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all shadow-sm">
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 border-dashed">
        {[
          { icon: Bold, label: "Bold" }, { icon: Italic, label: "Italic" },
          { icon: Underline, label: "Underline" }, { icon: Link2, label: "Link" },
          { icon: List, label: "Lists" }, { icon: AlignLeft, label: "Align Left" },
          { icon: Quote, label: "Quote" }, { icon: Code, label: "Code" }
        ].map((item, i) => (
          <button key={i} type="button" title={item.label} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <item.icon className="size-4" />
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Add any special instructions or order notes..."
        className="w-full min-h-[120px] p-4 text-sm font-medium bg-white dark:bg-gray-900 resize-y outline-none"
      />
    </div>
  )
}

const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { title: "Order Details", info: "Basic info & address" },
    { title: "Order Items", info: "Products & pricing" }
  ]

  return (
    <div className="flex items-center justify-center gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-4 shadow-sm">
      {steps.map((step, idx) => {
        const stepNum = idx + 1
        const isActive = currentStep === stepNum
        const isCompleted = currentStep > stepNum

        return (
          <React.Fragment key={step.title}>
            <div className={cn("flex items-center gap-4 px-4 py-2 rounded-2xl transition-all", isActive ? "bg-gray-50 dark:bg-gray-800" : "")}>
              <div className={cn(
                "size-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-all",
                isCompleted ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
                isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" :
                "bg-gray-100 dark:bg-gray-800 text-gray-400"
              )}>
                {isCompleted ? <Check className="size-5" /> : stepNum}
              </div>
              <div className="flex flex-col">
                <span className={cn("text-sm font-black tracking-tight", isActive || isCompleted ? "text-gray-900 dark:text-white" : "text-gray-400")}>
                  {step.title}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{step.info}</span>
              </div>
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="size-4 text-gray-300 shrink-0" />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ─── Main Page Component ────────────────────────────────────────────────────────

export default function CreateOrderPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = React.useState(false)
  const [step, setStep] = React.useState(1)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Auto-generate number string
  const defaultNumber = React.useMemo(() => `OR-${Math.floor(Math.random() * 1000000)}`, [])

  const [form, setForm] = React.useState<OrderFormState>({
    number: defaultNumber,
    customerId: "",
    status: "new",
    currency: "USD",
    address: { country: "", street: "", city: "", state: "", zip: "" },
    notes: "",
    items: [{ id: Math.random().toString(), productId: "", quantity: 1, unitPrice: 0 }]
  })

  // Data fetching
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

  // Customer Modal State & Mutation
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false)
  const [newCustomerForm, setNewCustomerForm] = React.useState({ name: "", email: "", phone: "" })

  const createCustomerMutation = useMutation({
    mutationFn: async (data: { name: string, email: string, phone: string }) => {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to add customer")
      return json.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setForm(f => ({ ...f, customerId: data.name }))
      setIsCustomerModalOpen(false)
      setNewCustomerForm({ name: "", email: "", phone: "" })
      toast.success("Customer added successfully")
    },
    onError: (e: any) => toast.error(e.message)
  })


  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isValidStep1 = form.customerId && form.currency
  const isValidStep2 = form.items.length > 0 && form.items.every(i => i.productId && i.quantity > 0 && i.unitPrice >= 0)

  const handleCreate = async () => {
    if (!isValidStep1 || !isValidStep2) return
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success(`Order ${data.order_number} created successfully.`)
        router.push('/admin/orders')
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      toast.error('Failed to create order', { description: err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addItemRow = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { id: Math.random().toString(), productId: "", quantity: 1, unitPrice: 0 }]
    }))
  }

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.id === id ? { ...i, [field]: value } : i)
    }))
  }

  const handleProductSelect = (id: string, productName: string) => {
    const matched = products.find((p: any) => p.name === productName)
    setForm(f => ({
      ...f,
      items: f.items.map(i => i.id === id ? { 
        ...i, 
        productId: productName, 
        unitPrice: matched ? parseFloat(matched.price || 0) : i.unitPrice 
      } : i)
    }))
  }

  const removeItem = (id: string) => {
    if (form.items.length <= 1) return toast.error("An order must have at least one item")
    setForm(f => ({...f, items: f.items.filter(i => i.id !== id)}))
  }

  const totalAmount = form.items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0)

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8 pb-24 font-sans flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-2">
            <Link href="/admin/orders" className="hover:text-blue-600 transition-colors">Orders</Link>
            <span className="opacity-30">/</span>
            <span className="text-gray-900 dark:text-white">Create Order</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shadow-inner">
              <Package className="size-6" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Create Order</h1>
          </div>
        </div>

        {/* Stepper */}
        <Stepper currentStep={step} />

        {/* Form Container */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] shadow-sm relative overflow-hidden flex flex-col">
          
          <div className="p-8 flex-1 grid gap-10">
            {step === 1 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Basic Info */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex-1">Basic Information</h2>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 flex-[3]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput 
                      label="Order Number" 
                      value={form.number} 
                      disabled 
                    />
                    
                    <div className="flex items-end gap-2 w-full">
                      <div className="flex-1">
                        <SelectDropdown 
                          label="Customer" 
                          required 
                          value={form.customerId} 
                          onChange={e => setForm({...form, customerId: e.target.value})}
                        >
                          {customers.map((c: any) => (
                            <option key={c.id} value={c.name}>{c.name} {c.email ? `(${c.email})` : ''}</option>
                          ))}
                        </SelectDropdown>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsCustomerModalOpen(true)}
                        className="shrink-0 size-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center"
                      >
                        <Plus className="size-5" />
                      </button>
                    </div>

                    <div className="md:col-span-2">
                       <StatusPicker value={form.status} onChange={s => setForm({...form, status: s})} />
                    </div>

                    <SelectDropdown 
                      label="Currency" 
                      required 
                      value={form.currency} 
                      onChange={e => setForm({...form, currency: e.target.value})}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </SelectDropdown>
                  </div>
                </section>

                {/* Address */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex-1">Shipping Address</h2>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 flex-[3]" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                       <SelectDropdown 
                         label="Country" 
                         value={form.address.country} 
                         onChange={e => setForm({...form, address: {...form.address, country: e.target.value}})}
                       >
                         <option value="US">United States</option>
                         <option value="GB">United Kingdom</option>
                         <option value="FR">France</option>
                         <option value="DE">Germany</option>
                       </SelectDropdown>
                    </div>
                    
                    <div className="md:col-span-2">
                      <FormInput 
                        label="Street Address" 
                        placeholder="123 Commerce St"
                        value={form.address.street} 
                        onChange={e => setForm({...form, address: {...form.address, street: e.target.value}})}
                      />
                    </div>
                    
                    <FormInput 
                      label="City" 
                      placeholder="London"
                      value={form.address.city} 
                      onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                       <FormInput 
                         label="State / Province" 
                         placeholder="Greater London"
                         value={form.address.state} 
                         onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})}
                       />
                       <FormInput 
                         label="Zip Code" 
                         placeholder="EC1A 1BB"
                         value={form.address.zip} 
                         onChange={e => setForm({...form, address: {...form.address, zip: e.target.value}})}
                       />
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex-1">Order Notes</h2>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 flex-[3]" />
                  </div>
                  <RichTextEditor value={form.notes} onChange={v => setForm({...form, notes: v})} />
                </section>

              </div>
            )}

            {step === 2 && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex-1">Order Items</h2>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 flex-[3]" />
                  </div>
                  
                  <div className="bg-gray-50/50 dark:bg-gray-800/20 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                         <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                           <tr>
                              <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 w-1/2">Product</th>
                              <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 shrink-0">Quantity</th>
                              <th className="py-4 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 shrink-0">Unit Price</th>
                              <th className="py-4 px-6 w-16 text-center"></th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                           {form.items.map((item) => (
                              <tr key={item.id} className="group hover:bg-white dark:hover:bg-gray-900 transition-colors">
                                 <td className="p-4 px-6">
                                    <select 
                                      className="h-10 w-full bg-transparent border-none focus:ring-2 focus:ring-blue-500/20 rounded-lg text-sm font-bold outline-none font-sans overflow-hidden text-ellipsis whitespace-nowrap"
                                      value={item.productId}
                                      onChange={e => handleProductSelect(item.id, e.target.value)}
                                    >
                                      <option value="" disabled>Select product...</option>
                                      {products.map((p: any) => (
                                        <option key={p.id} value={p.name}>{p.name} - ${parseFloat(p.price || 0).toFixed(2)}</option>
                                      ))}
                                    </select>
                                 </td>
                                 <td className="p-4 px-6">
                                    <input 
                                      type="number" min="1" 
                                      value={item.quantity}
                                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                      className="h-10 w-24 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg px-3 text-sm font-bold tabular-nums outline-none transition-all"
                                    />
                                 </td>
                                 <td className="p-4 px-6">
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-bold">$</span>
                                      <input 
                                        type="number" min="0" step="0.01"
                                        value={item.unitPrice}
                                        onChange={e => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="h-10 w-32 bg-transparent border border-transparent hover:border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg pl-8 pr-3 text-sm font-bold tabular-nums outline-none transition-all"
                                      />
                                    </div>
                                 </td>
                                 <td className="p-4 px-6 text-center">
                                    <button 
                                      type="button" 
                                      onClick={() => removeItem(item.id)}
                                      className="size-8 rounded-lg flex items-center justify-center text-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                      <Trash className="size-4" />
                                    </button>
                                 </td>
                              </tr>
                           ))}
                         </tbody>
                         <tfoot className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                            <tr>
                               <td colSpan={2} className="py-4 px-6">
                                 <button 
                                   type="button" 
                                   onClick={addItemRow}
                                   className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-2"
                                 >
                                   <Plus className="size-4" /> Add to order items
                                 </button>
                               </td>
                               <td className="py-4 px-6 font-black text-gray-900 dark:text-white tabular-nums tracking-tight">
                                  ${totalAmount.toFixed(2)}
                               </td>
                               <td></td>
                            </tr>
                         </tfoot>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between mt-auto shrink-0">
             {step === 1 ? (
               <>
                 <Link href="/admin/orders">
                   <button type="button" className="h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-all">
                     Cancel
                   </button>
                 </Link>
                 <button 
                   type="button" 
                   onClick={() => setStep(2)}
                   disabled={!isValidStep1}
                   className="h-11 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                 >
                   Next Step <ChevronRight className="size-4" />
                 </button>
               </>
             ) : (
               <>
                 <button 
                   type="button" 
                   onClick={() => setStep(1)}
                   className="h-11 px-8 rounded-xl font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-200/50 transition-all"
                 >
                   Back
                 </button>
                 <button 
                   type="button" 
                   onClick={handleCreate}
                   disabled={!isValidStep2 || isSubmitting}
                   className="h-11 px-8 rounded-xl font-black text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 active:scale-95 transition-all outline-none disabled:opacity-50 disabled:active:scale-100 flex items-center gap-2"
                 >
                   {isSubmitting ? <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="size-4" />} Create Order
                 </button>
               </>
             )}
          </div>

        </div>
      </div>

      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">Add New Customer</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <FormInput 
                label="Full Name" 
                required 
                placeholder="John Doe"
                value={newCustomerForm.name}
                onChange={e => setNewCustomerForm(f => ({...f, name: e.target.value}))}
              />
              <FormInput 
                label="Email" 
                required 
                type="email"
                placeholder="john@example.com"
                value={newCustomerForm.email}
                onChange={e => setNewCustomerForm(f => ({...f, email: e.target.value}))}
              />
              <FormInput 
                label="Phone" 
                placeholder="+1 234 567 890"
                value={newCustomerForm.phone}
                onChange={e => setNewCustomerForm(f => ({...f, phone: e.target.value}))}
              />
            </div>
            <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 text-sm">
              <button 
                type="button" 
                onClick={() => setIsCustomerModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200/50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={() => createCustomerMutation.mutate(newCustomerForm)}
                disabled={!newCustomerForm.name || !newCustomerForm.email || createCustomerMutation.status === 'pending'}
                className="px-6 py-2.5 rounded-xl font-black text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {createCustomerMutation.status === 'pending' ? 'Saving...' : 'Add Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
