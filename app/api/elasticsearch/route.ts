import { NextResponse } from "next/server";
import { elasticsearchConfig } from "@/lib/elasticsearch";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Récupérer l'endpoint Elasticsearch spécifique s'il est fourni
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint") || "_search";

    console.log(`Envoi de requête Elasticsearch à l'endpoint: ${endpoint}`);
    console.log("Requête:", JSON.stringify(body, null, 2));

    // Construire l'URL complète
    const url = `${elasticsearchConfig.node}/${elasticsearchConfig.index}/${endpoint}`;
    console.log("URL Elasticsearch:", url);

    // Envoyer la requête à Elasticsearch
    const response = await fetch(url, {
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
      body: JSON.stringify(body),
    });

    // Récupérer la réponse
    const data = await response.json();

    // Vérifier si la réponse contient une erreur
    if (response.status >= 400) {
      console.error("Erreur Elasticsearch:", data);
      return NextResponse.json(
        { error: "Erreur Elasticsearch", details: data },
        { status: response.status }
      );
    }

    console.log("Réponse Elasticsearch reçue avec succès");
    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Erreur lors de l'exécution de la requête Elasticsearch:",
      error
    );
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'exécution de la requête" },
      { status: 500 }
    );
  }
}
