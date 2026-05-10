"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Eye, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useCart } from "@/lib/cart-store"
import { toast } from "sonner"
import { ProductDetailsModal } from "./product-details-modal"

export type ProductVariant = {
  id?: string
  name: string
  price?: number
  sku?: string
  stock?: number
  image?: string
  discountPrice?: number
}

export type ShopProduct = {
  id: string
  name: string
  price: number
  category: string
  image: string
  description?: string
  discountPrice?: number
  discountStart?: string
  discountEnd?: string
  variants?: ProductVariant[]
  categoryId?: string
  isNew?: boolean
  isPopular?: boolean
}

export function ProductCard({ product }: { product: ShopProduct }) {
  const router = useRouter()
  const addItem = useCart((state) => state.addItem)
  const { toggleFavorite, isFavorite } = useCart()
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
  const [activeVariant, setActiveVariant] = React.useState<ProductVariant | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  )

  const isDiscountActive = () => {
    if (!product.discountPrice && !activeVariant?.discountPrice) return false
    const now = new Date()
    if (product.discountStart && new Date(product.discountStart) > now) return false
    if (product.discountEnd && new Date(product.discountEnd) < now) return false
    return true
  }

  const activePromo = isDiscountActive()

  const displayImage = activeVariant?.image || product.image
  const displayPrice = activeVariant?.price || product.price

  const checkAuth = () => {
    const user = sessionStorage.getItem('atelier_user')
    return !!user
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const displayName = activeVariant ? `${product.name} — ${activeVariant.name}` : product.name
    const activeDiscount = activePromo ? (activeVariant?.discountPrice || product.discountPrice) : null
    const finalPrice = activeDiscount || displayPrice
    
    addItem({
      id: activeVariant?.sku || `${product.id}-${activeVariant?.name || 'default'}`,
      name: displayName,
      price: finalPrice,
      image: displayImage,
      series: product.category,
      quantity: 1
    })
    toast.success("Registry Synchronized", {
      description: `${displayName} has been added to your local assets.`
    })
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!checkAuth()) {
      toast.error("Authentication Required", {
        description: "Please login to manage your favorite assets."
      })
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }

    toggleFavorite(product.id)
    const active = isFavorite(product.id)
    toast.success(active ? "Asset De-indexed" : "Asset Bookmarked", {
      description: active ? "Removed from your private collection." : "Saved to your architectural registry."
    })
  }

  return (
    <>
      <div className="group relative flex flex-col gap-4 cursor-pointer" onClick={() => setIsDetailsOpen(true)}>
        <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-gray-900 group-hover:shadow-2xl transition-all duration-700">
          <img
            src={displayImage}
            alt={product.name}
            className="size-full object-cover transition-transform duration-1000 group-hover:scale-110"
          />

          {/* Overlays */}
          <div className="absolute inset-x-0 bottom-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500 z-10">
            <Button 
              onClick={handleAddToCart}
              className="w-full h-14 rounded-2xl bg-white/95 backdrop-blur-md text-black hover:bg-white font-black text-xs uppercase tracking-widest gap-3 shadow-2xl"
            >
              <ShoppingBag className="size-4" />
              Add to Registry
            </Button>
          </div>

          <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500 delay-100 z-10">
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={handleFavorite}
              className={cn(
                "size-11 rounded-full backdrop-blur-md shadow-xl transition-colors",
                isFavorite(product.id) 
                  ? "bg-rose-500 text-white hover:bg-rose-600" 
                  : "bg-white/90 hover:bg-white text-black"
              )}
            >
              <Heart className={cn("size-4", isFavorite(product.id) && "fill-current")} />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              onClick={(e) => {
                e.stopPropagation()
                setIsDetailsOpen(true)
              }}
              className="size-11 rounded-full bg-white/90 backdrop-blur-md hover:bg-white text-black shadow-xl"
            >
              <Eye className="size-4" />
            </Button>
          </div>

          <div className="absolute top-6 left-6 flex flex-wrap gap-2 z-10">
            {activePromo && (
              <Badge className="bg-rose-600 text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest animate-pulse">
                Promotion Event
              </Badge>
            )}
            {product.isNew && (
              <Badge className="bg-blue-600 text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
                Origin
              </Badge>
            )}
            {product.isPopular && (
              <Badge className="bg-amber-500 text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest">
                Trending
              </Badge>
            )}
            {product.variants && product.variants.length > 0 && (
              <Badge className="bg-zinc-800 text-white border-none px-3 py-1 rounded-full font-black text-[9px] uppercase tracking-widest border border-white/10">
                Modular
              </Badge>
            )}
          </div>

          {/* Subtle glass effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        </div>

        <div className="px-2 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{product.category}</span>
            <div className="flex items-center gap-2">
              {activePromo ? (
                <>
                  <span className="text-sm font-black text-rose-600">
                    ${(activeVariant?.discountPrice || product.discountPrice || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 line-through">
                    ${displayPrice.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-sm font-black text-gray-900 dark:text-white">
                  ${displayPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors duration-300">
              {product.name}
            </h3>
            {/* Variant Indicators */}
            {product.variants && product.variants.length > 0 && (
              <div className="flex gap-1.5">
                {product.variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveVariant(v)
                    }}
                    className={cn(
                      "size-3 rounded-full border transition-all",
                      activeVariant?.name === v.name
                        ? "bg-black dark:bg-white border-transparent scale-125"
                        : "bg-gray-200 dark:bg-zinc-800 border-transparent hover:scale-110"
                    )}
                    title={v.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductDetailsModal 
        product={product} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />
    </>
  )
}

export function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="aspect-[4/5] rounded-[2rem]" />
      <div className="px-2 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-6 w-full" />
      </div>
    </div>
  )
}
