"use client"

import * as React from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void
  onUploadError?: (error: string) => void
  currentImage?: string
  className?: string
}

export function CloudinaryUpload({ 
  onUploadSuccess, 
  onUploadError, 
  currentImage,
  className 
}: CloudinaryUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(currentImage || null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview locally first
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        onUploadSuccess(result.url)
        toast.success("Asset Uploaded", { description: "Cloudinary registration successful." })
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error: any) {
      console.error("Upload error:", error)
      toast.error("Upload Failure", { description: error.message })
      if (onUploadError) onUploadError(error.message)
      setPreview(currentImage || null) // Reset to previous
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (e: React.MouseEvent) => {
    e.preventDefault()
    setPreview(null)
    onUploadSuccess("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div 
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden",
          preview 
            ? "border-emerald-500/50 bg-emerald-50/5 dark:bg-emerald-900/5" 
            : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
               <Button variant="secondary" size="sm" className="rounded-lg h-9 font-bold bg-white/90" onClick={removeImage}>
                  <X className="size-4 mr-2" /> Remove
               </Button>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-3">
                 <Loader2 className="size-8 text-white animate-spin" />
                 <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">Uploading...</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center p-6">
            <div className="size-14 rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 flex items-center justify-center shadow-sm">
               {isUploading ? <Loader2 className="size-6 text-blue-600 animate-spin" /> : <Upload className="size-6 text-blue-600" />}
            </div>
            <div className="space-y-1">
               <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Drop Asset Here</p>
               <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">or click to browse Cloudinary</p>
            </div>
          </div>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleUpload} 
        className="hidden" 
        accept="image/*"
        disabled={isUploading}
      />
    </div>
  )
}
