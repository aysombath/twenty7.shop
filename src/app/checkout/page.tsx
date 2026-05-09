"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, ShoppingBag, ShieldCheck, Zap, Trash2, PackageOpen, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShopNavbar } from "@/components/shop/navbar"
import { useCart } from "@/lib/cart-store"

export default function CheckoutPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

    const subtotal = totalPrice()
    const totalDiscount = items.reduce((acc, item) => {
       const discount = (item.comparePrice && item.comparePrice > item.price) 
          ? (item.comparePrice - item.price) * item.quantity 
          : 0
       return acc + discount
    }, 0)

    return (
      <main className="bg-white dark:bg-black min-h-screen">
        <ShopNavbar />
        
        <div className="container mx-auto px-6 pt-40 pb-24">
          <div className="flex flex-col lg:flex-row gap-20">
            {/* Left Column: Registry Items */}
            <div className="flex-1 space-y-12">
              <div className="space-y-4">
                 <Link href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors group">
                    <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" />
                    Back to Repository
                 </Link>
                 <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase">
                    Registry<br />Overview
                 </h1>
              </div>
  
              <div className="space-y-8">
                 {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.id} className="flex gap-8 p-8 bg-gray-50 dark:bg-zinc-950 rounded-[2rem] border border-gray-100 dark:border-zinc-900 group">
                        <div className="size-40 rounded-3xl overflow-hidden bg-gray-100 dark:bg-zinc-900 shrink-0 border border-gray-100 dark:border-zinc-800 shadow-inner">
                          <img src={item.image} className="size-full object-cover transition-all duration-700" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div className="space-y-1">
                              <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">{item.series || 'Precision Series'}</span>
                              <h3 className="text-2xl font-bold tracking-tight">{item.name}</h3>
                          </div>
                          <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-3">
                                 <div className="flex items-center gap-3">
                                    <span className="text-xl font-black italic text-gray-900 dark:text-white">${(item.price * item.quantity).toLocaleString()}</span>
                                    {item.comparePrice && item.comparePrice > item.price && (
                                       <span className="text-sm font-bold text-gray-400 line-through">${(item.comparePrice * item.quantity).toLocaleString()}</span>
                                    )}
                                 </div>
                                 <div className="flex items-center gap-4 bg-gray-100 dark:bg-zinc-900 rounded-2xl p-1.5 w-fit border border-gray-200/50 dark:border-zinc-800/50 shadow-sm">
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="size-8 rounded-xl hover:bg-white dark:hover:bg-black hover:shadow-md transition-all"
                                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    >
                                       <Minus className="size-3.5" />
                                    </Button>
                                    <span className="text-xs font-black w-6 text-center">{item.quantity}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="size-8 rounded-xl hover:bg-white dark:hover:bg-black hover:shadow-md transition-all"
                                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                       <Plus className="size-3.5" />
                                    </Button>
                                 </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                onClick={() => removeItem(item.id)}
                                className="size-12 p-0 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              >
                                 <Trash2 className="size-5" />
                              </Button>
                          </div>
                        </div>
                      </div>
                    ))
                 ) : (
                    <div className="py-24 flex flex-col items-center justify-center text-center gap-6 border-2 border-dashed border-gray-100 dark:border-zinc-900 rounded-[3rem]">
                       <PackageOpen className="size-20 stroke-[0.5px] opacity-20" />
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-40">Your Registry is Empty</p>
                          <Link href="/" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline">Return to repository</Link>
                       </div>
                    </div>
                 )}
              </div>
            </div>
  
            {/* Right Column: Checkout Summary */}
            <div className="w-full lg:w-[400px] space-y-8">
               <div className="p-10 bg-black text-white rounded-[3rem] space-y-10 shadow-2xl relative overflow-hidden">
                  <Zap className="absolute top-0 right-0 size-40 text-blue-500 opacity-10 -translate-y-1/2 translate-x-1/2" />
                  
                  <h2 className="text-3xl font-black tracking-tighter uppercase">Summary</h2>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>Assets ({totalItems()})</span>
                        <span>${(subtotal + totalDiscount).toLocaleString()}</span>
                     </div>
                     {totalDiscount > 0 && (
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-rose-500">
                           <span>Total Savings</span>
                           <span>-${totalDiscount.toLocaleString()}</span>
                        </div>
                     )}
                     <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-40">
                        <span>Transport</span>
                        <span>Calculated next step</span>
                     </div>
                     <div className="h-px bg-white/10 my-6" />
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Estate</span>
                        <span className="text-2xl font-black italic">${subtotal.toLocaleString()}</span>
                     </div>
                  </div>

                <Button 
                  disabled={items.length === 0}
                  className="w-full h-16 rounded-2xl bg-white text-black hover:bg-blue-600 hover:text-white disabled:opacity-20 transition-all font-black text-[10px] uppercase tracking-[0.3em] gap-4"
                >
                   Proceed to Transfer
                   <ShieldCheck className="size-4" />
                </Button>
             </div>

             <div className="p-8 border border-gray-100 dark:border-zinc-900 rounded-[2rem] space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40">Integrity Protocol</h4>
                <p className="text-[10px] font-medium leading-relaxed uppercase tracking-widest opacity-60">
                   All transactions are secured via high-performance encryption. Assets are dispatched within 24 hours of session verification.
                </p>
             </div>
          </div>
        </div>
      </div>
    </main>
  )
}
