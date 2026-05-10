"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, User, ShieldCheck, Loader2, Globe, Zap, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="size-8 animate-spin text-blue-500" />
      </div>
    }>
      <LoginForm />
    </React.Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = React.useState(false)
  const [credentials, setCredentials] = React.useState({ username: "", password: "" })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!credentials.username || !credentials.password) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })

      const result = await response.json()

      if (result.success) {
        sessionStorage.setItem('atelier_access_token', result.accessToken)
        sessionStorage.setItem('atelier_refresh_token', result.refreshToken)
        sessionStorage.setItem('atelier_user', JSON.stringify(result.user || {}))
        
        toast.success("Identity Verified", {
          description: `Welcome back, ${result.user?.username || 'Architect'}.`
        })
        
        const callbackUrl = searchParams.get('callbackUrl') || '/admin'
        router.push(callbackUrl)
        router.refresh()
      } else {
        toast.error("Access Denied", {
          description: result.error
        })
      }
    } catch (error) {
      toast.error("Security Service Offline")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* ── Left Side: Immersive Visual ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-900">
        <img 
          src="/login_background_architecture_1778330602197.png" 
          alt="Architectural Interior" 
          className="absolute inset-0 size-full object-cover grayscale opacity-60 transition-transform duration-[10s] hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-between p-20 z-10">
           <Link href="/" className="group flex items-center gap-3">
              <div className="size-10 bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
                 <span className="text-black font-black text-xl italic">P</span>
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">
                 Precision<span className="text-white/40">Atelier</span>
              </span>
           </Link>

           <div className="space-y-6 max-w-md">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Origin Certified</span>
              <h2 className="text-6xl font-black tracking-tighter text-white leading-none">
                 AUTHENTICATE<br />YOUR IDENTITY
              </h2>
              <p className="text-lg text-white/60 font-medium leading-relaxed">
                 Access the registry and manage your architectural assets through our secure nexus.
              </p>
           </div>

           <div className="flex gap-10">
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Protocol</span>
                 <span className="text-xs font-bold text-white uppercase tracking-tighter">AES-256-GCM</span>
              </div>
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Session</span>
                 <span className="text-xs font-bold text-white uppercase tracking-tighter">Encrypted Vault</span>
              </div>
           </div>
        </div>
      </div>

      {/* ── Right Side: Minimalist Form ─────────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-20 relative">
        {/* Subtle background element for mobile */}
        <div className="lg:hidden absolute inset-0 bg-zinc-950 z-0">
           <img 
            src="/login_background_architecture_1778330602197.png" 
            className="size-full object-cover opacity-20 grayscale" 
           />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="w-full max-w-md space-y-12 relative z-10">
          <div className="space-y-2 lg:text-left text-center">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Welcome Back</h1>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
               Enter your credentials to synchronize session
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground ml-1">Identity Identifier</Label>
                <div className="relative group">
                  <User className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    id="username"
                    placeholder="architect@registry.com"
                    value={credentials.username}
                    onChange={e => setCredentials({...credentials, username: e.target.value})}
                    className="h-12 pl-8 bg-transparent border-0 border-b border-border rounded-none text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:border-blue-600 transition-all font-bold"
                    autoComplete="off"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                   <Label htmlFor="password" className="text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground ml-1">Vault Key</Label>
                   <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Forgot Key?</Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={credentials.password}
                    onChange={e => setCredentials({...credentials, password: e.target.value})}
                    className="h-12 pl-8 bg-transparent border-0 border-b border-border rounded-none text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-0 focus-visible:border-blue-600 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full h-16 rounded-none bg-foreground text-background hover:bg-blue-600 hover:text-white font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-xl group"
            >
              {isLoading ? <Loader2 className="animate-spin size-5" /> : (
                <span className="flex items-center gap-3">
                  Initialize Session <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="space-y-8">
             <div className="relative">
                <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                   <span className="bg-background px-4 text-muted-foreground">Alternative Protocols</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-none font-black text-[10px] uppercase tracking-widest gap-3 border-border hover:bg-foreground hover:text-background transition-all">
                   <Globe className="size-4" />
                   Google
                </Button>
                <Button variant="outline" className="h-14 rounded-none font-black text-[10px] uppercase tracking-widest gap-3 border-border hover:bg-foreground hover:text-background transition-all">
                   <Zap className="size-4" />
                   Apple ID
                </Button>
             </div>
          </div>

          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
             New to the repository? <Link href="#" className="text-blue-600 hover:underline">Request Registry Access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
