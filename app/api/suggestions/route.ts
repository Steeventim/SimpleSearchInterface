import { NextResponse } from "next/server"
import { elasticsearchConfig } from "@/lib/elasticsearch"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import fs from 'fs/promises'
import path from 'path'

interface Suggestion {
  text: string;
  type: 'completion' | 'recent' | 'popular' | 'semantic' | 'learned';
  score: number;
  category?: string;
  context?: string;
  frequency?: number;
}

interface SearchTerm {
  term: string
  frequency: number
  lastUsed: Date
  variants: string[]
}

const SEARCH_LIBRARY_PATH = path.join(process.cwd(), 'data', 'search-library.json')

// Charger la bibliothèque de recherche dynamique
async function loadLearnedTerms(): Promise<Map<string, SearchTerm>> {
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

export async function GET(request: Request) {
  let query = ""
  try {
    const { searchParams } = new URL(request.url)
    query = searchParams.get("q") || ""
    const maxResults = parseInt(searchParams.get("limit") || "8")

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Combiner plusieurs types de suggestions
    const suggestions: Suggestion[] = []

    // 0. Récupérer la session pour le RBAC
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role
    const userDivision = (session?.user as any)?.division

    // 1. Suggestions par complétion Elasticsearch
    try {
      const elasticSuggestions = await getElasticsearchSuggestions(query, userDivision, userRole)
      suggestions.push(...elasticSuggestions)
    } catch (error) {
      console.warn("Elasticsearch suggestions failed:", error)
    }

    // 2. Suggestions basées sur les termes populaires
    const popularSuggestions = getPopularSuggestions(query)
    suggestions.push(...popularSuggestions)

    // 3. Suggestions contextuelles
    const contextualSuggestions = getContextualSuggestions(query)
    suggestions.push(...contextualSuggestions)

    // 4. Suggestions de correction orthographique
    const correctionSuggestions = getSpellingSuggestions(query)
    suggestions.push(...correctionSuggestions)

    // 5. Suggestions depuis la bibliothèque apprise
    const learnedSuggestions = await getLearnedSuggestions(query)
    suggestions.push(...learnedSuggestions)

    // Dédupliquer, scorer et trier
    const uniqueSuggestions = deduplicateAndScore(suggestions, query)
    const topSuggestions = uniqueSuggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)

    return NextResponse.json({
      suggestions: topSuggestions.map(s => s.text),
      enhanced: topSuggestions // Version avec métadonnées
    })
  } catch (error) {
    console.error("Suggestions API error:", error)
    return getFallbackSuggestions(query)
  }
}

