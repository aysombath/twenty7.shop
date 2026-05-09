"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ShoppingBag, ShieldCheck, Plus, Minus } from "lucide-react"
import { ShopProduct } from "./product-card"
import { useCart } from "@/lib/cart-store"
import { toast } from "sonner"

interface ProductDetailsModalProps {
  product: ShopProduct | null
  isOpen: boolean
  onClose: () => void
}

export function ProductDetailsModal({ product, isOpen, onClose }: ProductDetailsModalProps) {
  const addItem = useCart((state) => state.addItem)
  const [selectedVariant, setSelectedVariant] = React.useState<any>(null)
  const [quantity, setQuantity] = React.useState(1)

  React.useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    } else {
      setSelectedVariant(null)
    }
    setQuantity(1)
  }, [product])

  if (!product) return null

  const isDiscountActive = () => {
    const activePrice = selectedVariant?.discountPrice || product.discountPrice
    if (!activePrice) return false
    const now = new Date()
    if (product.discountStart && new Date(product.discountStart) > now) return false
    if (product.discountEnd && new Date(product.discountEnd) < now) return false
    return true
  }

  const activePromo = isDiscountActive()
  const activeDiscount = activePromo ? (selectedVariant?.discountPrice || product.discountPrice) : null
  const displayPrice = activeDiscount || selectedVariant?.price || product.price
  const originalPrice = selectedVariant?.price || product.price
  const displayImage = selectedVariant?.image || product.image
  const displayName = selectedVariant ? `${product.name} — ${selectedVariant.name}` : product.name

  const handleAddToCart = () => {
    addItem({
      id: selectedVariant?.sku || `${product.id}-${selectedVariant?.name || 'default'}`,
      name: displayName,
      price: displayPrice,
      comparePrice: originalPrice,
      image: displayImage,
      series: product.category,
      quantity: quantity
    })
    toast.success("Registry Synchronized", {
      description: `${quantity}x ${displayName} added.`
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none shadow-[0_32px_64px_rgba(0,0,0,0.2)] rounded-[3rem]">
        <div className="flex flex-col md:flex-row h-full">
          {/* Visual Side */}
          <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-gray-100 dark:bg-zinc-900 overflow-hidden">
            <img 
              src={displayImage} 
              key={displayImage}
              className="size-full object-cover grayscale hover:grayscale-0 transition-all duration-1000 animate-in fade-in zoom-in-95" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Details Side */}
          <div className="w-full md:w-1/2 p-12 flex flex-col justify-between">
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-600">{product.category} Registry</span>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-20">Secure Asset</span>
                </div>
                <DialogTitle className="text-4xl font-black tracking-tighter uppercase leading-none">
                  {product.name}
                </DialogTitle>
                <div className="flex items-center gap-4 pt-2">
                   <div className="text-2xl font-black italic text-gray-900 dark:text-white">
                      ${displayPrice.toLocaleString()}
                   </div>
                   {activeDiscount && (
                     <div className="text-sm font-bold text-gray-400 line-through">
                       ${originalPrice.toLocaleString()}
                     </div>
                   )}
                </div>
              </div>

              <DialogDescription className="text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400 uppercase tracking-widest line-clamp-4">
                {product.description || `A hyper-engineered asset from the ${product.category} series. Features modular integrity, AES-256 encrypted registry signatures, and global deployment capability.`}
              </DialogDescription>

              {/* Variants Selection */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-4 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Modular Configuration</span>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => setSelectedVariant(v)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          selectedVariant?.name === v.name
                            ? "bg-black dark:bg-white text-white dark:text-black border-transparent shadow-lg scale-105"
                            : "bg-transparent text-gray-400 border-gray-200 dark:border-zinc-800 hover:border-gray-400"
                        )}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="space-y-4 pt-2">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-30">Deployment Quantity</span>
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-zinc-900 w-fit p-2 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-xl"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="text-sm font-black w-8 text-center">{quantity}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="size-8 rounded-xl"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-4">
               <Button 
                onClick={handleAddToCart}
                className="w-full h-16 rounded-2xl bg-black dark:bg-white text-white dark:text-black hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.3em] gap-4 shadow-xl"
               >
                  Sync {quantity > 1 ? `${quantity} Assets` : 'Asset'} to Registry
                  <ShoppingBag className="size-4" />
               </Button>
               
               <div className="flex items-center justify-center gap-2 opacity-20">
                  <ShieldCheck className="size-3" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">Encrypted Transfer Protocol — Origin Certified</span>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
