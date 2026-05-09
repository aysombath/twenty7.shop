"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
   ChevronLeft,
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
   Undo2,
   Redo2,
   Table as TableIcon,
   Info,
   Layers,
   Trash2,
   History,
   Clock,
   ExternalLink,
   ChevronDown
} from "lucide-react"
import { toast } from "sonner"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const FormInput = ({ label, required, help, children, className }: { label: string, required?: boolean, help?: string, children: React.ReactNode, className?: string }) => (
   <div className={cn("space-y-1.5 w-full", className)}>
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 font-sans">
         {label} {required && <span className="text-rose-500 font-black">*</span>}
         {help && <Info className="size-3.5 opacity-40 cursor-help" />}
      </label>
      {children}
   </div>
)

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
   <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-900/50 shadow-inner">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
         {[Bold, Italic, Underline, Strikethrough, LinkIcon, Heading2, Heading3, AlignLeft, AlignCenter, List, ListOrdered, TableIcon, Quote, Code, Undo2, Redo2].map((Icon, i) => (
            <button key={i} type="button" className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 opacity-60 hover:opacity-100 transition-all">
               <Icon className="size-4" />
            </button>
         ))}
      </div>
      <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Define the taxonomy scope..." className="min-h-[300px] border-none focus-visible:ring-0 p-8 font-bold text-sm leading-relaxed bg-transparent" />
   </div>
)

