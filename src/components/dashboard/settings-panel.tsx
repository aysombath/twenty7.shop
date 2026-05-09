"use client"

import * as React from "react"
import { Settings, User, Bell, Shield, Palette, Globe, Save, LogOut, Camera, Check, Users, Link, CreditCard, Key, ShieldCheck, Mail, Zap, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export function SettingsPanel() {
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = () => {
    setIsSaving(true)
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: "Synchronizing system preferences...",
        success: "Architectural settings saved successfully.",
        error: "Failed to update master configuration.",
        finally: () => setIsSaving(false)
      }
    )
  }

  const handleCopyKey = () => {
    navigator.clipboard.writeText("at_prec_6k1v_9m7z_8p2q_5r3s")
    toast.success("API Key Copied", {
      description: "Secret key moved to structural clipboard."
    })
  }

  return (
    <div className="flex flex-col gap-10 pb-20 max-w-[1400px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border/10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
             <Settings className="size-4 text-primary opacity-60" />
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/80">System Configuration</span>
          </div>
          <h1 className="text-5xl font-sans font-extrabold tracking-tight text-foreground/90 leading-none">
            Master Settings
          </h1>
          <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase flex items-center gap-4 mt-2">
             <span>Platform Ver: <span className="text-primary font-bold">2.4.0</span></span>
             <span className="w-px h-3 bg-border/40" />
             <span>Atelier Status: <span className="text-emerald-500 font-bold">Operational</span></span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-2xl hover:shadow-primary/20 transition-all px-10 font-bold tracking-tight h-14 uppercase text-[10px] tracking-widest">
            {isSaving ? "Syncing..." : <><Save className="size-4" /> Save Preferences</>}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="general" className="w-full flex flex-col lg:flex-row gap-16">
        <div className="lg:w-80 flex flex-col gap-10">
           <TabsList className="h-auto flex flex-col items-stretch bg-transparent p-0 gap-1 border-none">
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-6 py-4">Primary Control</span>
              <TabsTrigger value="general" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <Settings className="size-4" /> General
              </TabsTrigger>
              <TabsTrigger value="profile" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <User className="size-4" /> Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <Bell className="size-4" /> Signal Matrix
              </TabsTrigger>
              
              <div className="h-px bg-border/40 my-4 -mx-2" />
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-40 px-6 py-2">Infrastructure</span>
              
              <TabsTrigger value="team" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <Users className="size-4" /> Team Atelier
              </TabsTrigger>
              <TabsTrigger value="integrations" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <Link className="size-4" /> Connection Gate
              </TabsTrigger>
              <TabsTrigger value="billing" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <CreditCard className="size-4" /> Yield & Plans
              </TabsTrigger>
              <TabsTrigger value="security" className="justify-start gap-4 h-14 rounded-2xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-xl data-[state=active]:text-primary transition-all font-bold text-xs uppercase tracking-widest text-muted-foreground border-none">
                <Shield className="size-4" /> Core Security
              </TabsTrigger>
           </TabsList>
           
           <Card className="border-none bg-primary/5 rounded-3xl p-6">
              <div className="flex flex-col gap-4">
                 <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Zap className="size-5" />
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold font-sans">Tier: Institutional</span>
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Next cycle in 12 days</span>
                 </div>
                 <Button variant="ghost" className="w-full text-[9px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all rounded-xl h-10">Manage Subscription</Button>
              </div>
           </Card>
        </div>

        <div className="flex-1 max-w-4xl">
          <TabsContent value="general" className="m-0 space-y-8 animate-in fade-in duration-500">
            <Card className="border-none bg-white shadow-sm rounded-[2rem] overflow-hidden p-12">
               <div className="flex items-center justify-between mb-12">
                  <div className="flex flex-col gap-1">
                     <h3 className="text-2xl font-sans font-extrabold tracking-tight">Atelier Parameters</h3>
                     <p className="text-xs font-bold uppercase tracking-widest opacity-40">Localization and core system variables</p>
                  </div>
                  <Globe className="size-6 opacity-10" />
               </div>
               <div className="grid gap-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="flex flex-col gap-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Atelier Identity</Label>
                        <Input defaultValue="Precision Atelier HQ" className="h-14 bg-surface-low border-none rounded-2xl font-bold px-6" />
                     </div>
                     <div className="flex flex-col gap-3">
                        <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Yield Currency</Label>
                        <Select defaultValue="USD">
                           <SelectTrigger className="h-14 bg-surface-low border-none rounded-2xl font-bold px-6 focus:ring-primary/20">
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                              <SelectItem value="USD">USD ($) - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                              <SelectItem value="GBP">GBP (£) - British Pound</SelectItem>
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
                  <div className="flex flex-col gap-6 pt-6 border-t border-border/5">
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-surface-low/30 hover:bg-surface-low/60 transition-all group cursor-pointer border border-transparent hover:border-border/10">
                        <div className="flex flex-col gap-1">
                           <span className="text-sm font-bold font-sans">Operational Mode: Real-time</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">System-wide propagation of all changes</span>
                        </div>
                        <Switch defaultChecked />
                     </div>
                     <div className="flex items-center justify-between p-6 rounded-2xl bg-surface-low/30 hover:bg-surface-low/60 transition-all group cursor-pointer border border-transparent hover:border-border/10">
                        <div className="flex flex-col gap-1">
                           <span className="text-sm font-bold font-sans">Structural Logging</span>
                           <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Comprehensive metadata auditing enabled</span>
                        </div>
                        <Switch defaultChecked />
                     </div>
                  </div>
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="m-0 space-y-8 animate-in slide-in-from-right-2 duration-500">
             <Card className="border-none bg-white shadow-sm rounded-[2rem] overflow-hidden p-12">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex flex-col gap-1">
                      <h3 className="text-2xl font-sans font-extrabold tracking-tight">Team Atelier</h3>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Managing structural access and roles</p>
                   </div>
                   <Button className="h-12 px-6 rounded-xl bg-primary gap-2 font-bold uppercase tracking-widest text-[9px]">
                      <UserPlus className="size-3" /> Enroll Specialist
                   </Button>
                </div>
                
                <div className="flex flex-col gap-4">
                   {[
                      { name: "Alexander Vance", role: "Master Curator", status: "Active", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=128" },
                      { name: "Elena Rossi", role: "Asset Specialist", status: "Active", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=128" },
                      { name: "Julian Thorne", role: "Financial Auditor", status: "Offline", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=128" },
                   ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-surface-low/30 border border-border/5 group hover:bg-white hover:shadow-lg transition-all">
                         <div className="flex items-center gap-4">
                            <Avatar className="size-11 rounded-xl">
                               <AvatarImage src={user.avatar} />
                               <AvatarFallback className="rounded-xl font-bold bg-primary/10 text-primary">{user.name.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                               <span className="text-sm font-bold font-sans">{user.name}</span>
                               <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40">{user.role}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-8">
                            <div className="flex items-center gap-2">
                               <div className={cn("size-1.5 rounded-full", user.status === "Active" ? "bg-emerald-500" : "bg-slate-400")} />
                               <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{user.status}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="size-9 rounded-lg opacity-40 hover:opacity-100 hover:bg-secondary/20">
                               <Pencil className="size-3" />
                            </Button>
                         </div>
                      </div>
                   ))}
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="integrations" className="m-0 space-y-8 animate-in slide-in-from-right-2 duration-500">
             <Card className="border-none bg-white shadow-sm rounded-[2rem] overflow-hidden p-12">
                <div className="flex flex-col gap-1 mb-12">
                   <h3 className="text-2xl font-sans font-extrabold tracking-tight">API & Connection Gate</h3>
                   <p className="text-xs font-bold uppercase tracking-widest opacity-40">System-level integrations and security keys</p>
                </div>
                
                <div className="flex flex-col gap-10">
                   <div className="flex flex-col gap-4">
                      <Label className="text-[10px] uppercase font-bold tracking-widest opacity-40">Master API Key</Label>
                      <div className="flex items-center gap-3">
                         <div className="flex-1 h-14 bg-surface-low rounded-2xl border-none flex items-center px-6 font-mono text-xs opacity-60 tracking-wider">
                            at_prec_6k1v••••••••••••••••••••••••
                         </div>
                         <Button onClick={handleCopyKey} variant="outline" size="icon" className="size-14 rounded-2xl bg-white shadow-sm border-none hover:shadow-xl transition-all">
                            <Key className="size-5 opacity-40" />
                         </Button>
                      </div>
                      <p className="text-[10px] font-bold text-rose-500 opacity-60 uppercase tracking-widest">Warning: Key allows absolute structural control.</p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-border/5">
                      {[
                         { name: "Shopify Engine", type: "Mainframe", status: "Linked", icon: Zap },
                         { name: "Global Payments", type: "Audit", status: "Pending", icon: CreditCard },
                         { name: "Atelier Courier", type: "Logistics", status: "Linked", icon: Truck },
                         { name: "Marketing Hub", type: "Signals", status: "Disconnected", icon: Mail },
                      ].map((gate, i) => {
                        const Icon = gate.icon as any
                        return (
                          <div key={i} className="flex flex-col gap-4 p-8 rounded-2xl bg-surface-low/30 border border-transparent hover:border-primary/10 transition-all group">
                             <div className="flex items-center justify-between">
                                <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary">
                                   <Icon className="size-6 opacity-60 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <Badge className={cn(
                                   "text-[9px] font-bold px-3 py-1 uppercase tracking-widest border-none",
                                   gate.status === "Linked" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                )}>{gate.status}</Badge>
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm font-bold font-sans">{gate.name}</span>
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">{gate.type} Interface</span>
                             </div>
                             <Button variant="ghost" className="w-full justify-start gap-2 h-10 rounded-xl text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white mt-4 border border-primary/10">Configure Gate</Button>
                          </div>
                        )
                      })}
                   </div>
                </div>
             </Card>
          </TabsContent>

          {/* Previous tabs (profile, notifications, security) remain but simplified for the update */}
          <TabsContent value="profile" className="m-0 animate-in fade-in duration-500">
            <Card className="border-none bg-white shadow-sm rounded-[2rem] overflow-hidden p-12">
               <div className="flex flex-col gap-10">
                  <div className="flex items-center gap-8">
                     <div className="relative group">
                        <Avatar className="size-24 rounded-3xl ring-4 ring-primary/5 shadow-xl transition-all group-hover:ring-primary/20">
                           <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=128" />
                           <AvatarFallback className="rounded-2xl text-2xl font-bold bg-primary text-white">AD</AvatarFallback>
                        </Avatar>
                        <Button variant="secondary" size="icon" className="absolute -bottom-2 -right-2 size-8 rounded-xl bg-white shadow-xl">
                           <Camera className="size-4" />
                        </Button>
                     </div>
                     <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-sans font-extrabold tracking-tight">Curator Identity</h3>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-40 tracking-widest">Master administration profile</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="grid gap-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Display Name</Label>
                       <Input defaultValue="Alexander Vance" className="h-14 bg-surface-low border-none rounded-2xl font-bold px-6" />
                    </div>
                    <div className="grid gap-2">
                       <Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Role Classification</Label>
                       <Input defaultValue="Master Curator" disabled className="h-14 bg-surface-low border-none rounded-2xl font-bold px-6 opacity-40" />
                    </div>
                  </div>
               </div>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function Truck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-5h-4l-3-4h-3" />
      <path d="M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="M17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  )
}

function Pencil(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}
