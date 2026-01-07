import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  buildElasticsearchQuery,
  elasticsearchConfig,
  transformElasticsearchResults,
} from "@/lib/elasticsearch";

// Helper function to track search
async function trackSearch(searchTerm: string, baseUrl: string) {
  try {
    await fetch(`${baseUrl}/api/search-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchTerm }),
    });
  } catch (error) {
    console.error("Failed to track search:", error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const date = searchParams.get("date") || "all";
    const type = searchParams.get("type") || "all";
    const sort = searchParams.get("sort") || "relevance";
    const size = Number.parseInt(searchParams.get("size") || "20");
    const from = Number.parseInt(searchParams.get("from") || "0");

    if (!query) {
      return NextResponse.json({ results: [], total: 0 });
    }

    // Track this search in stats (non-blocking)
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    trackSearch(query, baseUrl);

    // Obtenir la session pour le RBAC
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userDivision = (session?.user as any)?.division;

    // Construire la requête Elasticsearch
    const esQuery = buildElasticsearchQuery(
      query,
      { date, type, sort } as any,
      size,
      from,
      userDivision,
      userRole
    );

    console.log("Elasticsearch query:", JSON.stringify(esQuery, null, 2));

    // Appeler Elasticsearch
    const response = await fetch(
      `${elasticsearchConfig.node}/${elasticsearchConfig.index}/_search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(elasticsearchConfig.auth.username &&
            elasticsearchConfig.auth.password
            ? {
              Authorization: `Basic ${Buffer.from(
                `${elasticsearchConfig.auth.username}:${elasticsearchConfig.auth.password}`
              ).toString("base64")}`,
            }
            : {}),
        },
        body: JSON.stringify(esQuery),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Elasticsearch error:", error);
      throw new Error(`Elasticsearch error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Elasticsearch response:", JSON.stringify(data, null, 2));

    // Transformer les résultats
    const results = transformElasticsearchResults(data.hits.hits, query);

    return NextResponse.json({
      results,
      total: data.hits.total.value || 0,
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la recherche" },
      { status: 500 }
    );
  }
}
