"use client"

import * as React from "react"
import Link from "next/link"
import { Search, ShoppingBag, Menu, User, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-store"

export function ShopNavbar() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchVisible, setIsSearchVisible] = React.useState(false)
  const totalItems = useCart((state) => state.totalItems())
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (!mounted) return (
     <header className="fixed top-0 left-0 right-0 z-50 bg-transparent py-8">
        <div className="container mx-auto px-6 flex items-center justify-between">
           <div className="flex items-center gap-12">
              <div className="flex items-center gap-2">
                 <div className="size-10 bg-pink-600 rounded-xl" />
                 <span className="text-xl font-black tracking-tighter text-pink-600">Twenty7<span className="text-gray-400">Shop</span></span>
              </div>
           </div>
        </div>
     </header>
  )

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl py-4 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border-b border-gray-100 dark:border-gray-900"
          : "bg-transparent py-8"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between relative">
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-2">
            <div className="size-10 bg-pink-600 dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
              <span className="text-white dark:text-black font-black text-xl tracking-tighter italic">T7S</span>
            </div>
            <span className={cn(
              "text-xl font-black tracking-tighter transition-colors duration-500",
              isScrolled ? "text-pink-600 dark:text-white" : "text-pink-600 dark:text-white"
            )}>
              Twenty7<span className="text-gray-400 group-hover:text-black transition-colors">Shop</span>
            </span>
          </Link>

          {/* <nav className="hidden lg:flex items-center gap-8">
            {["Collections", "New Arrivals", "Bestsellers", "Limited Edition"].map((item) => (
              <Link
                key={item}
                href="#"
                className={cn(
                  "text-[10px] uppercase font-black tracking-[0.2em] transition-all hover:text-blue-600 relative group py-2",
                  isScrolled ? "text-gray-500" : "text-gray-600 dark:text-gray-300"
                )}
              >
                {item}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav> */}
        </div>

        {/* Search Overlay/Input */}
        <div className={cn(
          "absolute inset-x-6 top-1/2 -translate-y-1/2 flex items-center bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 transition-all duration-500 z-20",
          isSearchVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
        )}>
          <Search className="ml-5 size-4 text-gray-400" />
          <Input
            className="border-none bg-transparent h-14 focus-visible:ring-0 text-sm font-bold placeholder:text-gray-300"
            placeholder="SEARCH REGISTRY..."
          />
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 size-10 rounded-xl"
            onClick={() => setIsSearchVisible(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0"
            onClick={() => setIsSearchVisible(true)}
          >
            <Search className="size-5 opacity-60" />
          </Button>
          <Link href="/login">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all shrink-0">
              <User className="size-5 opacity-60" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />
          <Link href="/checkout">
            <Button className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black rounded-full px-6 flex items-center gap-3 shadow-xl transition-all h-11 shrink-0 group">
              <ShoppingBag className="size-4 transition-transform group-hover:-rotate-12" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                {mounted ? `${totalItems} Assets` : '0 Assets'}
              </span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden rounded-full shrink-0"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-0 top-[72px] bg-white dark:bg-black z-40 transition-all duration-500 lg:hidden",
          isMobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        )}
      >
        <div className="p-10 flex flex-col gap-10">
          {["Collections", "New Arrivals", "Bestsellers", "Limited Edition", "Journal", "Atelier"].map((item, i) => (
            <Link
              key={item}
              href="#"
              style={{ transitionDelay: `${i * 50}ms` }}
              className={cn(
                "text-4xl font-black tracking-tighter hover:text-blue-600 transition-all",
                isMobileMenuOpen ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
              )}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
