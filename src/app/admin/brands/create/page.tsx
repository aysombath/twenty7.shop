"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
  Globe
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

export default function CreateBrandPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    website: "",
    description: "",
    visibility: true
  })

  // Auto-slug generator
  React.useEffect(() => {
     setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
  }, [formData.name])

  const createMutation = useMutation({
    mutationFn: async () => {
       const res = await fetch('/api/brands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
       })
       const json = await res.json()
       if (!json.success) throw new Error(json.error || "Registration Failure")
       return json
    },
    onSuccess: (data, variables, context) => {
       queryClient.invalidateQueries({ queryKey: ['brands'] })
       toast.success("Identity Registered", { description: `${formData.name} is now part of the atelier.` })
    },
    onError: (error: any) => {
       toast.error("Vault Locked", { description: error.message || "The registry is currently unreachable." })
    }
  })

  const handleSubmit = (e: React.FormEvent, stay: boolean = false) => {
    e.preventDefault()
    if (!formData.name || !formData.website) {
       toast.error("Required fields missing")
       return
    }

    createMutation.mutate(undefined, {
      onSuccess: () => {
         if (stay) {
            setFormData({ name: "", slug: "", website: "", description: "", visibility: true })
         } else {
            router.push('/admin/brands')
         }
      }
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 py-12 lg:px-10 pb-20 font-sans">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col gap-6 mb-12 items-center text-center">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <Link href="/admin/brands" className="hover:text-blue-600 transition-colors">Brands</Link>
            <span className="opacity-20">/</span>
            <span className="text-gray-900 dark:text-white">Create</span>
          </nav>
          <div className="size-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-center justify-center shadow-inner">
             <Award className="size-8 text-blue-600 animate-in zoom-in-75 duration-500" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Register New Brand</h1>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-10">
           <div className="bg-white dark:bg-gray-950 rounded-[2rem] border border-gray-200 dark:border-gray-800 p-8 lg:p-12 shadow-2xl space-y-10 transition-all hover:ring-2 hover:ring-blue-500/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <FormInput label="Identifier Name" required>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      placeholder="e.g. Hermès" 
                      className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500/10" 
                    />
                 </FormInput>
                 <FormInput label="System Slug">
                    <Input 
                      value={formData.slug} 
                      onChange={e => setFormData({...formData, slug: e.target.value})} 
                      placeholder="hermes" 
                      className="h-12 bg-gray-100/30 border-gray-200 rounded-xl font-bold opacity-60 flex items-center gap-2" 
                    />
                 </FormInput>
                 <FormInput label="Official Website" required className="md:col-span-2">
                    <div className="relative group">
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 opacity-60 group-hover:text-blue-500 transition-colors" />
                       <Input 
                         value={formData.website} 
                         onChange={e => setFormData({...formData, website: e.target.value})} 
                         placeholder="https://www.hermes.com" 
                         className="h-12 pl-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold tracking-tight" 
                       />
                    </div>
                 </FormInput>

                 <div className="md:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-gray-50/30 border border-gray-100 group transition-all hover:bg-white hover:border-blue-500/10">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Master Visibility</span>
                       <span className="text-xs font-bold text-gray-900">Enable brand registry display</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={cn("text-[8px] font-black uppercase tracking-widest", formData.visibility ? "text-emerald-500" : "text-gray-400")}>
                          {formData.visibility ? "Active" : "Hidden"}
                       </span>
                       <Switch checked={formData.visibility} onCheckedChange={v => setFormData({...formData, visibility: v})} className="data-[state=checked]:bg-blue-600" />
                    </div>
                 </div>

                 <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Manifesto & Description</label>
                    <RichTextEditor value={formData.description} onChange={v => setFormData({...formData, description: v})} />
                 </div>
              </div>
           </div>

           {/* Actions Footer */}
           <div className="flex flex-col md:flex-row items-center gap-4 justify-center py-8">
              <Button type="submit" disabled={createMutation.isPending} className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
                 {createMutation.isPending ? "Processing..." : "Register Identity"}
              </Button>
              <Button type="button" onClick={(e) => handleSubmit(e, true)} variant="outline" className="h-14 px-8 border-gray-200 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50">
                 Create & create another
              </Button>
              <Button type="button" onClick={() => router.back()} variant="ghost" className="h-14 px-8 font-bold text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 rounded-2xl">
                 Cancel
              </Button>
           </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