async function getElasticsearchSuggestions(query: string, division?: string, role?: string): Promise<Suggestion[]> {
  // Filtre de division pour les suggestions
  const pathFilter = role !== "CENADI_DIRECTOR" && division ? {
    wildcard: { "path.real": `*/${division}/*` }
  } : null;

  // Puisque le champ 'suggest' de type completion n'existe pas dans le mapping,
  // nous utilisons une recherche standard avec match_phrase_prefix sur le titre et le contenu.
  const esQuery = {
    size: 0, // Nous n'avons pas besoin des hits, seulement des suggestions
    query: pathFilter ? { bool: { filter: [pathFilter] } } : { match_all: {} },
    aggs: {
      "title-suggestions": {
        filter: {
          bool: {
            must: [
              { prefix: { "file.filename": query.toLowerCase() } }
            ],
            ...(pathFilter ? { filter: [pathFilter] } : {})
          }
        },
        aggs: {
          "titles": {
            terms: {
              field: "file.filename",
              size: 5
            }
          }
        }
      }
    }
  }

  const response = await fetch(`${elasticsearchConfig.node}/${elasticsearchConfig.index}/_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(elasticsearchConfig.auth.username && elasticsearchConfig.auth.password
        ? {
          Authorization: `Basic ${Buffer.from(
            `${elasticsearchConfig.auth.username}:${elasticsearchConfig.auth.password}`,
          ).toString("base64")}`,
        }
        : {}),
    },
    body: JSON.stringify(esQuery),
  })

  if (!response.ok) {
    throw new Error(`Elasticsearch error: ${response.status}`)
  }

  const data = await response.json()
  const suggestions: Suggestion[] = []

  // Title suggestions from aggregations
  const titleBuckets = data.aggregations?.["title-suggestions"]?.titles?.buckets || []
  titleBuckets.forEach((bucket: any) => {
    suggestions.push({
      text: bucket.key,
      type: 'completion',
      score: 1.0,
      category: 'title-match'
    })
  })

  // Phrase suggestions
  const phrases = data.suggest?.["phrase-suggest"]?.[0]?.options || []
  phrases.forEach((option: any) => {
    suggestions.push({
      text: option.text,
      type: 'semantic',
      score: option.score || 0.5,
      category: 'phrase-correction'
    })
  })

  return suggestions
}

function getPopularSuggestions(query: string): Suggestion[] {
  // Base de données de termes populaires dans le domaine juridique/administratif
  const popularTerms = [
    'décret', 'arrêté', 'ordonnance', 'loi', 'règlement',
    'ministère', 'administration', 'gouvernement', 'république',
    'cameroun', 'yaoundé', 'douala', 'région', 'département',
    'gestion', 'développement', 'politique', 'économie', 'social',
    'environnement', 'santé', 'éducation', 'transport', 'agriculture',
    'commerce', 'industrie', 'justice', 'sécurité', 'défense'
  ]

  return popularTerms
    .filter(term => term.toLowerCase().includes(query.toLowerCase()))
    .map(term => ({
      text: term,
      type: 'popular' as const,
      score: calculatePopularityScore(term, query),
      category: 'popular-terms'
    }))
}

function getContextualSuggestions(query: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lowerQuery = query.toLowerCase()

  // Suggestions contextuelles basées sur les patterns courants
  const contextualPatterns = [
    {
      pattern: /décret/i,
      suggestions: ['décret ministériel', 'décret présidentiel', 'décret application']
    },
    {
      pattern: /loi/i,
      suggestions: ['loi de finances', 'loi organique', 'loi constitutionnelle']
    },
    {
      pattern: /gestion/i,
      suggestions: ['gestion publique', 'gestion des ressources', 'gestion administrative']
    },
    {
      pattern: /développement/i,
      suggestions: ['développement durable', 'développement économique', 'développement social']
    }
  ]

  contextualPatterns.forEach(({ pattern, suggestions: contextSuggestions }) => {
    if (pattern.test(query)) {
      contextSuggestions.forEach(suggestion => {
        if (suggestion.toLowerCase().includes(lowerQuery)) {
          suggestions.push({
            text: suggestion,
            type: 'semantic',
            score: 0.7,
            category: 'contextual',
            context: 'Terme connexe'
          })
        }
      })
    }
  })

  return suggestions
}

function getSpellingSuggestions(query: string): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Corrections orthographiques courantes
  const corrections = [
    { wrong: 'decret', correct: 'décret' },
    { wrong: 'arrete', correct: 'arrêté' },
    { wrong: 'ministere', correct: 'ministère' },
    { wrong: 'republique', correct: 'république' },
    { wrong: 'camerou', correct: 'cameroun' },
    { wrong: 'yaunde', correct: 'yaoundé' },
    { wrong: 'developement', correct: 'développement' },
    { wrong: 'economie', correct: 'économie' }
  ]

  const lowerQuery = query.toLowerCase()
  corrections.forEach(({ wrong, correct }) => {
    if (lowerQuery.includes(wrong)) {
      const corrected = query.toLowerCase().replace(wrong, correct)
      suggestions.push({
        text: corrected,
        type: 'completion',
        score: 0.8,
        category: 'spelling-correction',
        context: 'Correction orthographique'
      })
    }
  })

  return suggestions
}

async function getLearnedSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const learnedTerms = await loadLearnedTerms()
    const suggestions: Suggestion[] = []
    const queryLower = query.toLowerCase()

    // Filtrer les termes qui correspondent à la requête
    learnedTerms.forEach((searchTerm, key) => {
      const termLower = key.toLowerCase()

      // Correspondance exacte au début
      if (termLower.startsWith(queryLower) && termLower !== queryLower) {
        suggestions.push({
          text: searchTerm.term,
          type: 'learned',
          score: calculateLearnedScore(searchTerm, query),
          category: 'user-learned',
          context: `Recherché ${searchTerm.frequency} fois`,
          frequency: searchTerm.frequency
        })
      }

      // Correspondance dans les variantes
      searchTerm.variants.forEach(variant => {
        const variantLower = variant.toLowerCase()
        if (variantLower.includes(queryLower) && variantLower !== queryLower) {
          suggestions.push({
            text: variant,
            type: 'learned',
            score: calculateLearnedScore(searchTerm, query) * 0.8, // Score réduit pour les variantes
            category: 'user-learned-variant',
            context: `Variante recherchée ${searchTerm.frequency} fois`,
            frequency: searchTerm.frequency
          })
        }
      })
    })

    // Retourner les meilleures suggestions apprises
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 5) // Limiter à 5 suggestions apprises
  } catch (error) {
    console.warn('Erreur lors de la récupération des suggestions apprises:', error)
    return []
  }
}

function calculateLearnedScore(searchTerm: SearchTerm, query: string): number {
  const baseScore = Math.min(searchTerm.frequency / 10, 1) // Score basé sur la fréquence (max 1.0)
  const relevanceScore = calculateRelevance(searchTerm.term, query)

  // Bonus pour les recherches récentes
  const daysSinceLastUse = (Date.now() - searchTerm.lastUsed.getTime()) / (1000 * 60 * 60 * 24)
  const recencyBonus = Math.max(0, 1 - daysSinceLastUse / 30) * 0.2 // Bonus de 0.2 pour les recherches de moins de 30 jours

  return (baseScore * 0.6 + relevanceScore * 0.4) + recencyBonus
}

function calculatePopularityScore(term: string, query: string): number {
  const queryLower = query.toLowerCase()
  const termLower = term.toLowerCase()

  // Score plus élevé si le terme commence par la requête
  if (termLower.startsWith(queryLower)) {
    return 0.9
  }

  // Score moyen si le terme contient la requête
  if (termLower.includes(queryLower)) {
    return 0.6
  }

  // Score de base
  return 0.3
}

function deduplicateAndScore(suggestions: Suggestion[], query: string): Suggestion[] {
  const uniqueMap = new Map<string, Suggestion>()

  suggestions.forEach(suggestion => {
    const key = suggestion.text.toLowerCase()
    const existing = uniqueMap.get(key)

    if (!existing || suggestion.score > existing.score) {
      // Ajuster le score en fonction de la pertinence avec la requête
      const adjustedScore = suggestion.score * calculateRelevance(suggestion.text, query)
      uniqueMap.set(key, { ...suggestion, score: adjustedScore })
    }
  })

  return Array.from(uniqueMap.values())
}

function calculateRelevance(suggestion: string, query: string): number {
  const suggestionLower = suggestion.toLowerCase()
  const queryLower = query.toLowerCase()

  // Exact match
  if (suggestionLower === queryLower) return 1.0

  // Starts with query
  if (suggestionLower.startsWith(queryLower)) return 0.9

  // Contains query
  if (suggestionLower.includes(queryLower)) return 0.7

  // Fuzzy match (simple Levenshtein distance approximation)
  const distance = levenshteinDistance(suggestionLower, queryLower)
  const maxLength = Math.max(suggestionLower.length, queryLower.length)
  return Math.max(0, 1 - (distance / maxLength))
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        )
      }
    }
  }

  return matrix[str2.length][str1.length]
}

function getFallbackSuggestions(query: string) {
  const fallbackSuggestions = [
    `${query} décret`,
    `${query} loi`,
    `${query} arrêté`,
    `${query} règlement`,
    `${query} ministère`,
    `${query} administration`,
    `${query} gouvernement`,
    `${query} politique publique`
  ].filter(s => s.length > query.length + 2) // Éviter les suggestions trop courtes

  return NextResponse.json({
    suggestions: fallbackSuggestions.slice(0, 5),
    fallback: true
  })
}
