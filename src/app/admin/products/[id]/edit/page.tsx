"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
   Plus,
   ChevronLeft,
   Upload,
   Trash2,
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
   Info,
   Package,
   Eye,
   DollarSign,
   RefreshCcw
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
import { Badge } from "@/components/ui/badge"
import { CloudinaryUpload } from "@/components/dashboard/cloudinary-upload"
import { cn } from "@/lib/utils"

// --- Components ---

const FormSection = ({ title, children, className }: { title: string, children: React.ReactNode, className?: string }) => (
   <div className={cn("bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-5", className)}>
      <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800 pb-4 mb-2">
         <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            {title}
         </h3>
      </div>
      {children}
   </div>
)

const FormInput = ({ label, required, help, children, className }: { label: string, required?: boolean, help?: string, children: React.ReactNode, className?: string }) => (
   <div className={cn("space-y-1.5 w-full", className)}>
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
         {label} {required && <span className="text-rose-500">*</span>}
         {help && (
            <div className="group relative">
               <Info className="size-3.5 opacity-40 hover:opacity-100 cursor-help" />
               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-[10px] text-white rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl font-bold uppercase tracking-normal leading-relaxed">
                  {help}
               </div>
            </div>
         )}
      </label>
      {children}
   </div>
)

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
   <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-900/50 shadow-inner">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
         {[Bold, Italic, Underline, Strikethrough, LinkIcon, Heading2, Heading3, AlignLeft, AlignCenter, List, ListOrdered, Quote, Code].map((Icon, i) => (
            <Button key={i} variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 opacity-60 hover:opacity-100 transition-all">
               <Icon className="size-4" />
            </Button>
         ))}
      </div>
      <Textarea
         value={value}
         onChange={e => onChange(e.target.value)}
         placeholder="Enter detailed architectural descriptions..."
         className="min-h-[250px] border-none focus-visible:ring-0 p-6 font-bold text-sm leading-relaxed bg-transparent"
      />
   </div>
)

const MultiSelectTags = ({ tags, onRemove }: { tags: string[], onRemove: (tag: string) => void }) => (
   <div className="flex flex-wrap gap-2">
      {tags.map((tag, i) => (
         <Badge key={i} className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest animate-in slide-in-from-left-2 shadow-sm transition-all hover:ring-2 hover:ring-blue-500/20">
            {tag}
            <button onClick={(e) => { e.stopPropagation(); onRemove(tag); }} className="size-3.5 flex items-center justify-center rounded-sm hover:bg-rose-100 hover:text-rose-600 transition-colors">
               <X className="size-2" />
            </button>
         </Badge>
      ))}
   </div>
)

// --- Main Page ---

