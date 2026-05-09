"use client"

import * as React from "react"
import { MoreVertical, ExternalLink, ShieldCheck, Tag, Box, BarChart3, Pencil, Copy, Trash2, Share2, Info } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface Product {
  id: string
  name: string
  category: string
  price: string
  priceValue: number
  status: "Published" | "Draft" | "Archived"
  image: string
  tags: string[]
  sku: string
  description?: string
  specs?: Record<string, string>
}

interface ProductCatalogGridProps {
  products: Product[]
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onEdit: (product: Product) => void
}

export function ProductCatalogGrid({ products, onDelete, onDuplicate, onEdit }: ProductCatalogGridProps) {
  
  const handleShare = (product: Product) => {
    navigator.clipboard.writeText(`https://precision-atelier.com/catalog/${product.id}`)
    toast.success("Link Copied", {
      description: "Direct asset link copied to architectural clipboard."
    })
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <Card key={product.id} className="group relative bg-white border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col items-stretch rounded-2xl">
          {/* Image Container with Overlay Controls */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            {/* Status Badge */}
            <div className="absolute top-4 left-4">
              <Badge className={cn(
                "font-bold uppercase tracking-widest text-[10px] px-3 py-1 border-none shadow-sm",
                product.status === "Published" ? "bg-emerald-500 text-white" :
                product.status === "Draft" ? "bg-amber-500 text-white" :
                "bg-slate-500 text-white"
              )}>
                {product.status}
              </Badge>
            </div>

            {/* Quick Actions (Hover Overlay) */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
               <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="secondary" size="icon" className="size-9 rounded-xl bg-white/90 backdrop-blur-md text-foreground shadow-lg hover:bg-white border-none" />}>
                     <MoreVertical data-icon="inline-start" className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-white shadow-2xl border-none p-2 rounded-xl">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-sans text-[10px] uppercase tracking-widest opacity-60">Management</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onEdit(product)} className="gap-2 cursor-pointer font-bold text-xs p-3">
                         <Pencil data-icon="inline-start" className="size-3" /> Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate(product.id)} className="gap-2 cursor-pointer font-bold text-xs p-3">
                         <Copy data-icon="inline-start" className="size-3" /> Duplicate SKU
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleShare(product)} className="gap-2 cursor-pointer font-bold text-xs p-3">
                         <Share2 data-icon="inline-start" className="size-3" /> Share Asset
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(product.id)} className="gap-2 cursor-pointer font-bold text-xs p-3 text-destructive focus:bg-destructive/10 focus:text-destructive">
                         <Trash2 data-icon="inline-start" className="size-3" /> Delete Permanent
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
               </DropdownMenu>
               
               <Sheet>
                 <SheetTrigger render={<Button variant="secondary" size="icon" className="size-9 rounded-xl bg-white/90 backdrop-blur-md text-foreground shadow-lg hover:bg-white border-none" />}>
                    <ExternalLink data-icon="inline-start" className="size-4" />
                 </SheetTrigger>
                 <SheetContent side="right" className="w-full sm:max-w-md bg-white border-none shadow-2xl p-0">
                    <div className="h-full flex flex-col">
                       <div className="h-64 overflow-hidden relative">
                          <img src={product.image} className="size-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                          <div className="absolute bottom-6 left-8">
                             <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight">{product.name}</h2>
                             <p className="text-white/60 font-mono text-xs uppercase tracking-widest mt-2">{product.sku}</p>
                          </div>
                       </div>
                       <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto">
                          <SheetHeader aria-hidden="true" className="sr-only">
                             <SheetTitle>{product.name} Specifications</SheetTitle>
                             <SheetDescription>Detailed product performance and build data.</SheetDescription>
                          </SheetHeader>
                          <div className="flex flex-col gap-4">
                             <div className="flex items-center gap-2">
                                <Info className="size-4 text-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Identity</span>
                             </div>
                             <p className="text-sm font-medium text-foreground/70 leading-relaxed font-sans">
                                An architectural masterpiece designed for the Precision Atelier 2026 collection. Focusing on structural integrity and minimalist aesthetic principles.
                             </p>
                          </div>

                          <div className="flex flex-col gap-4">
                             <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-2">Technical Specs</h4>
                             <div className="grid grid-cols-2 gap-y-6 gap-x-10">
                                <div>
                                   <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Category</span>
                                   <span className="text-xs font-bold font-sans">{product.category}</span>
                                </div>
                                <div>
                                   <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Status</span>
                                   <span className="text-xs font-bold font-sans">{product.status}</span>
                                </div>
                                <div>
                                   <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Price Point</span>
                                   <span className="text-xs font-bold font-sans">{product.price}</span>
                                </div>
                                <div>
                                   <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Materials</span>
                                   <span className="text-xs font-bold font-sans">{product.tags.join(", ")}</span>
                                </div>
                             </div>
                          </div>

                          <div className="mt-auto pt-8">
                             <Button className="w-full rounded-xl py-6 font-bold uppercase tracking-widest text-xs">Edit Master Record</Button>
                          </div>
                       </div>
                    </div>
                 </SheetContent>
               </Sheet>
            </div>
          </div>

          <CardContent className="p-8 flex flex-col gap-5 flex-1 relative bg-white">
            <div className="flex flex-col gap-1">
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">{product.category}</span>
               <h3 className="text-xl font-sans font-extrabold tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-300">{product.name}</h3>
               <p className="text-xs font-mono font-medium opacity-40 uppercase tracking-widest mt-1">{product.sku}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
               {product.tags.map(tag => (
                 <span key={tag} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground/70 uppercase tracking-wider">#{tag}</span>
               ))}
            </div>

            <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
               <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 mb-0.5">Price</span>
                  <span className="text-2xl font-sans font-extrabold tracking-tighter text-foreground">{product.price}</span>
               </div>
               <Sheet>
                  <SheetTrigger render={<Button variant="ghost" className="rounded-xl border border-border/20 text-[10px] font-extrabold uppercase tracking-widest h-10 px-6 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm" />}>
                     View Specs
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md bg-white border-none shadow-2xl p-0">
                     {/* Same content as above for the side-button trigger */}
                     <div className="h-full flex flex-col">
                        <div className="h-64 overflow-hidden relative">
                           <img src={product.image} className="size-full object-cover" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                           <div className="absolute bottom-6 left-8">
                              <h2 className="text-3xl font-sans font-extrabold text-white tracking-tight">{product.name}</h2>
                              <p className="text-white/60 font-mono text-xs uppercase tracking-widest mt-2">{product.sku}</p>
                           </div>
                        </div>
                        <div className="p-8 flex flex-col gap-8 flex-1 overflow-y-auto">
                           <SheetHeader aria-hidden="true" className="sr-only">
                              <SheetTitle>{product.name} Specifications</SheetTitle>
                              <SheetDescription>Detailed product performance and build data.</SheetDescription>
                           </SheetHeader>
                           {/* Reusable content block */}
                           <div className="flex flex-col gap-4">
                              <div className="flex items-center gap-2">
                                 <Info className="size-4 text-primary" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product Identity</span>
                              </div>
                              <p className="text-sm font-medium text-foreground/70 leading-relaxed font-sans">
                                 {product.description || "An architectural masterpiece designed for the Precision Atelier 2026 collection. Focusing on structural integrity and minimalist aesthetic principles."}
                              </p>
                           </div>

                           <div className="flex flex-col gap-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/10 pb-2 leading-none">Technical Specs</h4>
                              <div className="grid grid-cols-2 gap-y-6 gap-x-10 mt-2">
                                 <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Category</span>
                                    <span className="text-xs font-bold font-sans">{product.category}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Status</span>
                                    <span className="text-xs font-bold font-sans">{product.status}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">Price Point</span>
                                    <span className="text-xs font-bold font-sans">{product.price}</span>
                                 </div>
                                 <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest opacity-40 mb-1">SKU Ref</span>
                                    <span className="text-xs font-bold font-sans text-primary underline underline-offset-4">{product.sku}</span>
                                 </div>
                              </div>
                           </div>

                           <div className="mt-8 flex flex-col gap-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/10 pb-2 leading-none">Architectural Tags</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                 {product.tags.map(tag => (
                                   <Badge key={tag} variant="secondary" className="px-3 py-1 bg-surface-low border-none font-bold uppercase tracking-widest text-[9px] text-muted-foreground">
                                      {tag}
                                   </Badge>
                                 ))}
                              </div>
                           </div>

                           <div className="mt-auto pt-12 flex flex-col gap-3">
                              <Button onClick={() => onEdit(product)} className="w-full h-14 rounded-xl font-bold uppercase tracking-widest text-xs bg-primary hover:shadow-2xl transition-all">Edit Master Record</Button>
                              <Button variant="ghost" className="w-full text-[10px] font-bold opacity-40 hover:opacity-100 hover:bg-transparent uppercase tracking-widest">Download Asset Bundle</Button>
                           </div>
                        </div>
                     </div>
                  </SheetContent>
               </Sheet>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
