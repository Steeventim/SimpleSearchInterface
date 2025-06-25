import React, { useState, useRef, useEffect } from 'react'
import { Search, Clock, TrendingUp, Zap, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSuggestions, saveRecentSearch } from '@/hooks/use-suggestions'

interface EnhancedSearchSuggestionsProps {
  query: string
  onSelect: (suggestion: string) => void
  onClose: () => void
  className?: string
}

const getSuggestionIcon = (type: string) => {
  switch (type) {
    case 'recent':
      return <Clock className="w-4 h-4 text-gray-400" />
    case 'popular':
      return <TrendingUp className="w-4 h-4 text-blue-500" />
    case 'semantic':
      return <Zap className="w-4 h-4 text-purple-500" />
    default:
      return <Search className="w-4 h-4 text-gray-400" />
  }
}

const getSuggestionLabel = (type: string) => {
  switch (type) {
    case 'recent':
      return 'Récent'
    case 'popular':
      return 'Populaire'
    case 'semantic':
      return 'Suggéré'
    case 'completion':
      return 'Complétion'
    default:
      return ''
  }
}

export function EnhancedSearchSuggestions({
  query,
  onSelect,
  onClose,
  className
}: EnhancedSearchSuggestionsProps) {
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const { 
    suggestions, 
    enhancedSuggestions, 
    loading, 
    error 
  } = useSuggestions(query, {
    maxResults: 8,
    includeRecent: true
  })

  const handleSelect = (suggestion: string) => {
    saveRecentSearch(suggestion)
    onSelect(suggestion)
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!suggestions.length) return

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        event.preventDefault()
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        onClose()
        break
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [suggestions, selectedIndex])

  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 font-medium">
          {part}
        </mark>
      ) : part
    )
  }

  if (!query || query.length < 2) return null

  return (
    <div 
      ref={suggestionsRef}
      className={cn(
        "absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto",
        className
      )}
    >
      {loading && (
        <div className="p-3 text-center text-gray-500">
          <div className="inline-flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            Recherche de suggestions...
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 text-center text-red-500 text-sm">
          Erreur lors du chargement des suggestions
        </div>
      )}

      {!loading && suggestions.length === 0 && !error && (
        <div className="p-3 text-center text-gray-500">
          Aucune suggestion trouvée
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="py-2">
          {suggestions.map((suggestion, index) => {
            const enhanced = enhancedSuggestions[index]
            const isSelected = index === selectedIndex

            return (
              <button
                key={`${suggestion}-${index}`}
                className={cn(
                  "w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center gap-3 group transition-colors",
                  isSelected && "bg-blue-50 border-l-2 border-blue-500"
                )}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-shrink-0">
                  {enhanced ? getSuggestionIcon(enhanced.type) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">
                    {highlightMatch(suggestion, query)}
                  </div>
                  
                  {enhanced?.context && (
                    <div className="text-xs text-gray-500 truncate">
                      {enhanced.context}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                  {enhanced && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {getSuggestionLabel(enhanced.type)}
                    </span>
                  )}
                  
                  <ArrowUpRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
          Utilisez ↑↓ pour naviguer, Entrée pour sélectionner, Échap pour fermer
        </div>
      )}
    </div>
  )
}
