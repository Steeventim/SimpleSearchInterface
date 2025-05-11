import { NextResponse } from "next/server";
import { elasticsearchConfig } from "@/lib/elasticsearch";

export async function POST(request: Request) {
  try {
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "Nom de fichier non spécifié" },
        { status: 400 }
      );
    }

    // Rechercher le document par nom de fichier
    const searchResponse = await fetch(
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
        body: JSON.stringify({
          query: {
            match: {
              file_name: fileName,
            },
          },
        }),
      }
    );

    if (!searchResponse.ok) {
      throw new Error(
        `Erreur lors de la recherche du document: ${await searchResponse.text()}`
      );
    }

    const searchResult = await searchResponse.json();
    const hits = searchResult.hits.hits;

    // Supprimer chaque document trouvé
    const deleteResults = [];
    for (const hit of hits) {
      const deleteResponse = await fetch(
        `${elasticsearchConfig.node}/${elasticsearchConfig.index}/_doc/${hit._id}`,
        {
          method: "DELETE",
          headers: {
            ...(elasticsearchConfig.auth.username &&
            elasticsearchConfig.auth.password
              ? {
                  Authorization: `Basic ${Buffer.from(
                    `${elasticsearchConfig.auth.username}:${elasticsearchConfig.auth.password}`
                  ).toString("base64")}`,
                }
              : {}),
          },
        }
      );

      if (!deleteResponse.ok) {
        console.error(
          `Erreur lors de la suppression du document ${
            hit._id
          }: ${await deleteResponse.text()}`
        );
      } else {
        deleteResults.push(await deleteResponse.json());
      }
    }

    return NextResponse.json({
      success: true,
      deleted: hits.length,
      results: deleteResults,
    });
  } catch (error) {
    console.error(
      `Erreur lors de la suppression du fichier de l'index: ${error}`
    );
    return NextResponse.json(
      {
        error: `Erreur lors de la suppression du fichier de l'index: ${error}`,
      },
      { status: 500 }
    );
  }
}
