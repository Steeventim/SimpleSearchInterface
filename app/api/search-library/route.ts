import { NextResponse } from "next/server"
import fs from 'fs/promises'
import path from 'path'

interface SearchTerm {
  term: string
  frequency: number
  lastUsed: Date
  variants: string[]
}

interface SearchStats {
  totalSearches: number
  uniqueTerms: number
  lastUpdated: Date
}

const SEARCH_LIBRARY_PATH = path.join(process.cwd(), 'data', 'search-library.json')
const SEARCH_STATS_PATH = path.join(process.cwd(), 'data', 'search-stats.json')

// Assurer que le répertoire data existe
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Charger la bibliothèque de recherche existante
async function loadSearchLibrary(): Promise<Map<string, SearchTerm>> {
  try {
    const data = await fs.readFile(SEARCH_LIBRARY_PATH, 'utf-8')
    const library = JSON.parse(data)
    return new Map(Object.entries(library).map(([key, value]: [string, any]) => [
      key,
      {
        ...value,
        lastUsed: new Date(value.lastUsed)
      }
    ]))
  } catch {
    return new Map()
  }
}

// Sauvegarder la bibliothèque de recherche
async function saveSearchLibrary(library: Map<string, SearchTerm>) {
  await ensureDataDirectory()
  const libraryObject = Object.fromEntries(library)
  await fs.writeFile(SEARCH_LIBRARY_PATH, JSON.stringify(libraryObject, null, 2))
}

// Charger les statistiques
async function loadSearchStats(): Promise<SearchStats> {
  try {
    const data = await fs.readFile(SEARCH_STATS_PATH, 'utf-8')
    const stats = JSON.parse(data)
    return {
      ...stats,
      lastUpdated: new Date(stats.lastUpdated)
    }
  } catch {
    return {
      totalSearches: 0,
      uniqueTerms: 0,
      lastUpdated: new Date()
    }
  }
}

// Sauvegarder les statistiques
async function saveSearchStats(stats: SearchStats) {
  await ensureDataDirectory()
  await fs.writeFile(SEARCH_STATS_PATH, JSON.stringify(stats, null, 2))
}

// Normaliser un terme de recherche
function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u00C0-\u017F]/g, '') // Garder les accents
    .replace(/\s+/g, ' ')
}

// Extraire les mots individuels d'une recherche
function extractWords(query: string): string[] {
  return query
    .split(/\s+/)
    .map(word => normalizeSearchTerm(word))
    .filter(word => word.length >= 2)
}

// API pour enregistrer une recherche
export async function POST(request: Request) {
  try {
    const { query, userId, timestamp } = await request.json()
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query manquante' }, { status: 400 })
    }

    const normalizedQuery = normalizeSearchTerm(query)
    if (normalizedQuery.length < 2) {
      return NextResponse.json({ success: true, message: 'Query trop courte, ignorée' })
    }

    // Charger la bibliothèque existante
    const library = await loadSearchLibrary()
    const stats = await loadSearchStats()

    // Traiter la requête complète
    const existingTerm = library.get(normalizedQuery)
    if (existingTerm) {
      existingTerm.frequency += 1
      existingTerm.lastUsed = new Date()
    } else {
      library.set(normalizedQuery, {
        term: normalizedQuery,
        frequency: 1,
        lastUsed: new Date(),
        variants: [query] // Garder la version originale
      })
      stats.uniqueTerms += 1
    }

    // Traiter les mots individuels
    const words = extractWords(query)
    words.forEach(word => {
      const existingWord = library.get(word)
      if (existingWord) {
        existingWord.frequency += 0.5 // Moins de poids pour les mots individuels
        existingWord.lastUsed = new Date()
        if (!existingWord.variants.includes(word)) {
          existingWord.variants.push(word)
        }
      } else {
        library.set(word, {
          term: word,
          frequency: 0.5,
          lastUsed: new Date(),
          variants: [word]
        })
        stats.uniqueTerms += 1
      }
    })

    // Mettre à jour les statistiques
    stats.totalSearches += 1
    stats.lastUpdated = new Date()

    // Sauvegarder
    await saveSearchLibrary(library)
    await saveSearchStats(stats)

    // Nettoyer périodiquement les termes peu utilisés
    if (stats.totalSearches % 100 === 0) {
      await cleanupOldTerms(library)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Recherche enregistrée',
      stats: {
        totalTerms: library.size,
        totalSearches: stats.totalSearches
      }
    })
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la recherche:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// API pour récupérer la bibliothèque (pour debug/admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const minFrequency = parseInt(searchParams.get('minFrequency') || '1')

    const library = await loadSearchLibrary()
    const stats = await loadSearchStats()

    // Filtrer et trier par fréquence
    const sortedTerms = Array.from(library.values())
      .filter(term => term.frequency >= minFrequency)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)

    return NextResponse.json({
      terms: sortedTerms,
      stats,
      total: library.size
    })
  } catch (error) {
    console.error('Erreur lors de la récupération de la bibliothèque:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// Nettoyer les termes anciens et peu utilisés
async function cleanupOldTerms(library: Map<string, SearchTerm>) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const toDelete: string[] = []
  
  library.forEach((term, key) => {
    // Supprimer les termes avec fréquence < 2 et non utilisés depuis 30 jours
    if (term.frequency < 2 && term.lastUsed < thirtyDaysAgo) {
      toDelete.push(key)
    }
  })
  
  toDelete.forEach(key => library.delete(key))
  
  if (toDelete.length > 0) {
    await saveSearchLibrary(library)
    console.log(`Nettoyage: ${toDelete.length} termes supprimés`)
  }
}
