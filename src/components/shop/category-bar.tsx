"use client"

import * as React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export type ShopCategory = {
  id: string
  name: string
  image?: string
}

export function CategoryBar({ 
  categories, 
  onSelect, 
  selectedId 
}: { 
  categories: ShopCategory[], 
  onSelect: (id: string) => void,
  selectedId?: string
}) {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "h-12 px-8 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap",
          selectedId === "all" || !selectedId
            ? "bg-black text-white border-black shadow-xl"
            : "bg-white text-gray-500 border-gray-100 hover:border-black hover:text-black"
        )}
      >
        All series
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={cn(
            "h-12 px-8 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all shrink-0 whitespace-nowrap flex items-center gap-2",
            selectedId === cat.id
              ? "bg-black text-white border-black shadow-xl"
              : "bg-white text-gray-500 border-gray-100 hover:border-black hover:text-black"
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-12 w-32 rounded-full shrink-0" />
      ))}
    </div>
  )
}
