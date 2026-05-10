"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ShopNavbar } from "@/components/shop/navbar"
import { ShopHero } from "@/components/shop/hero"
import { ProductCard, ProductSkeleton, ShopProduct } from "@/components/shop/product-card"
import { CategoryBar, CategorySkeleton, ShopCategory } from "@/components/shop/category-bar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Zap, Package, ShieldCheck, Globe, Cpu, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const PromotionSlideshow = ({ products }: { products: ShopProduct[] }) => {
   const [current, setCurrent] = React.useState(0)

   const promoProducts = React.useMemo(() => {
      return products.filter(p => {
         const now = new Date()
         const isDateValid = (!p.discountStart || new Date(p.discountStart) <= now) &&
            (!p.discountEnd || new Date(p.discountEnd) >= now)

         if (p.discountPrice && isDateValid) return true

         // Check variants
         if (Array.isArray(p.variants) && p.variants.some(v => v.discountPrice)) {
            return isDateValid // Assume variant discounts follow product schedule if set
         }

         return false
      }).slice(0, 5)
   }, [products])

   React.useEffect(() => {
      if (promoProducts.length === 0) return
      const timer = setInterval(() => {
         setCurrent(prev => (prev + 1) % promoProducts.length)
      }, 5000)
      return () => clearInterval(timer)
   }, [promoProducts.length])

   if (promoProducts.length === 0) return null

   const p = promoProducts[current]

   return (
      <section className="relative h-[60vh] md:h-[80vh] bg-black overflow-hidden group">
         {/* Background with Motion */}
         <div className="absolute inset-0 grayscale opacity-40 transition-transform duration-[10000ms] ease-linear scale-110 group-hover:scale-100">
            <img src={p.image} key={p.image} className="size-full object-cover animate-in fade-in duration-1000" />
         </div>
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

         {/* Content */}
         <div className="container mx-auto px-6 h-full flex flex-col justify-center relative z-10">
            <div className="max-w-3xl space-y-8">
               <div className="flex items-center gap-4 animate-in slide-in-from-left-4 duration-700">
                  <Badge className="bg-rose-600 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em]">
                     Limited Promotion Event
                  </Badge>
                  <div className="h-px w-20 bg-white/20" />
               </div>

               <div className="space-y-2 overflow-hidden">
                  <h2 className="text-6xl md:text-9xl font-black tracking-tighter text-white uppercase leading-[0.8] animate-in slide-in-from-bottom-12 duration-700">
                     {p.name.split(' ').map((word, i) => (
                        <span key={i} className={cn("inline-block mr-4", i % 2 === 1 && "italic text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20")}>
                           {word}
                        </span>
                     ))}
                  </h2>
               </div>

               <div className="flex items-center gap-10 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                        {p.discountPrice ? "Promotion Price" : "From (Variant Promo)"}
                     </span>
                     <span className="text-5xl font-black text-white italic tracking-tighter">
                        ${(p.discountPrice || (p.variants?.find(v => v.discountPrice)?.discountPrice) || 0).toLocaleString()}
                     </span>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Master Price</span>
                     <span className="text-2xl font-black text-white/40 line-through tracking-tighter">${p.price.toLocaleString()}</span>
                  </div>
                  <Button className="h-16 px-12 bg-white text-black hover:bg-rose-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-[0.4em] gap-4 ml-auto">
                     Sync to Registry
                     <ArrowRight className="size-4" />
                  </Button>
               </div>
            </div>
         </div>

         {/* Navigation */}
         <div className="absolute bottom-12 right-12 flex gap-4 z-20">
            <Button
               variant="outline"
               size="icon"
               onClick={() => setCurrent(prev => (prev - 1 + promoProducts.length) % promoProducts.length)}
               className="size-14 rounded-full border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white hover:text-black transition-all"
            >
               <ChevronLeft className="size-5" />
            </Button>
            <Button
               variant="outline"
               size="icon"
               onClick={() => setCurrent(prev => (prev + 1) % promoProducts.length)}
               className="size-14 rounded-full border-white/10 bg-white/5 backdrop-blur-xl text-white hover:bg-white hover:text-black transition-all"
            >
               <ChevronRight className="size-5" />
            </Button>
         </div>

         {/* Progress Indicators */}
         <div className="absolute bottom-0 inset-x-0 flex h-1 bg-white/5">
            {promoProducts.map((_, i) => (
               <div
                  key={i}
                  className={cn(
                     "h-full transition-all duration-500",
                     i === current ? "bg-rose-600 flex-grow" : "bg-transparent w-4"
                  )}
               />
            ))}
         </div>
      </section>
   )
}

