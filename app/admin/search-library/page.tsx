"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Search, TrendingUp, RefreshCw } from 'lucide-react'

interface SearchTerm {
  term: string
  frequency: number
  lastUsed: string
  variants: string[]
}

interface SearchStats {
  totalSearches: number
  uniqueTerms: number
  lastUpdated: string
}

interface LibraryData {
  terms: SearchTerm[]
  stats: SearchStats
  total: number
}

export default function SearchLibraryAdmin() {
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [minFrequency, setMinFrequency] = useState(1)

  const loadLibrary = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: '200',
        minFrequency: minFrequency.toString()
      })
      
      const response = await fetch(`/api/search-library?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLibraryData(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la bibliothèque:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLibrary()
  }, [minFrequency])

  const filteredTerms = libraryData?.terms.filter(term =>
    term.term.toLowerCase().includes(filter.toLowerCase())
  ) || []

  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 10) return 'bg-red-100 text-red-800'
    if (frequency >= 5) return 'bg-orange-100 text-orange-800'
    if (frequency >= 2) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Chargement de la bibliothèque...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bibliothèque de Recherche</h1>
        <Button onClick={loadLibrary} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Statistiques */}
      {libraryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total des recherches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libraryData.stats.totalSearches}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Termes uniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libraryData.stats.uniqueTerms}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dernière mise à jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                {new Date(libraryData.stats.lastUpdated).toLocaleString('fr-FR')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Filtrer les termes..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Fréquence min:</span>
          <Input
            type="number"
            min="1"
            value={minFrequency}
            onChange={(e) => setMinFrequency(parseInt(e.target.value) || 1)}
            className="w-20"
          />
        </div>
      </div>

      {/* Liste des termes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Termes de recherche ({filteredTerms.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTerms.map((term, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{term.term}</div>
                  {term.variants.length > 1 && (
                    <div className="text-sm text-gray-500 mt-1">
                      Variantes: {term.variants.filter(v => v !== term.term).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">
                    Dernière utilisation: {new Date(term.lastUsed).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge className={getFrequencyColor(term.frequency)}>
                    {term.frequency} fois
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            ))}
            
            {filteredTerms.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Aucun terme trouvé avec ces critères
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
