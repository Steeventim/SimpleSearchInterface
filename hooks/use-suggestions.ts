import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from './use-debounce'
import { useSearchTracking } from './use-search-tracking'

interface EnhancedSuggestion {
  text: string
  type: 'completion' | 'recent' | 'popular' | 'semantic' | 'learned'
  score: number
  category?: string
  context?: string
  frequency?: number
}

interface UseSuggestionsOptions {
  minQueryLength?: number
  maxResults?: number
  debounceMs?: number
  includeRecent?: boolean
  enableTracking?: boolean
}

interface UseSuggestionsReturn {
  suggestions: string[]
  enhancedSuggestions: EnhancedSuggestion[]
  loading: boolean
  error: string | null
  clearSuggestions: () => void
  selectSuggestion: (suggestion: string) => void
}

export function useSuggestions(
  query: string,
  options: UseSuggestionsOptions = {}
): UseSuggestionsReturn {
  const {
    minQueryLength = 2,
    maxResults = 8,
    debounceMs = 200,
    includeRecent = true,
    enableTracking = true
  } = options

  const [suggestions, setSuggestions] = useState<string[]>([])
  const [enhancedSuggestions, setEnhancedSuggestions] = useState<EnhancedSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, debounceMs)
  const { trackSearch } = useSearchTracking({ enableTracking })

  const clearSuggestions = useCallback(() => {
    setSuggestions([])
    setEnhancedSuggestions([])
    setError(null)
  }, [])

  const selectSuggestion = useCallback((suggestion: string) => {
    // Enregistrer la sélection de suggestion pour améliorer les futures suggestions
    if (enableTracking) {
      trackSearch(suggestion)
    }
    saveRecentSearch(suggestion)
  }, [enableTracking, trackSearch])

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < minQueryLength) {
      clearSuggestions()
      return
    }

    const abortController = new AbortController()
    
    const fetchSuggestions = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: debouncedQuery,
          limit: maxResults.toString()
        })

        if (includeRecent) {
          // Ajouter les suggestions récentes du localStorage
          const recentSearches = getRecentSearches()
          const recentSuggestions = recentSearches
            .filter(search => 
              search.toLowerCase().includes(debouncedQuery.toLowerCase()) &&
              search.toLowerCase() !== debouncedQuery.toLowerCase()
            )
            .slice(0, 3)

          if (recentSuggestions.length > 0) {
            params.append('recent', recentSuggestions.join(','))
          }
        }

        const response = await fetch(`/api/suggestions?${params}`, {
          signal: abortController.signal
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        
        setSuggestions(data.suggestions || [])
        setEnhancedSuggestions(data.enhanced || [])
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err.message)
          console.error('Erreur lors de la récupération des suggestions:', err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchSuggestions()

    return () => {
      abortController.abort()
    }
  }, [debouncedQuery, minQueryLength, maxResults, includeRecent])

  return {
    suggestions,
    enhancedSuggestions,
    loading,
    error,
    clearSuggestions,
    selectSuggestion
  }
}

function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const recent = localStorage.getItem('recent-searches')
    return recent ? JSON.parse(recent) : []
  } catch {
    return []
  }
}

export function saveRecentSearch(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const recent = getRecentSearches()
    const updated = [
      query,
      ...recent.filter(search => search !== query)
    ].slice(0, 10) // Garder seulement les 10 dernières
    
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recherche récente:', error)
  }
}
