import fs from "fs/promises"
import path from "path"
import { elasticsearchConfig } from "./elasticsearch"

// Types de fichiers supportés pour l'extraction de contenu
const SUPPORTED_TEXT_TYPES = [
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
  "text/html",
  "text/javascript",
  "text/css",
]

// Fonction pour extraire le contenu d'un fichier texte
async function extractTextContent(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8")
    return content
  } catch (error) {
    console.error(`Erreur lors de l'extraction du contenu texte: ${error}`)
    return ""
  }
}

// Fonction pour indexer un fichier dans Elasticsearch
export async function indexFile(fileInfo: {
  path: string
  name: string
  size: number
  type: string
  directory?: string
}) {
  try {
    // Déterminer si nous pouvons extraire le contenu
    const canExtractContent = SUPPORTED_TEXT_TYPES.some((type) => fileInfo.type.includes(type))

    // Extraire le contenu si possible
    let content = ""
    if (canExtractContent) {
      content = await extractTextContent(fileInfo.path)
    }

    // Préparer le document pour Elasticsearch
    const document = {
      title: fileInfo.name,
      description: `Fichier ${fileInfo.name} (${(fileInfo.size / 1024).toFixed(2)} KB)`,
      content: content,
      file_path: fileInfo.path,
      file_name: fileInfo.name,
      file_size: fileInfo.size,
      file_type: fileInfo.type,
      type: fileInfo.type.includes("image")
        ? "image"
        : fileInfo.type.includes("video")
          ? "video"
          : fileInfo.type.includes("pdf") || fileInfo.type.includes("document")
            ? "document"
            : "article",
      date: new Date().toISOString(),
      directory: fileInfo.directory || "",
      // Champ pour les suggestions
      suggest: [fileInfo.name, path.basename(fileInfo.name, path.extname(fileInfo.name))],
    }

    // Indexer dans Elasticsearch
    const response = await fetch(`${elasticsearchConfig.node}/${elasticsearchConfig.index}/_doc`, {
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
      body: JSON.stringify(document),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erreur Elasticsearch: ${error}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error(`Erreur lors de l'indexation du fichier: ${error}`)
    throw error
  }
}

// Fonction pour supprimer un fichier de l'index
export async function removeFileFromIndex(fileName: string) {
  try {
    // Rechercher le document par nom de fichier
    const searchResponse = await fetch(`${elasticsearchConfig.node}/${elasticsearchConfig.index}/_search`, {
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
      body: JSON.stringify({
        query: {
          match: {
            file_name: fileName,
          },
        },
      }),
    })

    if (!searchResponse.ok) {
      throw new Error(`Erreur lors de la recherche du document: ${await searchResponse.text()}`)
    }

    const searchResult = await searchResponse.json()
    const hits = searchResult.hits.hits

    // Supprimer chaque document trouvé
    for (const hit of hits) {
      const deleteResponse = await fetch(`${elasticsearchConfig.node}/${elasticsearchConfig.index}/_doc/${hit._id}`, {
        method: "DELETE",
        headers: {
          ...(elasticsearchConfig.auth.username && elasticsearchConfig.auth.password
            ? {
                Authorization: `Basic ${Buffer.from(
                  `${elasticsearchConfig.auth.username}:${elasticsearchConfig.auth.password}`,
                ).toString("base64")}`,
              }
            : {}),
        },
      })

      if (!deleteResponse.ok) {
        console.error(`Erreur lors de la suppression du document ${hit._id}: ${await deleteResponse.text()}`)
      }
    }

    return hits.length > 0
  } catch (error) {
    console.error(`Erreur lors de la suppression du fichier de l'index: ${error}`)
    throw error
  }
}
