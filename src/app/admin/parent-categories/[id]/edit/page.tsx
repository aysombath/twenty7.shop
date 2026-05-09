"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderTree, Bold, Italic, Underline, Strikethrough, Link as LinkIcon, Heading2, List, ListOrdered, Quote, Code, Undo2, Redo2, AlignLeft, AlignCenter } from "lucide-react"
import { toast } from "sonner"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

const FormInput = ({ label, required, children, className }: { label: string; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5 w-full", className)}>
    <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gray-500">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    {children}
  </div>
)

const RichTextEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-inner">
    <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
      {[Bold, Italic, Underline, Strikethrough, LinkIcon, Heading2, AlignLeft, AlignCenter, List, ListOrdered, Quote, Code, Undo2, Redo2].map((Icon, i) => (
        <button key={i} type="button" className="size-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 opacity-60 hover:opacity-100 transition-all">
          <Icon className="size-4" />
        </button>
      ))}
    </div>
    <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder="Describe this parent category..." className="min-h-[200px] border-none focus-visible:ring-0 p-6 font-bold text-sm leading-relaxed bg-transparent" />
  </div>
)

export default function EditParentCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const queryClient = useQueryClient()
  const [mounted, setMounted] = React.useState(false)
  const [formData, setFormData] = React.useState({ name: "", slug: "", description: "", visibility: true })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const { isLoading: loading, data: parentCategories = [] } = useQuery({
    queryKey: ['parent-categories'],
    queryFn: async () => {
       const res = await fetch('/api/parent-categories')
       const json = await res.json()
       if (json.success) return json.data
       return []
    }
  })

  React.useEffect(() => {
    if (mounted && !loading && parentCategories.length > 0) {
       const item = parentCategories.find((c: any) => String(c.id) === String(id))
       if (item) {
          setFormData({ name: item.name, slug: item.slug || '', description: item.description || '', visibility: item.visibility })
       } else {
          toast.error("Parent category not found")
       }
    }
  }, [parentCategories, loading, mounted, id])

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/parent-categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...formData })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Update failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-categories'] })
      toast.success("Updated", { description: `${formData.name} has been updated.` })
      router.push('/admin/parent-categories')
    },
    onError: (error: any) => {
      toast.error("Network error", { description: error.message })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error("Name is required"); return }
    updateMutation.mutate()
  }

  if (!mounted) return null

  return (
      <DashboardLayout>
         <div className="max-w-7xl mx-auto px-4 py-8 lg:px-12 pb-20 font-sans animate-in fade-in duration-500">
            {loading ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                  <div className="size-16 rounded-3xl bg-blue-50 animate-pulse border border-blue-100 flex items-center justify-center">
                     <FolderTree className="size-8 text-blue-500 opacity-50" />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Retrieving Taxonomy Context...</p>
               </div>
            ) : !formData.name ? (
               <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
                  <div className="size-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                     <FolderTree className="size-8 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">Entity Disappeared</h3>
                  <p className="text-sm font-bold text-gray-500 max-w-xs mt-2">The parent taxonomy registry was unable to locate this identifier.</p>
                  <Button onClick={() => router.push('/admin/parent-categories')} variant="outline" className="mt-8 h-12 px-8 rounded-xl font-bold text-xs uppercase tracking-widest">Return to Registry</Button>
               </div>
            ) : (
               <>
                  {/* Header & Fatal Action Row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
                     <div className="space-y-2">
                        <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
                           <Link href="/admin/parent-categories" className="hover:text-blue-600 transition-colors">Parent Categories</Link>
                           <span className="opacity-20">/</span>
                           <span className="text-gray-900 dark:text-white">Edit Parent Taxonomy</span>
                        </nav>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-4">
                           Edit Parent: <span className="text-blue-600">{formData.name}</span>
                        </h1>
                     </div>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
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

                              <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100 group transition-all hover:border-blue-500/10">
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
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-gray-900 to-black text-white space-y-6 shadow-2xl border border-white/5 relative overflow-hidden group">
                           <div className="absolute -right-4 -top-4 size-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                           <FolderTree className="size-8 text-blue-500 opacity-60" />
                           <h5 className="text-sm font-black uppercase tracking-[0.1em] leading-tight">Master Hierarchy</h5>
                           <p className="text-[10px] font-bold opacity-50 leading-relaxed uppercase tracking-widest">
                              This establishes a top-level organizational root for child categories to map into.
                           </p>
                        </div>
                     </aside>
                  </form>
               </>
            )}
         </div>
      </DashboardLayout>
   )
}
