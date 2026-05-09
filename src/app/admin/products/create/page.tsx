"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
  ChevronLeft, 
  Upload, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  Link as LinkIcon, 
  Heading2, 
  Heading3, 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  List, 
  ListOrdered, 
  Quote, 
  Code,
  Calendar,
  X,
  Type,
  ChevronDown,
  Info
} from "lucide-react"
import { toast } from "sonner"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload"
import { cn } from "@/lib/utils"

// --- Reusable Components ---

const FormSection = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
  <div className={cn("bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4", className)}>
    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">{title}</h3>
    {children}
  </div>
)

const FormInput = ({ label, required, help, children }: { label: string, required?: boolean, help?: string, children: React.ReactNode }) => (
  <div className="space-y-1.5 w-full">
    <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
      {label} {required && <span className="text-rose-500">*</span>}
      {help && (
        <div className="group relative">
           <Info className="size-3.5 opacity-40 hover:opacity-100 cursor-help" />
           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[10px] text-white rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 leading-relaxed font-bold tracking-normal uppercase">
              {help}
           </div>
        </div>
      )}
    </label>
    {children}
  </div>
)

const RichTextToolbar = () => (
  <div className="flex flex-wrap items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
    {[
      { icon: Bold, label: 'Bold' },
      { icon: Italic, label: 'Italic' },
      { icon: Underline, label: 'Underline' },
      { icon: Strikethrough, label: 'Strikethrough' },
      { icon: LinkIcon, label: 'Link' },
      { icon: Heading2, label: 'H2' },
      { icon: Heading3, label: 'H3' },
      { icon: AlignLeft, label: 'Align Left' },
      { icon: AlignCenter, label: 'Align Center' },
      { icon: List, label: 'Bullet List' },
      { icon: ListOrdered, label: 'Ordered List' },
      { icon: Quote, label: 'Quote' },
      { icon: Code, label: 'Code' }
    ].map((tool, i) => (
      <Button key={i} variant="ghost" size="icon" className="size-8 rounded-md hover:bg-white dark:hover:bg-gray-700 opacity-60 hover:opacity-100 transition-all">
        <tool.icon className="size-4" />
      </Button>
    ))}
  </div>
)