export default function ShopHomePage() {
   const [selectedCategory, setSelectedCategory] = React.useState("all")

   // ── Data Fetching ────────────────────────────────────────────────────────────
   const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
      queryKey: ['categories-public'],
      queryFn: async () => {
         const res = await fetch('/api/categories')
         const json = await res.json()
         return json.success ? json.data : []
      }
   })

   const { data: products = [], isLoading: isProductsLoading } = useQuery<ShopProduct[]>({
      queryKey: ['products-public'],
      queryFn: async () => {
         const res = await fetch('/api/products')
         const json = await res.json()
         if (!json.success) return []
         return json.data.map((p: any) => ({
            id: p.id.toString(),
            name: p.name,
            price: parseFloat(p.price) || 0,
            category: p.category_name || p.category,
            categoryId: p.category?.toString(),
            image: p.image_url || "https://images.unsplash.com/photo-1523275335684?auto=format&fit=crop&q=80&w=600&h=800",
            discountPrice: p.discount_price ? parseFloat(p.discount_price) : undefined,
            discountStart: p.discount_start,
            discountEnd: p.discount_end,
            variants: Array.isArray(p.variants) ? p.variants : [],
            isNew: new Date().getTime() - new Date(p.created_at).getTime() < 7 * 24 * 60 * 60 * 1000,
            isPopular: Math.random() > 0.7 // Mock popularity for now
         }))
      }
   })

   const [mounted, setMounted] = React.useState(false)
   React.useEffect(() => setMounted(true), [])

   // ── Logic ────────────────────────────────────────────────────────────────────
   const filteredProducts = React.useMemo(() => {
      if (selectedCategory === "all") return products
      return products.filter((p: ShopProduct) => p.categoryId === selectedCategory)
   }, [products, selectedCategory])

   const popularProducts = React.useMemo(() => {
      // Use stable criteria (e.g. price) instead of Math.random to avoid hydration mismatch
      return [...products].sort((a, b) => b.price - a.price).slice(0, 4)
   }, [products])

   const randomProducts = React.useMemo(() => {
      // Stable 'random' list by taking the first 4 products
      return products.slice(0, 4)
   }, [products])

   if (!mounted) return null

   return (
      <main className="bg-white dark:bg-black min-h-screen">
         <ShopNavbar />

         {/* <PromotionSlideshow products={products} /> */}

         {/* <ShopHero /> */}

         {/* ── Marquee Ticker ────────────────────────────────────────────────── */}
         {/* <div className="bg-black py-4 overflow-hidden whitespace-nowrap border-y border-white/5 relative">
            <div className="inline-block animate-marquee">
               {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 mx-20">
                     New Series Drop: Carbon Nexus 01 • Limited Availability • Origin Certified • Architectural Integrity
                  </span>
               ))}
            </div>
         </div> */}

         {/* ── Collection Registry (Category Filter) ─────────────────────────────── */}
         <section className="py-24 md:py-40 container mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-20">
               {/* <div className="space-y-4 max-w-xl">
                  <div className="flex items-center gap-4">
                     <div className="size-1 bg-blue-600 rounded-full" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600">The Repository v2.4</span>
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white leading-[0.8]">
                     EXPLORE BY<br />SERIES
                  </h2>
                  <p className="text-sm font-medium text-gray-500 max-w-sm pt-4">
                     Our registry is organized by technical series, each representing a unique architectural philosophy.
                  </p>
               </div> */}
               {isCategoriesLoading ? (
                  <CategorySkeleton />
               ) : (
                  <CategoryBar
                     categories={categories}
                     onSelect={setSelectedCategory}
                     selectedId={selectedCategory}
                  />
               )}
            </div>

            {/* Product Grid with Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
               {isProductsLoading ? (
                  Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
               ) : filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => <ProductCard key={p.id} product={p} />)
               ) : (
                  <div className="col-span-full py-40 flex flex-col items-center justify-center text-center gap-6 opacity-40">
                     <Package className="size-24 stroke-[0.5px]" />
                     <p className="text-[10px] font-black uppercase tracking-[0.5em]">Registry Archive Empty</p>
                  </div>
               )}
            </div>
         </section>

         {/* ── Immersive Feature Section (Series 01) ─────────────────────────── */}
         {/* <section className="relative h-[80vh] flex items-center overflow-hidden bg-zinc-950">
            <div className="absolute inset-0 grayscale opacity-40">
               <img src="https://images.unsplash.com/photo-1493246507139-91e8bef99c02?auto=format&fit=crop&q=80&w=2000" className="size-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />

            <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-20">
               <div className="space-y-10">
                  <div className="space-y-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Immersive Experience</span>
                     <h2 className="text-6xl md:text-9xl font-black tracking-tighter text-white leading-none">
                        SERIES<br />REDACTED
                     </h2>
                     <p className="text-lg text-white/60 font-medium max-w-md leading-relaxed">
                        A clandestine collection of hyper-engineered assets designed for the silent observers of the digital era.
                     </p>
                  </div>
                  <div className="flex items-center gap-8">
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Integrity</span>
                        <span className="text-xl font-bold text-white tracking-tight italic">99.9%</span>
                     </div>
                     <div className="w-px h-10 bg-white/10" />
                     <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Deployment</span>
                        <span className="text-xl font-bold text-white tracking-tight italic">Global</span>
                     </div>
                  </div>
                  <Button className="h-16 px-10 rounded-none bg-white text-black hover:bg-blue-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest gap-4">
                     Request Access Protocol
                     <ArrowRight className="size-4" />
                  </Button>
               </div>

               <div className="hidden md:flex items-center justify-center">
                  <div className="size-[400px] rounded-full border border-white/5 flex items-center justify-center relative">
                     <div className="absolute inset-0 animate-spin-slow">
                        <div className="size-4 bg-blue-600 rounded-full absolute -top-2 left-1/2 -translate-x-1/2 blur-sm" />
                     </div>
                     <div className="size-64 rounded-full bg-gradient-to-br from-blue-600/20 to-transparent backdrop-blur-3xl flex items-center justify-center">
                        <ShieldCheck className="size-24 text-white opacity-20" />
                     </div>
                  </div>
               </div>
            </div>
         </section> */}

         {/* ── Trending Intelligence (Popular Products) ─────────────────────────── */}
         {/* <section className="py-40 bg-gray-50 dark:bg-zinc-950/50 relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-5%] size-[600px] bg-rose-500/5 rounded-full blur-[150px]" />

            <div className="container mx-auto px-6">
               <div className="flex items-center gap-4 mb-4">
                  <div className="size-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500">Live Analytics Data Stream</span>
               </div>
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
                  <h2 className="text-5xl md:text-9xl font-black tracking-tighter text-gray-900 dark:text-white leading-[0.8]">
                     TRENDING<br />OPERATIONS
                  </h2>
                  <Button variant="outline" className="h-14 px-8 rounded-full border-gray-200 dark:border-gray-800 font-black text-[10px] uppercase tracking-widest gap-4 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all group">
                     Full Intelligence Report
                     <Globe className="size-4 group-hover:rotate-12 transition-transform" />
                  </Button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
                  {isProductsLoading ? (
                     Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
                  ) : (
                     popularProducts.map((p) => <ProductCard key={p.id} product={p} />)
                  )}
               </div>
            </div>
         </section> */}

         {/* ── Technical Excellence (Random List) ────────────────────────────────── */}
         {/* <section className="py-40 container mx-auto px-6 border-t border-gray-100 dark:border-zinc-900">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
               <div className="space-y-6">
                  <div className="flex items-center gap-3">
                     <Cpu className="size-4 text-blue-600" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Refined Infrastructure</span>
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white uppercase leading-[0.8]">
                     implicit<br />discoveries
                  </h2>
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
               {isProductsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
               ) : (
                  randomProducts.map((p) => <ProductCard key={p.id} product={p} />)
               )}
            </div>
         </section> */}

         {/* ── CTA / Newsletter Section ────────────────────────────────────────── */}
         {/* <section className="py-48 bg-black text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:opacity-10 transition-opacity duration-1000">
               <Zap className="size-[800px] text-blue-500 -rotate-12 translate-x-1/4 -translate-y-1/4" />
            </div>
            <div className="container mx-auto px-6 relative z-10">
               <div className="max-w-4xl space-y-16">
                  <div className="space-y-6">
                     <span className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500">Atomic Newsletter v3.0</span>
                     <h2 className="text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.75] uppercase">
                        Join the<br /><span className="italic">Elite Circle</span>
                     </h2>
                     <p className="text-lg md:text-2xl opacity-60 font-medium max-w-2xl leading-relaxed pt-8">
                        Authenticate your credentials to receive exclusive architectural drops and early access to clandestine series.
                     </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-6 max-w-2xl">
                     <input
                        type="email"
                        placeholder="ENTER SECURE EMAIL REGISTRY"
                        className="flex-1 bg-white/5 border-b border-white/20 px-8 py-6 font-black text-xs uppercase tracking-widest outline-none focus:border-blue-500 transition-colors"
                     />
                     <Button className="bg-white text-black hover:bg-blue-600 hover:text-white px-12 h-20 rounded-none font-black text-[10px] uppercase tracking-[0.3em] transition-all">
                        SYNCHRONIZE SESSION
                     </Button>
                  </div>
               </div>
            </div>
         </section> */}

         {/* ── Enhanced Footer ────────────────────────────────────────────────────────── */}
         <footer className="py-32 bg-black text-white border-t border-white/5">
            <div className="container mx-auto px-6">
               <div className="grid md:grid-cols-4 gap-20 mb-32">
                  <div className="col-span-2 space-y-10">
                     <div className="flex items-center gap-4">
                        <div className="size-12 bg-white rounded-2xl flex items-center justify-center rotate-3">
                           <span className="text-black font-black text-xl italic">P</span>
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase">Precision Atelier</span>
                     </div>
                     <p className="text-sm opacity-40 font-medium max-w-sm leading-relaxed uppercase tracking-widest">
                        The global standard in architectural aesthetics and high-performance digital infrastructure.
                     </p>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Protocol</h4>
                     <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Manifesto</li>
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Registry</li>
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Archives</li>
                     </ul>
                  </div>
                  <div className="space-y-8">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Security</h4>
                     <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Nexus Login</li>
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Verification</li>
                        <li className="hover:text-blue-500 cursor-pointer transition-colors">Support</li>
                     </ul>
                  </div>
               </div>

               <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-20">
                     © 2026 PRECISION ATELIER GLOBAL OPERATIONS. ALL RIGHTS RESERVED.
                  </p>
                  <div className="flex gap-10 grayscale opacity-40 hover:opacity-100 transition-opacity">
                     {/* Mock logos or links */}
                     <span className="text-[10px] font-black tracking-widest uppercase">London</span>
                     <span className="text-[10px] font-black tracking-widest uppercase">Tokyo</span>
                     <span className="text-[10px] font-black tracking-widest uppercase">New York</span>
                  </div>
               </div>
            </div>
         </footer>
      </main>
   )
}
