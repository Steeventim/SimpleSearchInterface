import { useCallback } from 'react'

interface SearchTrackingOptions {
  minQueryLength?: number
  debounceMs?: number
  enableTracking?: boolean
}

export function useSearchTracking(options: SearchTrackingOptions = {}) {
  const {
    minQueryLength = 3,
    enableTracking = true
  } = options

  const trackSearch = useCallback(async (query: string, userId?: string) => {
    if (!enableTracking || !query || query.length < minQueryLength) {
      return
    }

    try {
      // Enregistrer la recherche dans la bibliothèque
      await fetch('/api/search-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          userId,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      // Échec silencieux - ne pas perturber l'expérience utilisateur
      console.warn('Échec de l\'enregistrement de la recherche:', error)
    }
  }, [enableTracking, minQueryLength])

  const trackSearchWithDelay = useCallback((query: string, userId?: string, delay = 1000) => {
    // Attendre un peu avant d'enregistrer pour éviter d'enregistrer chaque frappe
    setTimeout(() => {
      trackSearch(query, userId)
    }, delay)
  }, [trackSearch])

  return {
    trackSearch,
    trackSearchWithDelay
  }
}