export default function CreateProductPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = React.useState(false)
  const variantFileRef = React.useRef<HTMLInputElement>(null)
  const [activeVariantId, setActiveVariantId] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    category: "",
    brand: "",
    image_url: "",
    price: "",
    comparePrice: "",
    costPerItem: "",
    sku: "",
    barcode: "",
    quantity: "0",
    securityStock: "5",
    isReturnable: true,
    isShippable: true,
    isVisible: true,
    publishDate: "",
    hasVariants: false,
    variants: [] as any[],
    discountPrice: "",
    applyMasterDiscountToAll: true,
    discountStart: "",
    discountEnd: ""
  })

  // Auto-generate SKU and publish date once on client
  React.useEffect(() => {
    setMounted(true)
    setFormData(prev => ({
      ...prev,
      publishDate: new Date().toISOString().split('T')[0],
      sku: prev.sku || `ATL-${new Date().getTime().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`
    }))
  }, [])

  // Auto-slug from name
  React.useEffect(() => {
    if (formData.name) {
      setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
    }
  }, [formData.name])

  // Fetch brands & categories via useQuery
  const { data: registryBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands')
      const json = await res.json()
      return json.success && Array.isArray(json.data) ? json.data : []
    }
  })

  const { data: registryCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      const json = await res.json()
      return json.success && Array.isArray(json.data) ? json.data : []
    }
  })

  // useMutation for product creation
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          sku: formData.sku,
          stock: parseInt(formData.quantity) || 0,
          image_url: formData.image_url || "https://images.unsplash.com/photo-1523275335684?auto=format&fit=crop&w=400&h=400&q=80",
          description: formData.description,
          brand_id: formData.brand || null,
          tags: [],
          slug: formData.slug,
          comparePrice: formData.comparePrice ? parseFloat(formData.comparePrice) : null,
          costPerItem: formData.costPerItem ? parseFloat(formData.costPerItem) : null,
          barcode: formData.barcode,
          securityStock: parseInt(formData.securityStock) || 0,
          isReturnable: formData.isReturnable,
          isShippable: formData.isShippable,
          variants: (formData.hasVariants ? formData.variants : []).map(v => ({
            ...v,
            discountPrice: formData.applyMasterDiscountToAll 
              ? (formData.discountPrice ? parseFloat(formData.discountPrice) : null)
              : (v.discountPrice ? parseFloat(v.discountPrice) : null)
          })),
          discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
          discountStart: formData.discountStart || null,
          discountEnd: formData.discountEnd || null
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Registry Failure")
      return json
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Architectural Asset Registered", { description: `Product ${formData.name} is now in the registry.` })
      router.push('/admin/products')
    },
    onError: (error: any) => {
      toast.error("Registry Failure", { description: error.message })
    }
  })

  // Effect to keep first variant in sync with master product ONLY if it's the only one and hasn't been manually diverted
  React.useEffect(() => {
    if (formData.hasVariants && formData.variants.length > 0) {
      setFormData(prev => ({
        ...prev,
        variants: prev.variants.map((v, i) => i === 0 ? {
          ...v,
          name: v.name || prev.name,
          price: v.price || prev.price,
          image_url: v.image_url || prev.image_url
        } : v)
      }))
    }
  }, [formData.name, formData.price, formData.image_url, formData.hasVariants])

  const addVariant = () => {
    const isFirst = formData.variants.length === 0
    const newVariant = {
      id: Math.random().toString(36).substring(7),
      name: isFirst ? formData.name : "",
      price: isFirst ? formData.price : "",
      stock: "0",
      sku: `${formData.sku}-V${formData.variants.length + 1}`,
      image_url: isFirst ? formData.image_url : ""
    }
    setFormData(prev => ({ ...prev, variants: [...prev.variants, newVariant] }))
  }

  const updateVariant = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v)
    }))
  }

  const removeVariant = (id: string) => {
    setFormData(prev => {
      const filtered = prev.variants.filter(v => v.id !== id)
      return {
        ...prev,
        variants: filtered,
        hasVariants: filtered.length > 0 ? true : prev.hasVariants
      }
    })
  }

  const handleVariantUpload = async (id: string, file: File) => {
    const formDataUpload = new FormData()
    formDataUpload.append('file', file)

    toast.loading("Media Registry Signal Active...", { id: "variant-upload" })
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      })
      const result = await res.json()
      if (result.success) {
        updateVariant(id, "image_url", result.url)
        toast.success("Variant Asset Registered", { id: "variant-upload" })
      } else {
        throw new Error(result.error)
      }
    } catch (e: any) {
      toast.error("Media Registration Failure", { id: "variant-upload", description: e.message })
    }
  }

  const handleSubmit = (e: React.FormEvent, stay: boolean = false) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.price || !formData.sku) {
      toast.error("Validation Error", { description: "Please fill in all mandatory vault fields." })
      return
    }
    createMutation.mutate(undefined, {
      onSuccess: () => {
        if (stay) {
          setFormData(prev => ({ ...prev, name: "", slug: "", sku: "", barcode: "", description: "", image_url: "" }))
        } else {
          router.push('/admin/products')
        }
      }
    })
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-10 pb-20 font-sans">
        {/* Header Block */}
        <div className="flex flex-col gap-6 mb-10">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <Link href="/admin/products" className="hover:text-blue-600 transition-colors">Products</Link>
            <span className="opacity-30">/</span>
            <span className="text-gray-900 dark:text-white">Create</span>
          </nav>
          <div className="flex items-center gap-4">
             <Link href="/admin/products" className="size-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ring-1 ring-gray-200/50 shadow-sm">
                <ChevronLeft className="size-5" />
             </Link>
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Create Product</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-8">
            <FormSection title="Basic Info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Name" required>
                  <Input placeholder="Enter product name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-11 bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/20" />
                </FormInput>
                <FormInput label="Slug">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">atelier.com/</span>
                    <Input placeholder="leather-bag" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-11 pl-28 bg-gray-50/50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-800 rounded-xl font-bold" />
                  </div>
                </FormInput>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Description</label>
                   <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100 dark:ring-gray-900/50 shadow-inner">
                      <RichTextToolbar />
                      <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the architectural essence of this product..." className="min-h-[250px] border-none focus-visible:ring-0 p-6 font-bold text-sm leading-relaxed" />
                   </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Images Upload">
              <CloudinaryUpload 
                onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))} 
                currentImage={formData.image_url}
              />
            </FormSection>

            <FormSection title="Pricing">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
                <FormInput label="Price" required>
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                     <Input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-11 pl-8 bg-gray-50/50 border-gray-200 rounded-xl font-black focus:ring-blue-500/10" />
                  </div>
                </FormInput>
                <FormInput label="Promotion Discount" help="Setting this will update the displayed price and prioritize this asset in promotion slides.">
                  <div className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500">$</span>
                      <Input type="number" step="0.01" value={formData.discountPrice} onChange={e => setFormData({...formData, discountPrice: e.target.value})} className="h-11 pl-8 bg-rose-50/30 border-rose-100 rounded-xl font-black text-rose-600 focus:ring-rose-500/10" placeholder="0.00" />
                    </div>
                    {formData.hasVariants && (
                      <div className="flex items-center gap-2 px-1">
                        <Switch 
                          checked={formData.applyMasterDiscountToAll} 
                          onCheckedChange={(v) => setFormData({ ...formData, applyMasterDiscountToAll: v })} 
                          className="data-[state=checked]:bg-rose-500"
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Apply to all variants</span>
                      </div>
                    )}
                  </div>
                </FormInput>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput label="Promotion Start">
                    <Input type="datetime-local" value={formData.discountStart} onChange={e => setFormData({ ...formData, discountStart: e.target.value })} className="h-11 bg-gray-50 border-gray-100 rounded-xl font-bold" />
                  </FormInput>
                  <FormInput label="Promotion End">
                    <Input type="datetime-local" value={formData.discountEnd} onChange={e => setFormData({ ...formData, discountEnd: e.target.value })} className="h-11 bg-gray-50 border-gray-100 rounded-xl font-bold" />
                  </FormInput>
                </div>
                <FormInput label="Compare Price">
                  <div className="relative opacity-60">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                     <Input type="number" step="0.01" value={formData.comparePrice} onChange={e => setFormData({...formData, comparePrice: e.target.value})} className="h-11 pl-8 bg-gray-50/50 border-gray-200 rounded-xl font-black" />
                  </div>
                </FormInput>
                <FormInput label="Cost per item" help="Customers won't see this price.">
                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                     <Input type="number" step="0.01" value={formData.costPerItem} onChange={e => setFormData({...formData, costPerItem: e.target.value})} className="h-11 pl-8 bg-gray-50/50 border-gray-200 rounded-xl font-black" />
                  </div>
                </FormInput>
              </div>
            </FormSection>

            <FormSection title="Inventory">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormInput label="SKU" required>
                    <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. ATL-1029-X" className="h-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold uppercase tracking-wider" />
                 </FormInput>
                 <FormInput label="Barcode" required>
                    <Input value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} placeholder="0 123456 789012" className="h-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                 </FormInput>
                 <FormInput label="Quantity" required>
                    <Input type="number" disabled={formData.hasVariants} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className={cn("h-11 bg-gray-50/50 border-gray-200 rounded-xl font-black transition-opacity", formData.hasVariants && "opacity-40")} />
                 </FormInput>
                 <FormInput label="Security Stock" required help="The safety stock is the limit stock for your products...">
                    <Input type="number" value={formData.securityStock} onChange={e => setFormData({...formData, securityStock: e.target.value})} className="h-11 bg-rose-50/30 border-rose-100 rounded-xl font-black text-rose-600" />
                 </FormInput>
              </div>
            </FormSection>

            <FormSection title="Product Variants">
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-100">
                     <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-gray-900 dark:text-white">Enable Multi-Variant Matrix</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Required for products with unique attributes like Size, Color or Material.</span>
                     </div>
                     <Switch 
                        checked={formData.hasVariants} 
                        onCheckedChange={(v) => {
                           setFormData(prev => {
                              const next = { ...prev, hasVariants: v, quantity: v ? "0" : prev.quantity }
                              if (v && next.variants.length === 0) {
                                 const firstVariant = {
                                    id: Math.random().toString(36).substring(7),
                                    name: prev.name,
                                    price: prev.price,
                                    stock: "0",
                                    sku: `${prev.sku}-V1`,
                                    image_url: prev.image_url
                                 }
                                 next.variants = [firstVariant]
                              }
                              return next
                           })
                        }} 
                        className="data-[state=checked]:bg-blue-600"
                     />
                  </div>

                  {formData.hasVariants && (
                     <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-12 gap-4 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                           <div className="col-span-3">Attribute (Color/Size)</div>
                           <div className="col-span-2">Price ($)</div>
                           <div className="col-span-2">Sale ($)</div>
                           <div className="col-span-2">Stock</div>
                           <div className="col-span-2">SKU Override</div>
                           <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                           {formData.variants.map((v, idx) => (
                              <div key={v.id} className="grid grid-cols-12 gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 items-center group transition-all hover:bg-white dark:hover:bg-gray-800">
                                 <div className="col-span-3 flex items-center gap-3">
                                    <div 
                                       className="size-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group-hover:border-blue-500/50 transition-colors relative"
                                       onClick={() => {
                                          setActiveVariantId(v.id)
                                          variantFileRef.current?.click()
                                       }}
                                    >
                                       {v.image_url ? (
                                          <img src={v.image_url} className="size-full object-cover" />
                                       ) : (
                                          <div className="flex flex-col items-center justify-center gap-1">
                                             <Upload className="size-4 opacity-20" />
                                          </div>
                                       )}
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Upload className="size-4 text-white" />
                                       </div>
                                    </div>
                                    <Input 
                                       placeholder={idx === 0 ? "e.g. Master Variant" : "e.g. Blue / XL"} 
                                       value={v.name}
                                       onChange={(e) => updateVariant(v.id, "name", e.target.value)}
                                       className="h-10 bg-white dark:bg-gray-900 border-none focus:ring-0 text-xs font-bold"
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <Input 
                                       type="number" 
                                       value={v.price} 
                                       onChange={(e) => updateVariant(v.id, "price", e.target.value)}
                                       className="h-10 bg-white dark:bg-gray-900 border-none focus:ring-0 text-xs font-black"
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <Input 
                                       type="number" 
                                       value={v.discountPrice || ""} 
                                       disabled={formData.applyMasterDiscountToAll}
                                       onChange={(e) => updateVariant(v.id, "discountPrice", e.target.value)}
                                       className={cn("h-10 bg-white dark:bg-gray-900 border-none focus:ring-0 text-xs font-black text-rose-600", formData.applyMasterDiscountToAll && "opacity-30")}
                                       placeholder={formData.applyMasterDiscountToAll ? (formData.discountPrice || "—") : "Sale $"}
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <Input 
                                       type="number" 
                                       value={v.stock} 
                                       onChange={(e) => updateVariant(v.id, "stock", e.target.value)}
                                       className="h-10 bg-white dark:bg-gray-900 border-none focus:ring-0 text-xs font-black text-emerald-600"
                                    />
                                 </div>
                                 <div className="col-span-2">
                                    <Input 
                                       value={v.sku} 
                                       onChange={(e) => updateVariant(v.id, "sku", e.target.value)}
                                       className="h-10 bg-white dark:bg-gray-900 border-none focus:ring-0 text-[10px] font-mono font-bold uppercase tracking-tight"
                                    />
                                 </div>
                                 <div className="col-span-1 flex justify-end">
                                    <Button 
                                       variant="ghost" 
                                       size="icon" 
                                       onClick={() => removeVariant(v.id)}
                                       className="size-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 opacity-20 hover:opacity-100 transition-all"
                                    >
                                       <X className="size-4" />
                                    </Button>
                                 </div>
                              </div>
                           ))}
                        </div>

                        <Button 
                           type="button" 
                           onClick={addVariant}
                           variant="outline" 
                           className="w-full h-12 border-dashed border-2 border-gray-200 dark:border-gray-800 hover:border-blue-500/50 hover:bg-blue-50/50 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-all"
                        >
                           <Plus className="size-4" /> Expand Variant Matrix
                        </Button>

                        <input 
                           type="file" 
                           ref={variantFileRef}
                           className="hidden"
                           accept="image/*"
                           onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file && activeVariantId) {
                                 handleVariantUpload(activeVariantId, file)
                              }
                           }}
                        />
                     </div>
                  )}
               </div>
            </FormSection>

            <FormSection title="Shipping">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 group transition-colors hover:border-blue-500/20">
                   <Checkbox checked={formData.isReturnable} onCheckedChange={(v) => setFormData({...formData, isReturnable: !!v})} className="size-5 rounded-md border-gray-300 dark:border-gray-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white">This product can be returned</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Enables returns processing for this asset.</span>
                   </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 group transition-colors hover:border-blue-500/20">
                   <Checkbox checked={formData.isShippable} onCheckedChange={(v) => setFormData({...formData, isShippable: !!v})} className="size-5 rounded-md border-gray-300 dark:border-gray-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
                   <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900 dark:text-white">This product will be shipped</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requires physical logistics fulfillment.</span>
                   </div>
                </div>
              </div>
            </FormSection>

            {/* Form Actions */}
            <div className="flex items-center gap-4 py-8">
               <Button type="submit" disabled={createMutation.isPending} className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                  {createMutation.isPending ? "Processing..." : "Create Product"}
               </Button>
               <Button type="button" onClick={(e) => handleSubmit(e, true)} variant="secondary" className="h-12 px-6 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200">
                  Create & create another
               </Button>
               <Button type="button" onClick={() => router.push('/admin/products')} variant="ghost" className="h-12 px-6 font-bold text-xs uppercase tracking-widest rounded-xl opacity-40 hover:opacity-100 underline decoration-gray-400 underline-offset-4">
                  Cancel
               </Button>
            </div>
          </div>

          {/* Sidebar (Right) */}
          <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
             <FormSection title="Status">
                <div className="space-y-6">
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Visibility</span>
                         <Switch checked={formData.isVisible} onCheckedChange={(v) => setFormData({...formData, isVisible: v})} className="data-[state=checked]:bg-emerald-500" />
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 leading-relaxed tracking-widest uppercase">
                         {formData.isVisible ? "Visible to all sales channels." : "Hidden from all sales channels."}
                      </p>
                   </div>
                   <FormInput label="Publishing Date">
                      <div className="relative">
                         <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                         <Input type="date" value={formData.publishDate} onChange={e => setFormData({...formData, publishDate: e.target.value})} className="h-11 pl-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                      </div>
                   </FormInput>
                </div>
             </FormSection>

             <FormSection title="Associations">
                <div className="space-y-6">
                   <FormInput label="Brand">
                      <Select value={formData.brand} onValueChange={(v) => setFormData({...formData, brand: v || ""})}>
                         <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold">
                            <SelectValue placeholder="Specify Brand" />
                         </SelectTrigger>
                         <SelectContent className="bg-white rounded-xl border-gray-200 shadow-xl overflow-hidden font-bold">
                            {registryBrands.map((b: any) => (
                               <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </FormInput>
                   <FormInput label="Product Categories" required>
                      <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v || ""})}>
                         <SelectTrigger className="h-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold">
                            <SelectValue placeholder="Select Indexing Category" />
                         </SelectTrigger>
                         <SelectContent className="bg-white rounded-xl border-gray-200 shadow-xl overflow-hidden font-bold">
                            {registryCategories.map((c: any) => (
                               <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                            ))}
                         </SelectContent>
                      </Select>
                   </FormInput>
                </div>
             </FormSection>

             <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30 flex items-start gap-4">
                <Info className="size-5 text-blue-600 mt-1 shrink-0" />
                <p className="text-[10px] font-bold text-blue-800 dark:text-blue-300 leading-relaxed uppercase tracking-widest">
                   Asset registration ensures synchronization across the Precision Atelier Global Catalog. Dynamic image delivery powered by Cloudinary.
                </p>
             </div>
          </aside>
        </form>
      </div>
    </DashboardLayout>
  )
}