export default function EditCategoryPage() {
   const router = useRouter()
   const queryClient = useQueryClient()
   const { id } = useParams()
   const [mounted, setMounted] = React.useState(false)
   const [formData, setFormData] = React.useState({
      id: id as string,
      name: "",
      slug: "",
      parent_id: "null" as string,
      description: "",
      visibility: true,
      created_at: "",
      updated_at: ""
   })

   const { isLoading: parentsLoading, data: parentCategories = [] } = useQuery({
     queryKey: ['parent-categories'],
     queryFn: async () => {
       const res = await fetch('/api/parent-categories')
       const json = await res.json()
       if (json.success) return json.data
       return []
     }
   })

   const { isLoading: catLoading, data: categories = [] } = useQuery({
     queryKey: ['categories'],
     queryFn: async () => {
       const res = await fetch('/api/categories')
       const json = await res.json()
       if (json.success) return json.data
       return []
     }
   })

   const loading = parentsLoading || catLoading

   React.useEffect(() => {
     setMounted(true)
   }, [])

   React.useEffect(() => {
     if (mounted && !loading && categories.length > 0) {
        const entity = categories.find((c: any) => String(c.id).trim() === String(id).trim())
        if (entity) {
           setFormData({
              ...entity,
              id: String(id),
              parent_id: entity.parent_id !== null && entity.parent_id !== undefined ? String(entity.parent_id) : "null"
           })
        } else {
           toast.error("Taxonomy Record Not Found")
        }
     }
   }, [categories, loading, mounted, id])

   React.useEffect(() => {
      if (formData.name && !loading) {
         setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
      }
   }, [formData.name, loading])

   const updateMutation = useMutation({
      mutationFn: async () => {
        const res = await fetch('/api/categories', {
          method: 'PATCH',
          body: JSON.stringify(formData)
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.error || "Registry rejected identity transition.")
        return json
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        toast.success("Identity Synchronized", { description: "Taxonomy record updated in vault." })
        router.push('/admin/categories')
      },
      onError: (error: any) => {
        toast.error("Sync Failure", { description: error.message || "Update Failure" })
      }
   })

   const deleteMutation = useMutation({
      mutationFn: async () => {
        const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
        const json = await res.json()
        if (!json.success) throw new Error("Delete failed.")
        return json
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['categories'] })
        toast.success("Cluster Purged")
        router.push('/admin/categories')
      },
      onError: () => {
        toast.error("Purge Failed")
      }
   })

   const handleSave = (e: React.FormEvent) => {
      e.preventDefault()
      updateMutation.mutate()
   }

   const handleDelete = () => {
      if (confirm(`CRITICAL: Are you sure you want to purge the "${formData.name}" taxonomy cluster? This may leave orphaned assets.`)) {
         deleteMutation.mutate()
      }
   }

   if (!mounted) return null

   if (!mounted) return null

   return (
      <DashboardLayout>
         <div className="max-w-7xl mx-auto px-4 py-8 lg:px-12 pb-20 font-sans animate-in fade-in duration-500">
            {loading ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                  <Layers className="size-16 text-blue-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Retrieving Taxonomy Context...</p>
               </div>
            ) : !formData.name ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                  <div className="size-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                     <Trash2 className="size-8 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Entity Disappeared</h3>
                  <p className="text-sm font-bold text-gray-500 max-w-xs mt-2">The taxonomy registry was unable to locate identifier <span className="bg-gray-100 px-2 py-0.5 rounded text-rose-500">{id}</span></p>
                  <Button onClick={() => router.push('/admin/categories')} variant="outline" className="mt-8 h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest">Return to Registry</Button>
               </div>
            ) : (
               <>
                  {/* Header & Fatal Action Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
                     <div className="space-y-2">
                        <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                           <Link href="/admin/categories" className="hover:text-blue-600 transition-colors">Product Categories</Link>
                           <span className="opacity-20">/</span>
                           <span className="text-gray-900 dark:text-white">Edit Taxonomy</span>
                        </nav>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                           Edit Category: <span className="text-blue-600">{formData.name}</span>
                        </h1>
                     </div>
                     <Button onClick={handleDelete} className="h-12 px-8 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/20 active:scale-95 transition-all">
                        <Trash2 className="size-4 mr-2" /> Purge Taxonomy
                     </Button>
                  </div>

                  <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                     {/* Primary Configuration (75%) */}
                     <div className="lg:col-span-9 space-y-12">
                        <div className="bg-white dark:bg-gray-950 rounded-[3rem] border border-gray-200 dark:border-gray-800 p-8 lg:p-14 shadow-sm space-y-12 transition-all hover:ring-2 hover:ring-blue-500/5">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <FormInput label="Namespace Identifier" required>
                                 <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold tracking-tight text-lg" />
                              </FormInput>
                              <FormInput label="System Slug (Reference)">
                                 <div className="relative group">
                                    <Input value={formData.slug} disabled className="h-12 pl-4 bg-gray-100/50 border-gray-100 rounded-xl font-bold text-xs uppercase opacity-40" />
                                 </div>
                              </FormInput>

                              <FormInput label="Registry Parent Hierarchy" help="Group this within a parent taxonomy cluster">
                                 <Select key={`${parentCategories.length}-${formData.parent_id}`} value={formData.parent_id} onValueChange={(v) => setFormData({ ...formData, parent_id: v || "null" })}>
                                    <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold text-gray-900 font-sans">
                                       <SelectValue placeholder="Select parent cluster" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-3xl border-gray-200 shadow-3xl font-bold p-1 overflow-hidden font-sans">
                                       <SelectItem value="null">None (Root Level Asset)</SelectItem>
                                       {parentCategories.map((p: any) => (
                                          <SelectItem key={p.id} value={String(p.id)}>{String(p.name)}</SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>
                              </FormInput>

                              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100 group transition-all hover:border-blue-500/10">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vault Visibility</span>
                                    <span className="text-xs font-bold text-gray-900">{formData.visibility ? "Active in Stock Distribution" : "Access Restricted"}</span>
                                 </div>
                                 <Switch checked={formData.visibility} onCheckedChange={v => setFormData({ ...formData, visibility: v })} className="data-[state=checked]:bg-emerald-500" />
                              </div>

                              <div className="md:col-span-2 space-y-4">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taxonomy Abstract</label>
                                 <RichTextEditor value={formData.description || ""} onChange={v => setFormData({ ...formData, description: v })} />
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                           <Button type="submit" disabled={updateMutation.isPending} className="h-14 px-14 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                              {updateMutation.isPending ? "Synchronizing Asset..." : "Save Changes"}
                           </Button>
                           <Button type="button" onClick={() => router.back()} variant="ghost" className="h-14 px-10 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 rounded-2xl">
                              Discard Transitions
                           </Button>
                        </div>
                     </div>

                     {/* Taxonomy Metadata Sidebar (25%) */}
                     <aside className="lg:col-span-3 space-y-8 lg:sticky lg:top-8">
                        <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-8 shadow-sm space-y-10 group transition-all">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-5">Registry Temporal Flow</h4>
                           <div className="space-y-8">
                              <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-2">
                                    <Clock className="size-3.5 text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created at</span>
                                 </div>
                                 <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-5 tabular-nums">
                                    {new Date(formData.created_at).toLocaleDateString()}
                                 </span>
                              </div>
                              <div className="flex flex-col gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                 <div className="flex items-center gap-2">
                                    <History className="size-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Modified at</span>
                                 </div>
                                 <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-5 tabular-nums">
                                    {new Date(formData.updated_at).toLocaleString()}
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black text-white space-y-6 shadow-2xl border border-white/5 relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 size-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                           <Layers className="size-8 text-blue-500 opacity-60" />
                           <h5 className="text-sm font-black uppercase tracking-[0.1em] leading-tight">Taxonomy Master Sync</h5>
                           <p className="text-[10px] font-bold opacity-50 leading-relaxed uppercase tracking-widest">
                              Updating this cluster synchronizes the organizational identity across the Global Shared Stock Repository.
                           </p>
                           <div className="pt-2">
                              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit">
                                 <div className="size-1 bg-blue-500 rounded-full animate-pulse" /> Asset Identity Synchronized
                              </div>
                           </div>
                        </div>
                     </aside>
                  </form>
               </>
            )}
         </div>
      </DashboardLayout>
   )
}
