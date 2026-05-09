"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Layers,
  ArrowRight,
  Eye,
  Type
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
           <button key={i} type="button" className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 opacity-60 hover:opacity-100 transition-all">
              <Icon className="size-4" />
           </button>
        ))}
     </div>
     <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Describe the taxonomy cluster..." className="min-h-[300px] border-none focus-visible:ring-0 p-8 font-bold text-sm leading-relaxed bg-transparent" />
  </div>
)

export default function CreateCategoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [mounted, setMounted] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
    visibility: true,
    parent_id: "null" as string
  })

  const { data: parentCategories = [] } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: async () => {
      const res = await fetch('/api/parent-categories')
      const json = await res.json()
      if (json.success) return json.data
      return []
    }
  })

  React.useEffect(() => {
     setMounted(true)
  }, [])

  React.useEffect(() => {
     setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
  }, [formData.name])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/categories', {
         method: 'POST',
         body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Registration Failure")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['parent-categories'] })
      toast.success("Taxonomy Entity Registered", { description: `${formData.name} added to vault.` })
    },
    onError: (error: any) => {
      toast.error(error.message || "Registry vault unreachable.")
    }
  })

  const handleSubmit = async (e: React.FormEvent, stay: boolean = false) => {
    e.preventDefault()
    if (!formData.name) {
       toast.error("Cluster Name Required")
       return
    }

    createMutation.mutate(undefined, {
       onSuccess: () => {
          if (stay) {
             setFormData({ name: "", slug: "", description: "", visibility: true, parent_id: "null" })
          } else {
             router.push('/admin/categories')
          }
       }
    })
  }

  if (!mounted) return null

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 lg:px-10 pb-20 font-sans">
        <div className="flex flex-col gap-8 mb-12 items-start">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <Link href="/admin/categories" className="hover:text-blue-600 transition-colors">Product Categories</Link>
            <span className="opacity-20">/</span>
            <span className="text-gray-900 dark:text-white">Create</span>
          </nav>
          <div className="flex items-center gap-4">
             <div className="size-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border-blue-100 flex items-center justify-center shadow-inner">
                <Layers className="size-8 text-blue-600" />
             </div>
             <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Create Product Category</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
           <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 p-8 lg:p-14 shadow-sm space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <FormInput label="Namespace Identifier" required>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Leather Accessories" className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
                 </FormInput>
                 <FormInput label="System Slug (Automatic)">
                    <div className="relative">
                       <Type className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                       <Input value={formData.slug} disabled className="h-12 pl-12 bg-gray-100/50 border-gray-100 rounded-xl font-bold text-xs uppercase opacity-60" />
                    </div>
                 </FormInput>

                 <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100 group transition-all hover:bg-white hover:border-blue-500/10">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vault Visibility</span>
                       <span className="text-xs font-bold text-gray-900">Render cluster in catalog sales</span>
                    </div>
                    <Switch checked={formData.visibility} onCheckedChange={v => setFormData({...formData, visibility: v})} className="data-[state=checked]:bg-emerald-500 shadow-md" />
                 </div>

                 <FormInput label="Parent Taxonomy Category" help="Group this entity under a parent structure">
                     <Select value={formData.parent_id} onValueChange={v => setFormData({...formData, parent_id: v || "null"})}>
                        <SelectTrigger className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold font-sans">
                           <SelectValue placeholder="Root Level Asset" />
                        </SelectTrigger>
                        <SelectContent className="bg-white rounded-xl shadow-2xl border-none font-sans font-bold">
                           <SelectItem value="null">Root Level — Independent</SelectItem>
                           {parentCategories.map((p: any) => (
                              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </FormInput>

                 <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Taxonomy Abstract</label>
                    <RichTextEditor value={formData.description} onChange={v => setFormData({...formData, description: v})} />
                 </div>
              </div>
           </div>

           <div className="flex flex-col md:flex-row items-center gap-4 py-8">
              <Button type="submit" disabled={createMutation.isPending} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                 {createMutation.isPending ? "Processing..." : "Create Category"}
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, true)} variant="outline" className="h-14 px-8 border-gray-200 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50">
                 Create & Create Another
              </Button>
              <Button type="button" onClick={() => router.back()} variant="ghost" className="h-14 px-8 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 rounded-2xl opacity-60 hover:opacity-100">
                 Cancel
              </Button>
           </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
