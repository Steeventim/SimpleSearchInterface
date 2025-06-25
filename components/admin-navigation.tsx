"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, Database, BarChart3, Settings, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminNavigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        Admin
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          {/* Overlay pour fermer le menu en cliquant ailleurs */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4 text-blue-500" />
              <div>
                <div className="font-medium text-sm">Accueil</div>
                <div className="text-xs text-gray-500">Retour à la recherche</div>
              </div>
            </Link>

            <Link
              href="/admin/search-library"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Database className="w-4 h-4 text-green-500" />
              <div>
                <div className="font-medium text-sm">Bibliothèque de Recherche</div>
                <div className="text-xs text-gray-500">Gérer les termes de recherche</div>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <div>
                <div className="font-medium text-sm">Analytics</div>
                <div className="text-xs text-gray-500">Statistiques de recherche</div>
              </div>
            </Link>

            <div className="border-t border-gray-100 my-2" />
            
            <div className="px-4 py-2 text-xs text-gray-400">
              Raccourcis : Ctrl+Shift+L pour la bibliothèque
            </div>
          </div>
        </>
      )}
    </div>
  )
}
