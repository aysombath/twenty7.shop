"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InvoiceTemplate, InvoiceConfig, OrderData } from "@/components/dashboard/invoice-template"
import { jsPDF } from "jspdf"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  User, Calendar, Hash, LayoutGrid, Box, DollarSign,
  Trash2, Send, Mail, FileText, Plus, Globe, Briefcase,
  Eye, EyeOff, ChevronRight, Percent, Tag, X, Building2
} from "lucide-react"

type LineItem = {
  id: string
  name: string
  qty: number
  tax: number
  amount: number
}

// ── Floating Label Input ───────────────────────────────────────────────────
function FloatInput({
  label, value, onChange, type = "text", icon: Icon, placeholder, required, className = ""
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; icon?: any; placeholder?: string; required?: boolean; className?: string
}) {
  return (
    <div className={`relative group ${className}`}>
      {Icon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
          <Icon className="size-4" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || " "}
        className={`peer w-full h-14 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-semibold text-gray-900 dark:text-white pt-5 pb-1 transition-all
          focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
          ${Icon ? "pl-10 pr-4" : "px-4"}`}
      />
      <label className={`absolute text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all
        peer-placeholder-shown:text-xs peer-placeholder-shown:top-4
        top-2 peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500
        ${Icon ? "left-10" : "left-4"}`}
      >
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
    </div>
  )
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  // Biller / Customer state
  const [billers, setBillers] = useState<{ id: string; name: string; address: string; email?: string; phone?: string }[]>([])
  const [isBillerModalOpen, setIsBillerModalOpen] = useState(false)
  const [newBiller, setNewBiller] = useState({ name: "", address: "", email: "", phone: "" })

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    billedTo: "",
    dateIssue: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
    currency: "usd",
    notes: "",
  })

  // Discount state
  const [discount, setDiscount] = useState<{ label: string; amount: number } | null>(null)
  const [showDiscountForm, setShowDiscountForm] = useState(false)
  const [discountDraft, setDiscountDraft] = useState({ label: "", amount: "" })

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", name: "", qty: 1, tax: 0, amount: 0 },
  ])

  // Computed
  const subtotal = items.reduce((s, i) => s + i.qty * i.amount, 0)
  const totalTax = items.reduce((s, i) => s + i.qty * i.amount * (i.tax / 100), 0)
  const discountAmt = discount ? discount.amount : 0
  const grandTotal = Math.max(0, subtotal + totalTax - discountAmt)

  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceConfig | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("invoice_settings")
    if (saved) {
      try { setInvoiceConfig(JSON.parse(saved)) } catch { }
    } else {
      setInvoiceConfig({
        companyName: "Twenty 7 Shop",
        companyAddress: "123 Commerce St\nSan Francisco, CA 94105",
        themeColor: "text-blue-600",
        showLogo: true,
        showQR: true,
        blocks: ["header", "metadata", "table", "footer"],
      })
    }

    const loadData = async () => {
      try {
        const [prodRes, custRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/customers", { headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` } })
        ])
        const prodData = await prodRes.json()
        const custData = await custRes.json()
        
        if (prodData.success && prodData.data) setProducts(prodData.data)
        if (custData.success && custData.data) {
           setBillers(custData.data.map((c: any) => ({
             id: c.id.toString(),
             name: c.name,
             address: c.address || "",
             email: c.email,
             phone: c.phone || ""
           })))
        }
      } catch (err) {
        console.error("Data fetch error:", err)
      }
    }
    
    loadData()
  }, [])

  const selectedBiller = billers.find(b => b.name === formData.billedTo)

  const mappedOrder: OrderData = {
    order_number: formData.invoiceNumber,
    customer_name: formData.billedTo || "—",
    seller_name: formData.fullName || undefined,
    order_date: formData.dateIssue,
    status: "draft",
    total_price: grandTotal,
    subtotal,
    tax_amount: totalTax,
    discount_amount: discountAmt,
    discount_type: discount?.label,
    currency: formData.currency,
    address: { street: selectedBiller?.address || formData.billedTo },
    customer_email: selectedBiller?.email,
    customer_phone: selectedBiller?.phone,
    items: items
      .filter(i => i.name || i.amount > 0)
      .map(i => ({
        description: i.name || "—",
        quantity: i.qty,
        unit_price: i.amount,
        total: i.qty * i.amount,
      })),
    notes: formData.notes,
  }

  const submitInvoice = async (status: "draft" | "sent") => {
    const tid = status === "draft" ? "draft-toast" : "send-toast"
    toast.loading(status === "draft" ? "Saving draft…" : "Sending invoice…", { id: tid })
    try {
      const payload = { 
        ...mappedOrder, 
        invoice_number: formData.invoiceNumber, 
        due_date: formData.dueDate, 
        status 
      }
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        // If status is 'sent', trigger the email logic
        if (status === 'sent') {
          toast.loading('Generating PDF for attachment...', { id: tid })
          try {
            const el = document.getElementById('live-preview-node-export')
            if (el) {
              const { toPng } = await import('html-to-image')
              const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true })
              const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
              const pdfWidth = pdf.internal.pageSize.getWidth()
              const elRect = el.getBoundingClientRect()
              const pdfHeight = (elRect.height * pdfWidth) / elRect.width
              pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
              
              const pdfBase64 = pdf.output('datauristring')

              toast.loading('Delivering to recipient via Resend...', { id: tid })
              const emailRes = await fetch('/api/invoices/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  invoice_number: formData.invoiceNumber,
                  customer_email: selectedBiller?.email,
                  customer_name: selectedBiller?.name,
                  pdf_base64: pdfBase64,
                  seller_name: formData.fullName
                })
              })
              const emailJson = await emailRes.json()
              if (!emailJson.success) throw new Error(emailJson.error || 'Email delivery failed')
            }
          } catch (pdfErr: any) {
            console.error('Email pipeline error:', pdfErr)
            toast.error('Invoice saved, but email failed', { id: tid, description: pdfErr.message })
            // We don't return here because the invoice WAS saved. We just show an error.
          }
        }

        toast.success(status === "draft" ? "✓ Draft saved" : "✓ Invoice sent & emailed", {
          id: tid,
          description: `Invoice #${formData.invoiceNumber}`,
        })
        setTimeout(() => router.push("/invoices"), 1500)
      } else throw new Error(json.error || "Request failed")
    } catch (e: any) {
      toast.error("Failed", { id: tid, description: e.message })
    }
  }

  const handleItemChange = (id: string, field: keyof LineItem, value: any) =>
    setItems(items.map(i => (i.id === id ? { ...i, [field]: value } : i)))

  const currency = formData.currency === "khr" ? "៛" : "$"
  const fmt = (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden font-sans bg-slate-50 dark:bg-gray-950">

        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-3.5 flex items-center justify-between gap-4 z-20 shadow-sm">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none">Create Invoice</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">New billing document</p>
            </div>
            <div className="hidden lg:flex items-center gap-2 ml-6 pl-6 border-l border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Preview</span>
              <Switch
                checked={showPreview}
                onCheckedChange={setShowPreview}
                className="data-[state=checked]:bg-blue-500 scale-90"
              />
              {showPreview
                ? <Eye className="size-3.5 text-blue-500" />
                : <EyeOff className="size-3.5 text-gray-400" />
              }
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => submitInvoice("draft")}
              className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-widest gap-1.5 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:text-blue-600 transition-all"
            >
              <FileText className="size-3.5" /> Save Draft
            </Button>
            <Button
              onClick={() => submitInvoice("sent")}
              disabled={!formData.billedTo || isExporting}
              className="h-9 px-5 rounded-xl text-xs font-bold uppercase tracking-widest gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="size-3.5" /> Send Invoice
            </Button>
          </div>
        </header>

          {/* ── Studio Body ─────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800">
            <div className="max-w-3xl mx-auto p-6 space-y-6 pb-32">

              {/* ── Section: Invoice Info ─────────────────────────── */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <h2 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Invoice Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {/* Issued By */}
                  <FloatInput
                    label="Issued By — Seller Name"
                    value={formData.fullName}
                    onChange={v => setFormData({ ...formData, fullName: v })}
                    icon={User}
                    placeholder=" "
                    required
                  />

                  {/* Billed To + Add */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-focus-within:text-blue-500 z-10 transition-colors">
                        <Briefcase className="size-4" />
                      </div>
                      <label className="absolute left-10 top-2 text-[10px] font-black uppercase tracking-widest text-gray-400 z-10 pointer-events-none">
                        Billed To <span className="text-rose-500">*</span>
                      </label>
                      <Select 
                        value={formData.billedTo} 
                        onValueChange={(v: string | null) => {
                          const biller = billers.find(b => b.name === v)
                          setFormData({ 
                            ...formData, 
                            billedTo: v ?? '',
                            // Optionally we could store more info here in hidden fields
                          })
                        }}
                      >
                        <SelectTrigger className="h-14 pl-10 pt-5 rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm font-semibold focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500">
                          <SelectValue placeholder="Search master index…" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800 shadow-2xl font-medium max-h-[300px] overflow-y-auto z-[100] bg-white dark:bg-gray-950">
                          {billers.length === 0 && (
                            <div className="py-6 text-center text-gray-400 text-xs font-bold uppercase tracking-widest opacity-50">Empty Archive</div>
                          )}
                          {billers.map(b => (
                            <SelectItem key={b.id || b.name} value={b.name} className="py-2.5 outline-none focus:bg-blue-50/50 dark:focus:bg-blue-900/10">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-lg bg-blue-50 dark:bg-blue-800/20 flex items-center justify-center shrink-0">
                                  <Building2 className="size-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm tracking-tight">{b.name}</p>
                                  <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{b.address}</p>
                                  {(b.email || b.phone) && (
                                    <p className="text-[9px] text-blue-500 font-black mt-0.5 uppercase tracking-wider">
                                      {[b.email, b.phone].filter(Boolean).join(' • ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => setIsBillerModalOpen(true)}
                      className="size-14 shrink-0 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>

                  {/* Invoice Number */}
                  <FloatInput
                    label="Invoice Number"
                    value={formData.invoiceNumber}
                    onChange={v => setFormData({ ...formData, invoiceNumber: v })}
                    icon={Hash}
                    required
                    className="font-mono"
                  />

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <FloatInput
                      label="Issue Date"
                      value={formData.dateIssue}
                      onChange={v => setFormData({ ...formData, dateIssue: v })}
                      type="date"
                      icon={Calendar}
                      required
                    />
                    <FloatInput
                      label="Due Date"
                      value={formData.dueDate}
                      onChange={v => setFormData({ ...formData, dueDate: v })}
                      type="date"
                      icon={Calendar}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* ── Section: Items ───────────────────────────────────── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                    <h2 className="text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300">Items & Services</h2>
                  </div>
                  {/* Currency */}
                  <Select value={formData.currency} onValueChange={(v: string | null) => setFormData({ ...formData, currency: v ?? 'usd' })}>
                    <SelectTrigger className="h-8 w-auto px-3 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs font-bold gap-1.5">
                      <Globe className="size-3 text-gray-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl text-xs font-bold shadow-xl">
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="khr">KHR (៛)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-3 mb-1 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <div className="col-span-5">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Tax %</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-1" />
                </div>

                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2.5 group hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                      {/* Name */}
                      <div className="col-span-5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black text-gray-300 tabular-nums w-4 shrink-0">{idx + 1}</span>
                          <input
                            list={`pl-${item.id}`}
                            value={item.name}
                            onChange={e => handleItemChange(item.id, "name", e.target.value)}
                            placeholder="Item or service…"
                            className="w-full text-xs font-semibold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder:text-gray-300"
                          />
                          <datalist id={`pl-${item.id}`}>
                            {products.map((p, i) => <option key={i} value={p.product_name} />)}
                          </datalist>
                        </div>
                      </div>
                      {/* Qty */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.qty}
                          min={1}
                          onChange={e => handleItemChange(item.id, "qty", Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-right bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      {/* Tax */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.tax}
                          min={0}
                          max={100}
                          onChange={e => handleItemChange(item.id, "tax", Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-right bg-transparent border-none outline-none text-gray-700 dark:text-gray-300"
                        />
                      </div>
                      {/* Amount */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={item.amount}
                          min={0}
                          step={0.01}
                          onChange={e => handleItemChange(item.id, "amount", Number(e.target.value))}
                          className="w-full text-xs font-mono font-bold text-right bg-transparent border-none outline-none text-blue-600"
                        />
                      </div>
                      {/* Delete */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => setItems(items.filter(i => i.id !== item.id))}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/20 hover:text-rose-600 text-gray-400 transition-all"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setItems([...items, { id: Math.random().toString(), name: "", qty: 1, tax: 0, amount: 0 }])}
                  className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all"
                >
                  <Plus className="size-3.5" /> Add Line Item
                </button>
              </section>

              {/* ── Section: Summary + Discount ─────────────────────── */}
              <section className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Subtotal</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{currency}{fmt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-semibold">Tax</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">{currency}{fmt(totalTax)}</span>
                </div>

                {/* Discount pill */}
                {discount && (
                  <div className="flex items-center justify-between bg-rose-50 dark:bg-rose-900/15 border border-rose-100 dark:border-rose-800/30 rounded-xl px-3 py-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <Tag className="size-3 text-rose-500" />
                      <span className="text-xs font-bold text-rose-600">{discount.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-rose-600">-{currency}{fmt(discount.amount)}</span>
                      <button onClick={() => { setDiscount(null); setShowDiscountForm(false) }} className="text-rose-400 hover:text-rose-600 transition-colors">
                        <X className="size-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Discount form */}
                {showDiscountForm && !discount && (
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Custom Discount</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Label</Label>
                        <Input
                          value={discountDraft.label}
                          onChange={e => setDiscountDraft({ ...discountDraft, label: e.target.value })}
                          placeholder="e.g. Loyalty Bonus"
                          className="h-9 text-xs font-semibold mt-1 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 rounded-lg"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Amount</Label>
                        <div className="relative mt-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">{currency}</span>
                          <Input
                            type="number"
                            value={discountDraft.amount}
                            onChange={e => setDiscountDraft({ ...discountDraft, amount: e.target.value })}
                            placeholder="0.00"
                            className="h-9 pl-6 text-xs font-mono font-bold border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-950 rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => { setShowDiscountForm(false); setDiscountDraft({ label: "", amount: "" }) }} className="h-7 px-3 text-xs font-bold">Cancel</Button>
                      <Button
                        onClick={() => {
                          const amt = parseFloat(discountDraft.amount)
                          if (discountDraft.label.trim() && !isNaN(amt) && amt > 0) {
                            setDiscount({ label: discountDraft.label.trim(), amount: amt })
                            setShowDiscountForm(false)
                            setDiscountDraft({ label: "", amount: "" })
                          } else toast.error("Enter a valid label and amount")
                        }}
                        className="h-7 px-4 text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-sm"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                )}

                {!discount && !showDiscountForm && (
                  <button
                    onClick={() => setShowDiscountForm(true)}
                    className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Plus className="size-3" /> Add Discount
                  </button>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                  <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Grand Total</span>
                  <span className="text-2xl font-black text-blue-600 tracking-tight">{currency}{fmt(grandTotal)}</span>
                </div>
              </section>

              {/* ── Section: Notes ──────────────────────────────────── */}
              <section>
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">
                  Notes / Payment Terms
                </Label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="e.g. Payment due within 30 days. Bank transfer preferred."
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-none transition-all"
                />
              </section>

            </div>
          </div>

          {/* ── MODAL: Live Preview ─────────────────────────────────────── */}
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-[95vw] sm:max-w-4xl xl:max-w-[1000px] h-[90vh] p-0 overflow-hidden flex flex-col bg-slate-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800 shadow-2xl rounded-2xl transition-all duration-500">
              <DialogHeader className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <div>
                    <DialogTitle className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white leading-none">Document Preview</DialogTitle>
                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 tracking-widest uppercase truncate">Invoice snapshot for #{formData.invoiceNumber}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mr-10">
                  <Button
                    disabled={isExporting}
                    onClick={async () => {
                      setIsExporting(true)
                      toast.loading("Generating PDF…", { id: "pdf" })
                      try {
                        const el = document.getElementById("live-preview-node-export")
                        if (el) {
                          const { toPng } = await import("html-to-image")
                          const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true })
                          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                          const pdfWidth = pdf.internal.pageSize.getWidth()
                          const elRect = el.getBoundingClientRect()
                          const pdfHeight = (elRect.height * pdfWidth) / elRect.width
                          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                          pdf.save(`Invoice_${formData.invoiceNumber}.pdf`)
                          toast.success("PDF Downloaded", { id: "pdf" })
                        }
                      } catch (err) {
                        toast.error("PDF failed", { id: "pdf" })
                      }
                      setIsExporting(false)
                    }}
                    className="h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <FileText className="size-3.5" /> 
                    {isExporting ? "Exporting…" : "Download PDF"}
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 pb-24 flex flex-col items-center bg-gray-100/50 dark:bg-gray-950/40">
                {/* Scale the template to fit modal width if needed */}
                <div className="transition-all duration-500 transform-gpu origin-top scale-[0.42] sm:scale-[0.55] md:scale-[0.75] lg:scale-[0.9] xl:scale-100 drop-shadow-2xl shrink-0 mt-4 mb-20 pointer-events-none">
                  {invoiceConfig ? (
                    <InvoiceTemplate config={invoiceConfig} order={mappedOrder} />
                  ) : (
                    <div className="w-[210mm] min-h-[297mm] bg-white flex items-center justify-center text-gray-300 text-sm font-bold uppercase rounded-lg">
                      Loading template…
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

      {/* ── Add Biller Modal ─────────────────────────────────────────────── */}
      {isBillerModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 pb-4">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Add New Biller</h3>
                <p className="text-xs text-gray-500 mt-0.5">Create a billing entity for this invoice</p>
              </div>
              <button onClick={() => setIsBillerModalOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-all">
                <X className="size-4" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Biller Name <span className="text-rose-500">*</span></Label>
                <Input
                  value={newBiller.name}
                  onChange={e => setNewBiller({ ...newBiller, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className="h-11 font-semibold rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Billing Address</Label>
                <Input
                  value={newBiller.address}
                  onChange={e => setNewBiller({ ...newBiller, address: e.target.value })}
                  placeholder="123 Business Rd, City, Country"
                  className="h-11 font-semibold rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email</Label>
                  <Input
                    type="email"
                    value={newBiller.email}
                    onChange={e => setNewBiller({ ...newBiller, email: e.target.value })}
                    placeholder="billing@company.com"
                    className="h-11 font-semibold rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Phone</Label>
                  <Input
                    value={newBiller.phone}
                    onChange={e => setNewBiller({ ...newBiller, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="h-11 font-semibold rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsBillerModalOpen(false)} className="flex-1 h-10 rounded-xl font-bold text-xs uppercase tracking-widest">
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!newBiller.name.trim() || !newBiller.email.trim()) { 
                      toast.error("Name and email are required"); 
                      return 
                    }
                    
                    toast.loading("Synchronizing with vault…", { id: "biller" })
                    try {
                      const res = await fetch("/api/customers", {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
                        },
                        body: JSON.stringify(newBiller)
                      })
                      const data = await res.json()
                      if (!data.success) throw new Error(data.error)

                      // Update local state
                      const created = {
                        id: data.data.id.toString(),
                        ...newBiller
                      }
                      setBillers(prev => [created, ...prev])
                      setFormData({ ...formData, billedTo: created.name })
                      setNewBiller({ name: "", address: "", email: "", phone: "" })
                      setIsBillerModalOpen(false)
                      toast.success("Identity Enrolled", { description: created.name, id: "biller" })
                    } catch (err: any) {
                      toast.error("Enrollment failed", { description: err.message, id: "biller" })
                    }
                  }}
                  className="flex-1 h-11 rounded-xl font-bold text-xs uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  Authorize Entry <Plus className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Off-screen PDF Target ───────────────────────────────────────── */}
      <div className="fixed left-[200vw] top-0 pointer-events-none z-[-1] bg-white">
        {invoiceConfig && (
          <InvoiceTemplate
            config={invoiceConfig}
            order={mappedOrder}
            id="live-preview-node-export"
          />
        )}
      </div>
    </DashboardLayout>
  )
}
