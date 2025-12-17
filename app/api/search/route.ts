import { NextResponse } from "next/server";
import {
  buildElasticsearchQuery,
  elasticsearchConfig,
  transformElasticsearchResults,
} from "@/lib/elasticsearch";

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

    // Construire la requête Elasticsearch
    const esQuery = buildElasticsearchQuery(
      query,
      { date, type, sort } as any,
      size,
      from
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
