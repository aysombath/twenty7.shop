"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Plus, 
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
  ChevronDown,
  Info,
  Award,
  Globe,
  Trash2,
  ExternalLink,
  History,
  Clock
} from "lucide-react"
import { toast } from "sonner"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

// --- Components ---

const FormInput = ({ label, required, help, children, className }: { label: string, required?: boolean, help?: string, children: React.ReactNode, className?: string }) => (
  <div className={cn("space-y-1.5 w-full", className)}>
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
      {label} {required && <span className="text-rose-500">*</span>}
      {help && <Info className="size-3.5 opacity-40 cursor-help" />}
    </label>
    {children}
  </div>
)

const RichTextEditor = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
  <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ring-1 ring-gray-100/50 dark:ring-gray-900/50 shadow-inner">
     <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
        {[Bold, Italic, Underline, Strikethrough, LinkIcon, Heading2, Heading3, AlignLeft, AlignCenter, List, ListOrdered, TableIcon, Quote, Code, Undo2, Redo2].map((Icon, i) => (
           <Button key={i} variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-white dark:hover:bg-gray-800 opacity-60 hover:opacity-100 transition-all">
              <Icon className="size-4" />
           </Button>
        ))}
     </div>
     <Textarea 
       value={value} 
       onChange={e => onChange(e.target.value)} 
       placeholder="Define the architectural vision of this brand..." 
       className="min-h-[250px] border-none focus-visible:ring-0 p-6 font-bold text-sm leading-relaxed bg-transparent" 
     />
  </div>
)

export default function EditBrandPage() {
  const router = useRouter()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState({
    id: id as string,
    name: "",
    slug: "",
    website: "",
    description: "",
    visibility: true,
    created_at: "",
    updated_at: ""
  })

  const { isLoading: loading } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const res = await fetch('/api/brands')
      const json = await res.json()
      if (json.success && json.data) {
        const brand = json.data.find((b: any) => b.id.toString() === id)
        if (brand) setFormData(brand)
        return json.data
      }
      return []
    }
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/brands', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Update Failure")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success("Identity Synchronized", { description: "The brand vault record has been updated." })
      router.push('/admin/brands')
    },
    onError: (error: any) => {
      toast.error("Update Failure", { description: error.message })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/brands?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error("Purge Failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast.success("Identity Purged")
      router.push('/admin/brands')
    },
    onError: () => toast.error("Purge Failed")
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate()
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to purge this brand identity?")) {
      deleteMutation.mutate()
    }
  }

  if (loading) return (
     <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
           <Award className="size-12 text-blue-500 animate-pulse" />
           <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Retrieving Brand Record...</p>
        </div>
     </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 lg:px-10 pb-20 font-sans">
        {/* Header Block & Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="space-y-1.5">
             <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
               <Link href="/admin/brands" className="hover:text-blue-600 transition-colors">Brands</Link>
               <span className="opacity-20">/</span>
               <span>{formData.name}</span>
               <span className="opacity-20">/</span>
               <span className="text-gray-900 dark:text-white">Edit</span>
             </nav>
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
               Edit Identity: {formData.name}
             </h1>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" onClick={() => window.open(formData.website, '_blank')} className="h-11 px-6 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-50 border-gray-200">
                <ExternalLink className="size-4 mr-2 opacity-50" /> Visit website
             </Button>
             <Button onClick={handleDelete} className="h-11 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all">
                <Trash2 className="size-4 mr-2" /> Delete
             </Button>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
           {/* Main Content (75%) */}
           <div className="lg:col-span-8 space-y-10">
              <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-200 dark:border-gray-800 p-8 lg:p-12 shadow-sm space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormInput label="Identifier Name" required>
                       <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                    </FormInput>
                    <FormInput label="System Slug">
                       <Input value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="h-12 bg-gray-100/30 border-gray-200 rounded-xl font-bold opacity-60" />
                    </FormInput>
                    <FormInput label="Official Website" required className="md:col-span-2">
                       <Input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                    </FormInput>

                    <div className="md:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-gray-50/30 border border-gray-100 group transition-all hover:bg-white hover:border-blue-500/10">
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Master Visibility</span>
                          <span className="text-xs font-bold text-gray-900">{formData.visibility ? "Display active in sales channels" : "Record hidden from distribution"}</span>
                       </div>
                       <Switch checked={formData.visibility} onCheckedChange={v => setFormData({...formData, visibility: v})} className="data-[state=checked]:bg-emerald-500" />
                    </div>

                    <div className="md:col-span-2 space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Identity Manifest</label>
                       <RichTextEditor value={formData.description || ""} onChange={v => setFormData({...formData, description: v})} />
                    </div>
                 </div>
              </div>

              {/* Action Footer */}
              <div className="flex items-center gap-4 py-4">
                 <Button type="submit" disabled={saveMutation.isPending} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                    {saveMutation.isPending ? "Synchronizing..." : "Save Changes"}
                 </Button>
                 <Button type="button" onClick={() => router.back()} variant="ghost" className="h-14 px-8 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 rounded-2xl">
                    Cancel
                 </Button>
              </div>
           </div>

           {/* Metadata Sidebar (25%) */}
           <aside className="lg:col-span-4 space-y-8 lg:sticky lg:top-8">
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-8 shadow-sm space-y-8">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 pb-4">Identity Metadata</h4>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4 group">
                       <div className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all">
                          <Clock className="size-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Created at</span>
                          <span className="text-xs font-bold text-gray-700">{new Date(formData.created_at).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-4 group">
                       <div className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all">
                          <History className="size-5" />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Last synchronized</span>
                          <span className="text-xs font-bold text-gray-700">{new Date(formData.updated_at).toLocaleString()}</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 text-white space-y-4 shadow-2xl shadow-blue-500/20">
                 <Award className="size-10 opacity-30" />
                 <h5 className="text-sm font-black uppercase tracking-widest">Atelier Master Sync</h5>
                 <p className="text-[10px] font-bold opacity-70 leading-relaxed uppercase tracking-widest">
                    Synchronizing this brand record will update the architectural mapping across all categorized products.
                 </p>
              </div>
           </aside>
        </form>
      </div>
    </DashboardLayout>
  )
}
