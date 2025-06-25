"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, TrendingUp, RefreshCw, Database, Download, Trash2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

export function SearchLibrary() {
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [minFrequency, setMinFrequency] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const loadLibrary = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: '200',
        minFrequency: minFrequency.toString()
      })
      
      const response = await fetch(`/api/search-library?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLibraryData(data)
      } else {
        setError('Erreur lors du chargement des données')
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la bibliothèque:', error)
      setError('Impossible de charger la bibliothèque de recherche')
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
    if (frequency >= 10) return 'bg-red-100 text-red-800 border-red-200'
    if (frequency >= 5) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (frequency >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const exportData = () => {
    if (!libraryData) return
    
    const dataStr = JSON.stringify(libraryData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search-library-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Chargement de la bibliothèque...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800">
          {error}
          <Button 
            onClick={loadLibrary} 
            variant="outline" 
            size="sm" 
            className="ml-4"
          >
            Réessayer
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold">Bibliothèque de Recherche</h2>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button onClick={loadLibrary} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      {libraryData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="w-4 h-4" />
                Total des recherches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libraryData.stats.totalSearches}</div>
              <p className="text-xs text-gray-500 mt-1">Requêtes enregistrées</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Termes uniques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libraryData.stats.uniqueTerms}</div>
              <p className="text-xs text-gray-500 mt-1">Vocabulaire appris</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Termes populaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {libraryData.terms.filter(t => t.frequency >= 5).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Fréquence ≥ 5</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Dernière mise à jour</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">
                {new Date(libraryData.stats.lastUpdated).toLocaleDateString('fr-FR')}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(libraryData.stats.lastUpdated).toLocaleTimeString('fr-FR')}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Rechercher dans les termes..."
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
          
          <div className="text-sm text-gray-600">
            Affichage de {filteredTerms.length} terme(s) sur {libraryData?.total || 0}
          </div>
        </CardContent>
      </Card>

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
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{term.term}</div>
                  {term.variants.length > 1 && (
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="font-medium">Variantes:</span> {term.variants.filter(v => v !== term.term).join(', ')}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-4">
                    <span>Dernière utilisation: {new Date(term.lastUsed).toLocaleDateString('fr-FR')}</span>
                    <span>•</span>
                    <span>{term.variants.length} variante(s)</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getFrequencyColor(term.frequency)}>
                    {term.frequency} fois
                  </Badge>
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                </div>
              </div>
            ))}
            
            {filteredTerms.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <div className="text-lg font-medium mb-2">Aucun terme trouvé</div>
                <div className="text-sm">
                  {filter ? 'Essayez de modifier vos critères de recherche' : 'La bibliothèque est vide'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
