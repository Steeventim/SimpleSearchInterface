import { NextResponse } from "next/server";
import fs from "fs/promises";
import { elasticsearchConfig } from "@/lib/elasticsearch";

// Types de fichiers supportés pour l'extraction de contenu
const SUPPORTED_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "text/javascript",
  "text/css",
];

// Fonction pour extraire le contenu d'un fichier texte
async function extractTextContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Erreur lors de l'extraction du contenu texte: ${error}`);
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const document = await request.json();

    // Extraire le contenu si possible
    if (
      document.file_path &&
      SUPPORTED_TEXT_TYPES.some((type) => document.file_type?.includes(type))
    ) {
      try {
        document.content = await extractTextContent(document.file_path);
      } catch (error) {
        console.error(`Erreur lors de l'extraction du contenu: ${error}`);
        // Continuer même si l'extraction échoue
      }
    }

    // Indexer dans Elasticsearch
    const response = await fetch(
      `${elasticsearchConfig.node}/${elasticsearchConfig.index}/_doc`,
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
        body: JSON.stringify(document),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur Elasticsearch: ${error}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error(`Erreur lors de l'indexation du fichier: ${error}`);
    return NextResponse.json(
      { error: `Erreur lors de l'indexation: ${error}` },
      { status: 500 }
    );
  }
}
