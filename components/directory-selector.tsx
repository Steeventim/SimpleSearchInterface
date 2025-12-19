"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Folder, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DirectorySelectorProps {
  value: string
  onChange: (directory: string) => void
  userDivision?: string
}

export function DirectorySelector({ value, onChange, userDivision }: DirectorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [directories, setDirectories] = useState<string[]>([])
  const [root, setRoot] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const fetchDirectories = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/directories");
      if (response.ok) {
        const data = await response.json();
        setDirectories(data.directories || []);
        setRoot(data.root || "");

        // If no value set, default to root or first dir
        if (!value) {
          onChange(data.root || "");
        }
      }
    } catch (error) {
      console.error("Failed to fetch directories", error);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchDirectories()
    }
  }, [isOpen])

  // Determine display label
  const displayLabel = value === root
    ? `Racine (${root})`
    : value.replace(`${root}/`, '') || value || "Sélectionner un dossier";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 w-full justify-start">
          <Folder className="h-4 w-4" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sélectionner un dossier (Division: {userDivision || "..."})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Dossiers disponibles</Label>
            <Button variant="ghost" size="sm" onClick={fetchDirectories} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="grid gap-2">
              {/* Always option to select Root */}
              <Button
                key="root"
                variant={value === root ? "default" : "outline"}
                className="justify-start"
                onClick={() => {
                  onChange(root);
                  setIsOpen(false);
                }}
              >
                <Folder className="h-4 w-4 mr-2" />
                Racine ({root})
              </Button>

              {directories.map((dir) => (
                <Button
                  key={dir}
                  variant={value === root ? "outline" : "outline"} // Simplified for now
                  className="justify-start ml-4"
                  onClick={() => {
                    // Construct relative path if needed, or just dir name if API returns simple names
                    // Assuming API returns just names, and they are subfolders of root
                    onChange(dir);
                    setIsOpen(false);
                  }}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  {dir}
                </Button>
              ))}

              {directories.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucun sous-dossier trouvé.
                </p>
              )}
            </div>
          )}

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md text-xs text-yellow-800 dark:text-yellow-200">
            <p>Note: Vous ne pouvez sélectionner que les dossiers existants dans votre division.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
