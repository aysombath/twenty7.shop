import React from "react"
import { QrCode } from "lucide-react"

export type BlockId = 'header' | 'metadata' | 'table' | 'footer'

export interface InvoiceConfig {
  companyName: string
  companyAddress: string
  themeColor: string
  showLogo: boolean
  showQR: boolean
  qrCodeDataUrl?: string
  blocks: BlockId[]
  sellerSignatureName?: string
}

export interface OrderData {
  order_number: string
  customer_name: string
  seller_name?: string
  order_date: string | Date
  status: string
  total_price: string | number
  currency: string
  items?: { description: string; quantity: number; unit_price: number | string; total: number | string }[]
  address?: { street?: string; city?: string; state?: string; zip?: string }
  subtotal?: number | string
  tax_amount?: number | string
  discount_amount?: number | string
  discount_type?: string
  notes?: string
  customer_email?: string
  customer_phone?: string
}

interface InvoiceTemplateProps {
  config: InvoiceConfig
  order: OrderData
  id?: string
}

export function InvoiceTemplate({ config, order, id }: InvoiceTemplateProps) {
  
  // Format dates securely
  const formattedDate = order.order_date ? new Date(order.order_date).toLocaleDateString() : 'N/A'
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30) // Due 30 days after
  const formattedDue = dueDate.toLocaleDateString()

  // Format money safely
  const formatMoney = (val: string | number) => {
    return parseFloat(String(val || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const items = order.items && order.items.length > 0 
    ? order.items 
    : [
        { description: "Standard Service", quantity: 1, unit_price: order.total_price, total: order.total_price }
      ]

  const addressFormat = order.address 
    ? <>{order.address.street || 'Address N/A'}<br/>{order.address.city || ''}, {order.address.state || ''} {order.address.zip || ''}</>
    : <>No Address Provided</>

  const renderBlock = (blockId: BlockId) => {
    switch (blockId) {
      case 'header':
        return (
          <div key="header" className="flex justify-between items-start mb-8 break-inside-avoid">
            <div className="flex flex-col gap-1">
              <h1 className={`text-4xl font-black font-sans tracking-tight ${config.themeColor}`}>
                {config.companyName || 'Company Name'}
              </h1>
              <p className="text-gray-500 text-sm whitespace-pre-line mt-2">
                {config.companyAddress || 'Contact Details'}
              </p>
            </div>
            {config.showQR && (
              <div className="relative size-24 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0 overflow-hidden">
                {config.qrCodeDataUrl ? (
                  <img src={config.qrCodeDataUrl} alt="Custom QR" className="object-cover w-full h-full" />
                ) : (
                  <QrCode className="size-full text-gray-800" />
                )}
                {config.showLogo && !config.qrCodeDataUrl && (
                  <div className="absolute inset-0 m-auto size-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <div className="size-4 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>
            )}
          </div>
        )
      case 'metadata':
        return (
          <div key="metadata" className="mb-10 break-inside-avoid">
            <h2 className="text-5xl font-black text-slate-900 mb-2 tracking-tight uppercase">Invoice</h2>
            <p className={`font-bold ${config.themeColor} mb-8`}>
              Submitted on {formattedDate}
            </p>
            
            <div className="grid grid-cols-2 gap-12 text-sm">
              <div className="flex flex-col gap-4">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Invoice For</h3>
                <div className="text-slate-800 font-medium leading-relaxed">
                  <p className="font-bold text-base">{order.customer_name || 'Customer Name'}</p>
                  <p>{addressFormat}</p>
                  {(order.customer_email || order.customer_phone) && (
                    <div className="mt-2 text-[11px] text-gray-500 font-bold border-t border-gray-100 pt-2 space-y-0.5">
                      {order.customer_email && <p>Email: {order.customer_email}</p>}
                      {order.customer_phone && <p>Phone: {order.customer_phone}</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">Order Details</h3>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <span className="text-gray-500 font-medium">Invoice #</span>
                  <span className="text-slate-900 font-bold text-right uppercase">{order.order_number || 'INV-000'}</span>
                  
                  <span className="text-gray-500 font-medium">Due Date</span>
                  <span className="text-slate-900 font-bold text-right">{formattedDue}</span>

                  <span className="text-gray-500 font-medium">Order Status</span>
                  <span className="text-slate-900 font-bold text-right uppercase">{order.status || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <hr className="mt-8 border-gray-200" />
          </div>
        )
      case 'table':
        return (
          <div key="table" className="mb-10 min-h-[200px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-slate-900 text-xs font-black uppercase tracking-widest border-b-2 border-slate-900">
                  <th className="py-4 px-2">Description</th>
                  <th className="py-4 px-2 text-right">Qty</th>
                  <th className="py-4 px-2 text-right">Unit Price</th>
                  <th className="py-4 px-2 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className={`${idx % 2 === 0 ? "bg-gray-50/80" : "bg-white"} break-inside-avoid`}>
                    <td className="py-4 px-2 text-slate-700 font-medium">{item.description}</td>
                    <td className="py-4 px-2 text-right text-slate-600">{item.quantity}</td>
                    <td className="py-4 px-2 text-right text-slate-600">${formatMoney(item.unit_price)}</td>
                    <td className="py-4 px-2 text-right font-bold text-slate-900">${formatMoney(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      case 'footer':
        return (
          <div key="footer" className="mt-auto pt-8 flex flex-col gap-6 break-inside-avoid">
            {/* Signatures */}
            <div className="grid grid-cols-2 gap-10 items-end mb-4 px-4 pb-8 border-b border-gray-100">
              <div className="flex flex-col items-center">
                <div className="w-48 border-b-2 border-slate-300 mb-2 h-16 flex items-end justify-center">
                  <span className="text-3xl text-slate-800/80 mb-1" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    {order.seller_name || config.sellerSignatureName || order.customer_name}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Signature Seller</span>
                {(order.seller_name || config.sellerSignatureName) && (
                  <span className="text-[9px] font-bold text-gray-500 mt-0.5">{order.seller_name || config.sellerSignatureName}</span>
                )}
              </div>
              <div className="flex flex-col items-center">
                <div className="w-48 border-b-2 border-slate-300 mb-2 h-16 flex items-end justify-center">
                  <span className="text-3xl text-slate-800/80 mb-1" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                    {order.customer_name}
                  </span>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Signature Biller</span>
                <span className="text-[9px] font-bold text-gray-500 mt-0.5">{order.customer_name}</span>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <div className="max-w-[50%]">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Notes:</p>
                <p className="text-xs text-gray-500 leading-relaxed italic whitespace-pre-line">
                  {order.notes || "Payment is strictly due within 30 days of invoice date. Please include the invoice number on your check or transfer."}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 pr-2 shrink-0 min-w-[200px]">
                <div className="flex justify-between w-full">
                  <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Subtotal</span>
                  <span className="text-slate-700 font-bold text-sm">${formatMoney(order.subtotal !== undefined ? order.subtotal : order.total_price)}</span>
                </div>
                {order.tax_amount !== undefined && (
                  <div className="flex justify-between w-full">
                    <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Tax</span>
                    <span className="text-slate-700 font-bold text-sm">${formatMoney(order.tax_amount)}</span>
                  </div>
                )}
                {order.discount_amount !== undefined && Number(order.discount_amount) > 0 && (
                  <div className="flex justify-between w-full">
                    <span className="text-rose-500 font-bold uppercase tracking-wider text-xs">Discount {order.discount_type ? `(${order.discount_type})` : ''}</span>
                    <span className="text-rose-600 font-bold text-sm">-${formatMoney(order.discount_amount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between w-full items-center mt-2 pt-2 border-t-2 border-slate-900">
                  <span className="text-slate-900 font-black uppercase tracking-widest text-sm">Grand Total</span>
                  <span className={`text-3xl font-black ${config.themeColor}`}>
                    ${formatMoney(order.total_price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div 
      id={id}
      className="w-[210mm] min-h-[297mm] bg-white flex flex-col p-[25mm] shadow-none"
      style={{ 
        fontFamily: "'Inter', 'Roboto', sans-serif",
      }}
    >
      {config.blocks.map(renderBlock)}
    </div>
  )
}
