"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FolderTree, Info, Bold, Italic, Underline, Strikethrough, Link as LinkIcon, Heading2, List, ListOrdered, Quote, Code, Undo2, Redo2, AlignLeft, AlignCenter } from "lucide-react"
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

export default function CreateParentCategoryPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [formData, setFormData] = React.useState({ name: "", slug: "", description: "", visibility: true })

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }))
  }, [formData.name])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/parent-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Create failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parent-categories'] })
      toast.success("Parent category created", { description: `${formData.name} has been added.` })
    },
    onError: (error: any) => {
      toast.error("Network error", { description: error.message })
    }
  })

  const handleSubmit = (e: React.FormEvent, stay = false) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error("Name is required"); return }
    createMutation.mutate(undefined, {
      onSuccess: () => {
        if (stay) setFormData({ name: "", slug: "", description: "", visibility: true })
        else router.push('/admin/parent-categories')
      }
    })
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 lg:px-10 pb-20 font-sans">
        <div className="flex flex-col gap-6 mb-12 items-start">
          <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-gray-400">
            <Link href="/admin/parent-categories" className="hover:text-blue-600 transition-colors">Parent Categories</Link>
            <span className="opacity-20">/</span>
            <span className="text-gray-900 dark:text-white">Create</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-3xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 flex items-center justify-center shadow-inner">
              <FolderTree className="size-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Create Parent Category</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-200 dark:border-gray-800 p-8 lg:p-14 shadow-sm space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <FormInput label="Name" required>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Clothing & Apparel" className="h-12 bg-gray-50/50 border-gray-200 rounded-xl font-bold" />
              </FormInput>
              <FormInput label="Slug (Auto-generated)">
                <Input value={formData.slug} disabled className="h-12 bg-gray-100/50 border-gray-100 rounded-xl font-bold text-xs opacity-60" />
              </FormInput>
              <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:border-blue-500/10 transition-all">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Visibility</span>
                  <span className="text-xs font-bold text-gray-900">Show in catalog</span>
                </div>
                <Switch checked={formData.visibility} onCheckedChange={v => setFormData({ ...formData, visibility: v })} className="data-[state=checked]:bg-emerald-500 shadow-md" />
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                <RichTextEditor value={formData.description} onChange={v => setFormData({ ...formData, description: v })} />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4 py-6">
            <Button type="submit" disabled={createMutation.isPending} className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
              {createMutation.isPending ? "Creating..." : "Create Parent Category"}
            </Button>
            <Button type="button" onClick={e => handleSubmit(e, true)} variant="outline" className="h-14 px-8 border-gray-200 font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-50">
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
