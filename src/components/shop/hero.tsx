"use client"

import * as React from "react"
import { ArrowRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ShopHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa] dark:bg-black group">
      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-1/4 size-[500px] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 size-[400px] bg-rose-100/20 dark:bg-rose-900/5 rounded-full blur-[100px]" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-10">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6 animate-in slide-in-from-top-4 duration-700">
               <span className="h-[1px] w-8 bg-gray-300 dark:bg-gray-700" />
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Precision Atelier 2026</span>
               <span className="h-[1px] w-8 bg-gray-300 dark:bg-gray-700" />
            </div>
            <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.9] text-gray-900 dark:text-white animate-in zoom-in-95 duration-1000">
              CRAFTED<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-rose-500">FOR LEGENDS</span>
            </h1>
            <p className="max-w-lg mx-auto text-sm md:text-lg font-medium text-gray-500 dark:text-gray-400 leading-relaxed mt-8 animate-in fade-in duration-1000 delay-300">
              Architectural integrity meets high-performance aesthetics. Discover the intersection of engineering and luxury.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 animate-in slide-in-from-bottom-6 duration-1000 delay-500">
            <Button size="lg" className="h-16 px-10 rounded-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-black text-xs uppercase tracking-widest gap-4 group/btn shadow-2xl">
              Explore Collection
              <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
            </Button>
            <Button variant="ghost" size="lg" className="h-16 px-10 rounded-full font-black text-xs uppercase tracking-widest gap-4 border border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-900 transition-all">
              <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <Play className="size-3 text-blue-600 fill-blue-600 ml-0.5" />
              </div>
              Watch Film
            </Button>
          </div>
        </div>
      </div>

      {/* Floating Image Preview - Premium Touch */}
      <div className="absolute bottom-10 right-10 hidden xl:flex flex-col gap-4 animate-in slide-in-from-right-10 duration-1000 delay-700">
         <div className="flex items-center gap-4 bg-white/40 backdrop-blur-md p-4 rounded-[2rem] border border-white/50 shadow-2xl">
            <div className="size-20 rounded-2xl overflow-hidden bg-gray-200">
               <img src="https://images.unsplash.com/photo-1523275335684?auto=format&fit=crop&q=80&w=200&h=200" className="size-full object-cover" />
            </div>
            <div className="pr-10">
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Now Trending</span>
               <h4 className="text-sm font-black tracking-tight text-gray-900">Carbon Chrono V2</h4>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Limited series / 250 units</p>
            </div>
         </div>
      </div>
    </section>
  )
}
