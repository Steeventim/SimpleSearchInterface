"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, FileText, FileImage, FileArchive, FileVideo, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { FilePreview } from "./file-preview"
import { DirectorySelector } from "./directory-selector"

interface FileUploadProps {
  onUploadComplete?: (files: File[]) => void
  maxFiles?: number
  acceptedFileTypes?: string
  userDivision?: string
}

export function FileUpload({ onUploadComplete, maxFiles = 5, acceptedFileTypes, userDivision }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [directory, setDirectory] = useState("")
  const [uploadResults, setUploadResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      const totalFiles = [...files, ...newFiles].slice(0, maxFiles)
      setFiles(totalFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      const totalFiles = [...files, ...newFiles].slice(0, maxFiles)
      setFiles(totalFiles)
    }
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      // Créer un FormData pour l'upload
      const formData = new FormData()

      // Ajouter le répertoire si spécifié
      if (directory) {
        formData.append("directory", directory)
      }

      // Ajouter les fichiers
      files.forEach((file, index) => {
        formData.append(`file-${index}`, file)
      })

      // Simuler la progression
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 5
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 200)

      // Envoyer les fichiers au serveur
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors de l'upload")
      }

      const result = await response.json()
      setProgress(100)
      setUploadResults(result.files)

      // Appeler le callback si fourni
      if (onUploadComplete) {
        onUploadComplete(files)
      }

      // Réinitialiser après un court délai
      setTimeout(() => {
        setFiles([])
        setProgress(0)
        setUploading(false)
      }, 1500)
    } catch (err: any) {
      console.error("Erreur d'upload:", err)
      setError(err.message || "Une erreur est survenue lors de l'upload")
      setProgress(0)
      setUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    const type = file.type
    if (type.startsWith("image/")) return <FileImage className="h-5 w-5" />
    if (type.startsWith("video/")) return <FileVideo className="h-5 w-5" />
    if (type.startsWith("text/")) return <FileText className="h-5 w-5" />
    if (type.includes("zip") || type.includes("rar") || type.includes("tar") || type.includes("gz"))
      return <FileArchive className="h-5 w-5" />
    return <File className="h-5 w-5" />
  }

  const openPreview = (file: File) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <DirectorySelector value={directory} onChange={setDirectory} userDivision={userDivision} />
        <p className="text-sm text-muted-foreground">
          {directory ? `Les fichiers seront uploadés dans: ${directory}` : "Répertoire par défaut"}
        </p>
      </div>

      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border",
          uploading && "pointer-events-none opacity-60",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <h3 className="text-lg font-medium">Déposez vos fichiers ici</h3>
          <p className="text-sm text-muted-foreground">
            ou <span className="text-primary font-medium">cliquez pour parcourir</span>
          </p>
          {acceptedFileTypes && <p className="text-xs text-muted-foreground">Types acceptés: {acceptedFileTypes}</p>}
          <p className="text-xs text-muted-foreground">
            Maximum {maxFiles} fichier{maxFiles > 1 ? "s" : ""}
          </p>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept={acceptedFileTypes}
          disabled={uploading}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Fichiers sélectionnés ({files.length})</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-card p-2 rounded-md border"
              >
                <div className="flex items-center space-x-2">
                  {getFileIcon(file)}
                  <div className="text-sm truncate max-w-[200px]">{file.name}</div>
                  <div className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      openPreview(file)
                    }}
                    disabled={uploading}
                    title="Prévisualiser"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    disabled={uploading}
                    title="Supprimer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {uploading && <Progress value={progress} className="h-2" />}

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">{error}</div>}

      {uploadResults.length > 0 && !uploading && (
        <div className="bg-primary/10 p-3 rounded-md">
          <h4 className="text-sm font-medium mb-2">Résultats de l'upload</h4>
          <ul className="space-y-1 text-sm">
            {uploadResults.map((result, index) => (
              <li key={index} className="flex items-center">
                {result.success ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}
                <span className="ml-2">{result.name}</span>
                {result.error && <span className="ml-2 text-red-600">- {result.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {files.length > 0 && !uploading && (
        <Button onClick={uploadFiles} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          Télécharger {files.length} fichier{files.length > 1 ? "s" : ""}
        </Button>
      )}

      <FilePreview file={previewFile} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
    </div>
  )
}