export default function EditProductPage() {
   const router = useRouter()
   const { id } = useParams()
   const queryClient = useQueryClient()
   const [mounted, setMounted] = React.useState(false)

   const [formData, setFormData] = React.useState({
      id: id as string,
      name: "Loading...",
      slug: "",
      description: "",
      category: "",
      brand: "",
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
      image_url: "",
      categories: [] as string[],
      hasVariants: false,
      variants: [] as any[],
      discountPrice: "",
      applyMasterDiscountToAll: true,
      discountStart: "",
      discountEnd: ""
   })

   const [imagesToDelete, setImagesToDelete] = React.useState<string[]>([])
   const [activeVariantId, setActiveVariantId] = React.useState<string | null>(null)
   const variantFileRef = React.useRef<HTMLInputElement>(null)

   const [slugKept, setSlugKept] = React.useState(false)

   React.useEffect(() => {
      setMounted(true)
      setFormData(prev => ({ ...prev, publishDate: prev.publishDate || new Date().toISOString().split('T')[0] }))
   }, [])

   React.useEffect(() => {
      if (formData.name && formData.name !== "Loading..." && !slugKept) {
         setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
      }
   }, [formData.name, slugKept])

   // ── useQuery: brands ────────────────────────────────────────────────────────
   const { data: registryBrands = [] } = useQuery({
      queryKey: ['brands'],
      queryFn: async () => {
         const res = await fetch('/api/brands')
         const json = await res.json()
         return json.success && Array.isArray(json.data) ? json.data : []
      }
   })

   // ── useQuery: categories ────────────────────────────────────────────────────
   const { data: registryCategories = [] } = useQuery({
      queryKey: ['categories'],
      queryFn: async () => {
         const res = await fetch('/api/categories')
         const json = await res.json()
         return json.success && Array.isArray(json.data) ? json.data : []
      }
   })

   const purgeMediaCloudinary = async (urls: string[]) => {
      const uniqueUrls = [...new Set(urls.filter(u => u && u.includes('cloudinary')))]
      if (uniqueUrls.length === 0) return
      
      console.log("Registry Purge Protocol Triggered for Cloudinary Assets:", uniqueUrls.length)
      await Promise.all(uniqueUrls.map(url => 
         fetch('/api/upload', { 
            method: 'DELETE', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }) 
         }).catch(err => console.error("Purge failure for", url, err))
      ))
   }

   // ── useQuery: product ───────────────────────────────────────────────────────
   const { isLoading: loading } = useQuery({
      queryKey: ['product', id],
      queryFn: async () => {
         const res = await fetch(`/api/products?id=${id}`)
         const json = await res.json()
         if (json.success && json.data) {
            const p = json.data
            setSlugKept(true)
            const existingVariants = Array.isArray(p.variants) ? p.variants : []
            setFormData(prev => ({
               ...prev,
               name: p.name,
               slug: p.slug || prev.slug,
               category: p.category || "",
               brand: p.brand_id ? String(p.brand_id) : "",
               price: parseFloat(p.price).toString(),
               sku: p.sku || prev.sku,
               quantity: p.stock?.toString() || "0",
               isVisible: p.status === 'Active',
               image_url: p.image_url || prev.image_url,
               description: p.description || prev.description,
               categories: Array.isArray(p.tags) ? p.tags : [],
               comparePrice: p.compare_price?.toString() || "",
               costPerItem: p.cost_per_item?.toString() || "",
               barcode: p.barcode || "",
               securityStock: p.security_stock?.toString() || "0",
               isReturnable: p.is_returnable !== undefined ? p.is_returnable : true,
               isShippable: p.is_shippable !== undefined ? p.is_shippable : true,
               hasVariants: existingVariants.length > 0,
               variants: existingVariants,
               discountPrice: p.discount_price?.toString() || "",
               discountStart: p.discount_start ? new Date(p.discount_start).toISOString().slice(0, 16) : "",
               discountEnd: p.discount_end ? new Date(p.discount_end).toISOString().slice(0, 16) : ""
            }))
            return p
         }
         throw new Error(json.error || "Registry Fetch Failure")
      }
   })

   // ── useMutation: save ───────────────────────────────────────────────────────
   const saveMutation = useMutation({
      mutationFn: async () => {
         const res = await fetch('/api/products', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               id: formData.id,
               name: formData.name,
               category: formData.category,
               price: parseFloat(formData.price),
               status: formData.isVisible ? 'Active' : 'Hidden',
               sku: formData.sku,
               stock: parseInt(formData.quantity) || 0,
               image_url: formData.image_url,
               description: formData.description,
               brand_id: formData.brand || null,
               tags: formData.categories,
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
         if (!json.success) throw new Error(json.error || "Update Failure")
         return json
      },
      onSuccess: async () => {
         await queryClient.invalidateQueries({ queryKey: ['products'] })
         if (imagesToDelete.length > 0) purgeMediaCloudinary(imagesToDelete)
         toast.success("Identity Record Synchronized", { description: "The product vault record has been updated." })
         router.push('/admin/products')
      },
      onError: (error: any) => {
         toast.error("Update Failure", { description: error.message })
      }
   })

   // ── useMutation: delete ─────────────────────────────────────────────────────
   const deleteMutation = useMutation({
      mutationFn: async () => {
         const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
         const json = await res.json()
         if (!json.success) throw new Error("Purge Failed")
         return json
      },
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['products'] })
         // Purge all images
         const allImages = [formData.image_url, ...formData.variants.map(v => v.image_url)]
         purgeMediaCloudinary(allImages)
         toast.success("Identity Purged", { description: "Asset context permanently removed from vault." })
         router.push('/admin/products')
      },
      onError: () => toast.error("Purge Failed")
   })

   // ── Variant Management ──────────────────────────────────────────────────────
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

   const updateVariant = (vId: string, field: string, value: any) => {
      setFormData(prev => ({
         ...prev,
         variants: prev.variants.map(v => {
            if (v.id === vId || v.id?.toString() === vId?.toString()) {
               if (field === 'image_url' && v.image_url && v.image_url !== value) {
                  setImagesToDelete(cur => [...cur, v.image_url])
               }
               return { ...v, [field]: value }
            }
            return v
         })
      }))
   }

   const removeVariant = (vId: string) => {
      setFormData(prev => {
         const toRemove = prev.variants.find(v => v.id === vId || v.id?.toString() === vId?.toString())
         if (toRemove?.image_url) {
            setImagesToDelete(cur => [...cur, toRemove.image_url])
         }
         const filtered = prev.variants.filter(v => v.id !== vId && v.id?.toString() !== vId?.toString())
         return {
            ...prev,
            variants: filtered,
            hasVariants: filtered.length > 0 ? true : prev.hasVariants
         }
      })
   }

   const handleVariantUpload = async (vId: string, file: File) => {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      toast.loading("Media Registry Signal Active...", { id: "variant-upload" })
      
      try {
         const res = await fetch('/api/upload', { method: 'POST', body: formDataUpload })
         const result = await res.json()
         if (result.success) {
            updateVariant(vId, "image_url", result.url)
            toast.success("Variant Asset Registered", { id: "variant-upload" })
         } else {
            throw new Error(result.error)
         }
      } catch (e: any) {
         toast.error("Media Registration Failure", { id: "variant-upload", description: e.message })
      }
   }

   const handleSave = (e: React.FormEvent) => {
      e.preventDefault()
      saveMutation.mutate()
   }

   const handleDelete = () => {
      if (window.confirm("FATAL ACTION: Are you sure you want to purge this product from the master registry? This action is irreversible.")) {
         deleteMutation.mutate()
      }
   }

   const removeCategoryTag = (tag: string) => {
      setFormData(prev => ({ ...prev, categories: prev.categories.filter(c => c !== tag) }))
   }

   if (!mounted) return null

   if (loading) {
      return (
         <DashboardLayout>
            <div className="flex flex-col gap-10 animate-pulse">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                     <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded-full" />
                     <div className="h-10 w-64 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
                  </div>
                  <div className="flex gap-3">
                     <div className="h-12 w-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                     <div className="h-12 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                  </div>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                  <div className="xl:col-span-8 space-y-10">
                     <div className="h-[200px] bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800" />
                     <div className="h-[400px] bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800" />
                  </div>
                  <aside className="xl:col-span-4 space-y-10">
                     <div className="h-[300px] bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800" />
                     <div className="h-[150px] bg-blue-600/10 rounded-3xl border border-blue-500/20" />
                  </aside>
               </div>
            </div>
         </DashboardLayout>
      )
   }

   return (
      <DashboardLayout>
         <div className="max-w-7xl mx-auto px-4 py-8 lg:px-10 pb-20 font-sans">
            {/* Top Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
               <div className="space-y-1.5">
                  <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.15em] text-gray-400">
                     <Link href="/admin/products" className="hover:text-blue-600 transition-colors">Products</Link>
                     <span className="opacity-20">/</span>
                     <span>{formData.name}</span>
                     <span className="opacity-20">/</span>
                     <span className="text-gray-900 dark:text-white">Edit</span>
                  </nav>
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                     Edit {formData.name}
                  </h1>
               </div>
               <Button onClick={handleDelete} variant="ghost" className="h-12 px-6 rounded-xl bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white font-black text-xs uppercase tracking-widest transition-all gap-2 group shadow-sm">
                  <Trash2 className="size-4 opacity-50 group-hover:opacity-100" /> Purge Asset
               </Button>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
               {/* Left Content */}
               <div className="lg:col-span-8 space-y-10">
                  <FormSection title="Basic Info">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormInput label="Identifier Name" required>
                           <Input value={formData.name} onChange={e => { setSlugKept(false); setFormData({ ...formData, name: e.target.value }) }} className="h-12 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/10" />
                        </FormInput>
                        <FormInput label="Registry Slug">
                           <Input value={formData.slug} onChange={e => { setSlugKept(true); setFormData({ ...formData, slug: e.target.value }) }} className="h-12 bg-gray-50/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 rounded-xl font-bold flex items-center gap-3" />
                        </FormInput>
                        <div className="md:col-span-2">
                           <RichTextEditor value={formData.description} onChange={v => setFormData({ ...formData, description: v })} />
                        </div>
                     </div>
                  </FormSection>

                  <FormSection title="Images Section">
                     <CloudinaryUpload 
                        onUploadSuccess={(url) => setFormData(prev => ({ ...prev, image_url: url }))} 
                        currentImage={formData.image_url}
                     />
                  </FormSection>

                  <FormSection title="Pricing Structure">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 font-mono">
                        <FormInput label="Master Price" required>
                           <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <Input value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="h-12 pl-8 bg-gray-50/50 border-gray-200 rounded-xl font-black text-lg focus:ring-blue-500/10" />
                           </div>
                        </FormInput>
                        <FormInput label="Promotion Discount" help="Setting this will display a 'On Sale' badge and update the primary price.">
                           <div className="space-y-4">
                              <div className="relative group">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-bold">$</span>
                                 <Input value={formData.discountPrice} onChange={e => setFormData({ ...formData, discountPrice: e.target.value })} className="h-12 pl-8 bg-rose-50/30 border-rose-100 rounded-xl font-black text-lg text-rose-600 focus:ring-rose-500/10" placeholder="0.00" />
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
                        <FormInput label="Promotion Start">
                           <Input type="datetime-local" value={formData.discountStart} onChange={e => setFormData({ ...formData, discountStart: e.target.value })} className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                        </FormInput>
                        <FormInput label="Promotion End">
                           <Input type="datetime-local" value={formData.discountEnd} onChange={e => setFormData({ ...formData, discountEnd: e.target.value })} className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                        </FormInput>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono pt-4">
                        <FormInput label="Competitor Benchmark">
                           <div className="relative opacity-50 group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <Input value={formData.comparePrice} onChange={e => setFormData({ ...formData, comparePrice: e.target.value })} className="h-12 pl-8 border-gray-200 rounded-xl font-black text-lg" />
                           </div>
                        </FormInput>
                        <FormInput label="Internal Cost" help="This metric is hidden from global sales channels.">
                           <div className="relative group">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                              <Input value={formData.costPerItem} onChange={e => setFormData({ ...formData, costPerItem: e.target.value })} className="h-12 pl-8 bg-gray-50/50 border-gray-200 rounded-xl font-black text-lg focus:ring-emerald-500/10" />
                           </div>
                        </FormInput>
                     </div>
                  </FormSection>

                  <FormSection title="Inventory Manifest">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FormInput label="SKU" required><Input value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="h-11 bg-gray-50/50 border-gray-100 rounded-lg font-bold" /></FormInput>
                        <FormInput label="Barcode" required><Input value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} className="h-11 bg-gray-50/50 border-gray-100 rounded-lg font-bold" /></FormInput>
                        <FormInput label="Stock" required><Input type="number" disabled={formData.hasVariants} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} className={cn("h-11 bg-gray-50/50 border-gray-100 rounded-lg font-black", formData.hasVariants && "opacity-40")} /></FormInput>
                        <FormInput label="Safety Lvl" required help="The safety stock is the limit stock for your products..."><Input type="number" value={formData.securityStock} onChange={e => setFormData({ ...formData, securityStock: e.target.value })} className="h-11 bg-rose-50 border-rose-100 rounded-lg font-black text-rose-600" /></FormInput>
                     </div>
                  </FormSection>

                  <FormSection title="Product Variants">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50/30 border border-blue-100">
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Enable Multi-Variant Matrix</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Required for products with unique attributes like Size, Color or Material.</span>
                           </div>
                           <Switch 
                              checked={formData.hasVariants} 
                              onCheckedChange={(v) => {
                                 setFormData(prev => {
                                    const next = { ...prev, hasVariants: v, quantity: v ? "0" : prev.quantity }
                                    if (v && next.variants.length === 0) {
                                       next.variants = [{
                                          id: Math.random().toString(36).substring(7),
                                          name: prev.name,
                                          price: prev.price,
                                          stock: "0",
                                          sku: `${prev.sku}-V1`,
                                          image_url: prev.image_url
                                       }]
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
                                    <div key={v.id || idx} className="grid grid-cols-12 gap-3 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 items-center group transition-all hover:bg-white dark:hover:bg-gray-800">
                                       <div className="col-span-3 flex items-center gap-3">
                                          <div 
                                             className="size-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group-hover:border-blue-500/50 transition-colors relative"
                                             onClick={() => {
                                                setActiveVariantId(v.id || idx)
                                                variantFileRef.current?.click()
                                             }}
                                          >
                                             {v.image_url ? (
                                                <img src={v.image_url} className="size-full object-cover" />
                                             ) : (
                                                <Upload className="size-4 opacity-20" />
                                             )}
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Upload className="size-4 text-white" />
                                             </div>
                                          </div>
                                          <Input 
                                             placeholder={idx === 0 ? "Master Variant" : "e.g. Blue / XL"} 
                                             value={v.name}
                                             onChange={(e) => updateVariant(v.id || idx, "name", e.target.value)}
                                             className="h-10 bg-transparent border-none focus:ring-0 text-xs font-bold"
                                          />
                                       </div>
                                       <div className="col-span-2">
                                          <Input 
                                             type="number" 
                                             value={v.price} 
                                             onChange={(e) => updateVariant(v.id || idx, "price", e.target.value)}
                                             className="h-10 bg-transparent border-none focus:ring-0 text-xs font-black"
                                          />
                                       </div>
                                       <div className="col-span-2">
                                          <Input 
                                             type="number" 
                                             value={v.discountPrice || ""} 
                                             disabled={formData.applyMasterDiscountToAll}
                                             onChange={(e) => updateVariant(v.id || idx, "discountPrice", e.target.value)}
                                             className={cn("h-10 bg-transparent border-none focus:ring-0 text-xs font-black text-rose-600", formData.applyMasterDiscountToAll && "opacity-30")}
                                             placeholder={formData.applyMasterDiscountToAll ? (formData.discountPrice || "—") : "Sale $"}
                                          />
                                       </div>
                                       <div className="col-span-2">
                                          <Input 
                                             type="number" 
                                             value={v.stock} 
                                             onChange={(e) => updateVariant(v.id || idx, "stock", e.target.value)}
                                             className="h-10 bg-transparent border-none focus:ring-0 text-xs font-black text-emerald-600"
                                          />
                                       </div>
                                       <div className="col-span-2">
                                          <Input 
                                             value={v.sku} 
                                             onChange={(e) => updateVariant(v.id || idx, "sku", e.target.value)}
                                             className="h-10 bg-transparent border-none focus:ring-0 text-[10px] font-mono font-bold uppercase tracking-tight"
                                          />
                                       </div>
                                       <div className="col-span-1 flex justify-end">
                                          <Button 
                                             type="button"
                                             variant="ghost" 
                                             size="icon" 
                                             onClick={() => removeVariant(v.id || idx)}
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
                                    if (file && activeVariantId !== null) {
                                       handleVariantUpload(activeVariantId as string, file)
                                    }
                                 }}
                              />
                           </div>
                        )}
                     </div>
                  </FormSection>

                  <FormSection title="Logistics & Returns">
                     <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-all hover:border-blue-500/30 group">
                           <Checkbox checked={formData.isReturnable} onCheckedChange={v => setFormData({ ...formData, isReturnable: !!v })} className="size-5 rounded-lg border-gray-300 data-[state=checked]:bg-blue-600" />
                           <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-widest text-gray-900">Returnable Asset</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Enables post-delivery reversal.</span>
                           </div>
                        </div>
                        <div className="flex-1 flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 transition-all hover:border-blue-500/30 group">
                           <Checkbox checked={formData.isShippable} onCheckedChange={v => setFormData({ ...formData, isShippable: !!v })} className="size-5 rounded-lg border-gray-300 data-[state=checked]:bg-blue-600" />
                           <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-widest text-gray-900">Physical Fulfillment</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Requires logistics architecture.</span>
                           </div>
                        </div>
                     </div>
                  </FormSection>

                  <div className="flex items-center gap-4 py-8">
                     <Button type="submit" disabled={saveMutation.isPending} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                        {saveMutation.isPending ? "Synchronizing..." : "Save Record"}
                     </Button>
                     <Button type="button" onClick={() => router.push('/admin/products')} variant="ghost" className="h-14 px-8 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-100/50 rounded-2xl transition-all">
                        Cancel Changes
                     </Button>
                  </div>
               </div>

               {/* Sidebar (Right) */}
               <aside className="lg:col-span-4 space-y-10 lg:sticky lg:top-8">
                  <FormSection title="Visibility Status">
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-800 border-gray-100 dark:border-gray-800">
                           <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Status</span>
                              <p className="text-xs font-bold text-gray-900 dark:text-gray-400">{formData.isVisible ? "Public Display" : "Private Vault"}</p>
                           </div>
                           <Switch checked={formData.isVisible} onCheckedChange={v => setFormData({ ...formData, isVisible: v })} className="data-[state=checked]:bg-emerald-500" />
                        </div>
                        <FormInput label="Vault Publishing Date">
                           <div className="relative group">
                              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-hover:text-blue-500 transition-colors pointer-events-none" />
                              <Input type="date" value={formData.publishDate} onChange={e => setFormData({ ...formData, publishDate: e.target.value })} className="h-12 pl-11 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                           </div>
                        </FormInput>
                     </div>
                  </FormSection>

                  <FormSection title="Core Associations">
                     <div className="space-y-8">
                        <FormInput label="Registered Brand">
                           <Select value={formData.brand} onValueChange={v => setFormData({ ...formData, brand: v || "" })}>
                              <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold">
                                 <SelectValue placeholder="Specify Brand" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-2xl font-bold">
                                 {registryBrands.map((b: any) => (
                                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </FormInput>
                        <FormInput label="Primary Category" required>
                           <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v || "" })}>
                              <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold">
                                 <SelectValue placeholder="Select Primary Category" />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 shadow-2xl font-bold">
                                 {registryCategories.map((c: any) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </FormInput>
                        <FormInput label="Other Sub-Categories">
                           <div className="space-y-4">
                              <MultiSelectTags tags={formData.categories.map(id => {
                                 // Display human readable name if available
                                 const c = registryCategories.find((cat: any) => String(cat.id) === String(id));
                                 return c ? c.name : id;
                              })} onRemove={(tagName) => {
                                 // Find ID for the removed name
                                 const c = registryCategories.find((cat: any) => cat.name === tagName);
                                 const idToRemove = c ? String(c.id) : tagName;
                                 removeCategoryTag(idToRemove);
                              }} />
                              <div className="relative group">
                                 <Select onValueChange={(v: string | null) => v && !formData.categories.includes(v) && setFormData({ ...formData, categories: [...formData.categories, v] })}>
                                    <SelectTrigger className="h-10 bg-gray-50/50 border-dashed border-2 border-gray-200 dark:border-gray-800 rounded-xl font-bold text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">
                                       <div className="flex items-center gap-2">
                                          <Plus className="size-3" /> Append Category
                                       </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-950 border-gray-200 shadow-2xl font-bold">
                                       {registryCategories.filter((c: any) => !formData.categories.includes(String(c.id))).map((c: any) => (
                                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </div>
                           </div>
                        </FormInput>
                     </div>
                  </FormSection>

                  <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl shadow-blue-500/20 text-white space-y-4 animate-in fade-in slide-in-from-bottom-4">
                     <Package className="size-8 opacity-40" />
                     <h4 className="text-sm font-black uppercase tracking-widest">Master Identity Sync</h4>
                     <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-widest">
                        Updating this record synchronizes the identity across the Precision Atelier Global Stock Distributed Ledger.
                     </p>
                     <div className="pt-2">
                        <Badge className="bg-white/10 border-white/20 text-[8px] font-black uppercase tracking-[0.2em] py-1">Last Update: 2 mins ago</Badge>
                     </div>
                  </div>
               </aside>
            </form>
         </div>
      </DashboardLayout>
   )
}
