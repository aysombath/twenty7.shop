"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { QrCode, Image as ImageIcon, Save, Printer, GripVertical, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { InvoiceTemplate, InvoiceConfig, BlockId } from "@/components/dashboard/invoice-template"

const DEFAULT_CONFIG: InvoiceConfig = {
  companyName: "Twenty 7 Shop",
  companyAddress: "123 Commerce St\nSan Francisco, CA 94105\n+1 (555) 123-4567",
  themeColor: "text-pink-600",
  showLogo: true,
  showQR: true,
  blocks: ['header', 'metadata', 'table', 'footer'],
  sellerSignatureName: ""
}

export default function InvoiceSettingsPage() {
  const [draggedBlock, setDraggedBlock] = useState<BlockId | null>(null)
  const [config, setConfig] = useState<InvoiceConfig>(DEFAULT_CONFIG)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('invoice_settings')
    if (saved) {
      try {
        setConfig(JSON.parse(saved))
      } catch (e) {
        // ignore parse error
      }
    }
    setIsLoaded(true)
  }, [])

  const handleSave = () => {
    localStorage.setItem('invoice_settings', JSON.stringify(config))
    toast.success("Invoice configuration saved!")
  }

  const handleDragStart = (e: React.DragEvent, id: BlockId) => {
    setDraggedBlock(id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, id: BlockId) => {
    e.preventDefault()
    if (!draggedBlock || draggedBlock === id) return

    const newBlocks = [...config.blocks]
    const draggedIndex = newBlocks.indexOf(draggedBlock)
    const targetIndex = newBlocks.indexOf(id)

    newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, draggedBlock)
    
    setConfig({ ...config, blocks: newBlocks })
  }

  const handleDragEnd = () => {
    setDraggedBlock(null)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      setConfig({ ...config, qrCodeDataUrl: evt.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const blockLabels: Record<BlockId, string> = {
    header: "Brand & Header Section",
    metadata: "Title & Metadata Section",
    table: "Itemized Table Section",
    footer: "Footer & Totals Section"
  }

  // Mock order for the live preview
  const mockOrder = {
    order_number: "INV27032620",
    customer_name: "John Doe",
    order_date: new Date().toISOString(),
    status: "paid",
    total_price: 84.00,
    currency: "USD",
    address: {
      street: "456 Business Road, Suite 100",
      city: "New York",
      state: "NY",
      zip: "10001"
    },
    items: [
      { description: "Bracelet custom name", quantity: 2, unit_price: 14.00, total: 28.00 },
      { description: "Necklace silver chain", quantity: 1, unit_price: 36.00, total: 36.00 },
      { description: "Ring resizing service", quantity: 1, unit_price: 20.00, total: 20.00 }
    ]
  }

  if (!isLoaded) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
        
        {/* Left Sidebar Configurator */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full overflow-y-auto no-scrollbar shadow-xl z-10 shrink-0">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Invoice Builder</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Template Editor</p>
            </div>
            <Button size="sm" onClick={handleSave} className="bg-blue-600 text-white rounded-xl shadow-md gap-2">
              <Save className="size-3.5" /> Save
            </Button>
          </div>

          <div className="p-6 flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Core Identity</h3>
              
              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Company Name</Label>
                <Input 
                  value={config.companyName} 
                  onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                  className="bg-gray-50 dark:bg-gray-950 rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Company Address</Label>
                <textarea 
                  value={config.companyAddress}
                  onChange={(e) => setConfig({ ...config, companyAddress: e.target.value })}
                  className="flex w-full rounded-xl border border-input bg-gray-50 dark:bg-gray-950 px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-y"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Seller Signature Name</Label>
                <p className="text-[10px] text-gray-400 -mt-1">This name will appear on the Seller signature line of every generated invoice.</p>
                <Input 
                  value={config.sellerSignatureName || ''}
                  onChange={(e) => setConfig({ ...config, sellerSignatureName: e.target.value })}
                  placeholder="e.g. John Smith — Director of Sales"
                  className="bg-gray-50 dark:bg-gray-950 rounded-xl font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">Brand Color Theme</Label>
                <div className="flex items-center gap-3">
                  {[
                    { bg: 'bg-pink-600', txt: 'text-pink-600' },
                    { bg: 'bg-blue-600', txt: 'text-blue-600' },
                    { bg: 'bg-emerald-600', txt: 'text-emerald-600' },
                    { bg: 'bg-violet-600', txt: 'text-violet-600' },
                    { bg: 'bg-amber-500', txt: 'text-amber-500' },
                    { bg: 'bg-slate-900', txt: 'text-slate-900' }
                  ].map(color => (
                    <button
                      key={color.txt}
                      onClick={() => setConfig({ ...config, themeColor: color.txt })}
                      className={`size-6 rounded-full shadow-sm border-2 transition-all ${color.bg} ${config.themeColor === color.txt ? 'border-white ring-2 ring-blue-500 scale-110' : 'border-transparent hover:scale-110'}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Elements Visibility</h3>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><QrCode className="size-4" /></div>
                  <Label className="text-sm font-bold text-slate-700 dark:text-gray-300">QR Code Module</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch 
                    checked={config.showQR} 
                    onCheckedChange={(c) => setConfig({ ...config, showQR: c })} 
                  />
                </div>
              </div>
              
              {/* Custom QR Code Upload */}
              {config.showQR && (
                <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300 ml-10 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <Label htmlFor="qr-upload" className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600">
                    <UploadCloud className="size-3.5" />
                    {config.qrCodeDataUrl ? 'Change Custom QR' : 'Upload Custom QR'}
                  </Label>
                  {config.qrCodeDataUrl && (
                    <button onClick={() => setConfig({ ...config, qrCodeDataUrl: undefined })} className="text-[10px] text-red-500 font-bold uppercase tracking-widest hover:underline">
                      Reset
                    </button>
                  )}
                  <input id="qr-upload" type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><ImageIcon className="size-4" /></div>
                  <Label className="text-sm font-bold text-slate-700 dark:text-gray-300">Company Logo</Label>
                </div>
                <Switch 
                  checked={config.showLogo} 
                  onCheckedChange={(c) => setConfig({ ...config, showLogo: c })} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4 border-t border-gray-100 dark:border-gray-800 mb-20">
              <div className="flex flex-col gap-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Layout Arranger</h3>
                <p className="text-[10px] text-gray-400">Drag and drop sections to reorder the PDF layout.</p>
              </div>
              
              <div className="flex flex-col gap-2">
                {config.blocks.map((block) => (
                  <div 
                    key={block}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block)}
                    onDragOver={(e) => handleDragOver(e, block)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-950 border dark:border-gray-800 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${draggedBlock === block ? 'opacity-50 scale-95 border-blue-500 shadow-blue-500/20' : 'border-gray-100'}`}
                  >
                    <GripVertical className="size-4 text-gray-300 flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{blockLabels[block]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="flex-1 overflow-y-auto bg-gray-100/50 dark:bg-[#0a0a0a] p-4 lg:p-12 pb-32 flex justify-center print:bg-white print:p-0 print:overflow-visible">
          <div className="fixed top-24 right-12 z-50 print:hidden hidden lg:flex items-center gap-2">
            <Button onClick={handlePrint} variant="outline" className="bg-white rounded-xl shadow-lg border-gray-200 gap-2 h-11 px-6 hover:text-blue-600">
              <Printer className="size-4" /> Print Preview
            </Button>
          </div>

          <div 
            id="invoice-paper"
            className="rounded-none lg:rounded-2xl shadow-2xl print:shadow-none print:rounded-none relative bg-white"
          >
            <InvoiceTemplate config={config} order={mockOrder as any} />

            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * { visibility: hidden; }
                #invoice-paper, #invoice-paper * { visibility: visible; }
                #invoice-paper { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border-radius: 0; padding: 0mm; }
                .bg-gray-50\\/80 { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; }
                .text-pink-600 { color: #db2777 !important; -webkit-print-color-adjust: exact; }
                .text-blue-600 { color: #2563eb !important; -webkit-print-color-adjust: exact; }
                .bg-red-500 { background-color: #ef4444 !important; -webkit-print-color-adjust: exact; }
                aside, nav, header { display: none !important; }
              }
            `}} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
