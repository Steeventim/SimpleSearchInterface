"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Folder, FolderPlus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface DirectorySelectorProps {
  value: string
  onChange: (directory: string) => void
}

export function DirectorySelector({ value, onChange }: DirectorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onChange(inputValue)
    setIsOpen(false)
  }

  const predefinedDirectories = [
    { name: "Documents", path: "documents" },
    { name: "Images", path: "images" },
    { name: "Vidéos", path: "videos" },
    { name: "Rapports", path: "reports" },
    { name: "Autres", path: "others" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Folder className="h-4 w-4" />
          <span className="truncate max-w-[150px]">{value ? value : "Répertoire par défaut"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sélectionner un répertoire</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="directory">Chemin du répertoire</Label>
            <Input
              id="directory"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Exemple: documents/2023"
            />
            <p className="text-xs text-muted-foreground">
              Entrez le chemin relatif du répertoire où vous souhaitez stocker les fichiers.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Répertoires prédéfinis</Label>
            <div className="grid grid-cols-2 gap-2">
              {predefinedDirectories.map((dir) => (
                <Button
                  key={dir.path}
                  type="button"
                  variant={inputValue === dir.path ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => setInputValue(dir.path)}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {dir.name}
                </Button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full">
            <FolderPlus className="h-4 w-4 mr-2" />
            Sélectionner ce répertoire
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
