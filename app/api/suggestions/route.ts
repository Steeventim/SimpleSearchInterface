import { NextResponse } from "next/server"
import { elasticsearchConfig } from "@/lib/elasticsearch"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    // Construire la requête pour les suggestions
    const esQuery = {
      suggest: {
        text: query,
        completion: {
          prefix: query,
          completion: {
            field: "suggest",
            size: 5,
            skip_duplicates: true,
            fuzzy: {
              fuzziness: "AUTO",
            },
          },
        },
      },
    }

    // Appeler Elasticsearch
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
      // En cas d'erreur, simuler des suggestions pour la démo
      return NextResponse.json({
        suggestions: [
          `${query} recherche`,
          `${query} avancée`,
          `${query} intelligence artificielle`,
          `${query} moteur`,
        ],
      })
    }

    const data = await response.json()

    // Extraire les suggestions
    const suggestions = data.suggest?.completion[0]?.options.map((option: any) => option.text) || []

    return NextResponse.json({ suggestions })
  } catch (error) {
    const { searchParams } = new URL(request.url)
    console.error("Suggestions API error:", error)

    // En cas d'erreur, simuler des suggestions pour la démo
    return NextResponse.json({
      suggestions: [
        `${searchParams.get("q")} recherche`,
        `${searchParams.get("q")} avancée`,
        `${searchParams.get("q")} intelligence artificielle`,
        `${searchParams.get("q")} moteur`,
      ],
    })
  }
}
