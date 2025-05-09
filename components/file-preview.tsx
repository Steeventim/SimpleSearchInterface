"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FileText, Download } from "lucide-react"
import Image from "next/image"

interface FilePreviewProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
}

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>("preview")

  useEffect(() => {
    if (!file) return

    setLoading(true)
    setPreview(null)
    setTextContent(null)

    // Créer un URL pour prévisualiser le fichier
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Si c'est un fichier texte, essayer de lire son contenu
    if (file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setTextContent(e.target.result as string)
        }
      }
      reader.readAsText(file)
    }

    setLoading(false)

    // Nettoyer l'URL lors du démontage
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  if (!file) return null

  const isImage = file.type.startsWith("image/")
  const isPdf = file.type === "application/pdf"
  const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md")

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">Aperçu de {file.name}</DialogTitle>
        </DialogHeader>

        <Tabs
          defaultValue="preview"
          className="flex-1 flex flex-col overflow-hidden"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="preview">Aperçu</TabsTrigger>
            <TabsTrigger value="info">Informations</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isImage && preview ? (
              <div className="flex items-center justify-center h-full">
                <div className="relative max-w-full max-h-[60vh]">
                  <Image
                    src={preview || "/placeholder.svg"}
                    alt={file.name}
                    width={800}
                    height={600}
                    className="object-contain max-h-[60vh]"
                    style={{ width: "auto", height: "auto" }}
                  />
                </div>
              </div>
            ) : isPdf && preview ? (
              <div className="flex flex-col items-center justify-center h-full">
                <iframe src={preview} className="w-full h-[60vh]" title={file.name} />
              </div>
            ) : isText && textContent ? (
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-[60vh]">
                <pre className="text-sm whitespace-pre-wrap">{textContent}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <p className="text-center text-muted-foreground">
                  L'aperçu n'est pas disponible pour ce type de fichier.
                </p>
                <Button asChild>
                  <a href={preview || "#"} download={file.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="info" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium">Nom</div>
                <div className="text-sm truncate">{file.name}</div>

                <div className="text-sm font-medium">Type</div>
                <div className="text-sm">{file.type || "Inconnu"}</div>

                <div className="text-sm font-medium">Taille</div>
                <div className="text-sm">{formatFileSize(file.size)}</div>

                <div className="text-sm font-medium">Dernière modification</div>
                <div className="text-sm">{new Date(file.lastModified).toLocaleString()}</div>
              </div>

              <div className="flex items-center justify-center pt-4">
                <Button asChild>
                  <a href={preview || "#"} download={file.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
