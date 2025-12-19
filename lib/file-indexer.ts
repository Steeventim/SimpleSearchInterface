import fs from "fs/promises";
import { getElasticsearchClient, elasticsearchConfig } from "@/lib/elasticsearch";

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

// Fonction pour indexer un fichier dans Elasticsearch
export async function indexFile(fileInfo: {
  path: string;
  name: string;
  size: number;
  type: string;
  directory?: string;
  userId: string;
}) {
  try {
    // Préparer le document pour Elasticsearch
    const document = {
      title: fileInfo.name,
      description: `Fichier ${fileInfo.name} (${(fileInfo.size / 1024).toFixed(
        2
      )} KB)`,
      content: "", // Le contenu sera extrait côté serveur
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
      suggest: [fileInfo.name],
      user_id: fileInfo.userId, // Ajout de l'ID utilisateur
    };

    // Extraire le contenu si possible
    if (
      fileInfo.path &&
      SUPPORTED_TEXT_TYPES.some((type) => fileInfo.type.includes(type))
    ) {
      try {
        const content = await fs.readFile(fileInfo.path, "utf-8");
        document.content = content;
      } catch (error) {
        console.error(`Erreur lors de l'extraction du contenu: ${error}`);
      }
    }

    // Indexer directement dans Elasticsearch
    const client = await getElasticsearchClient();
    const result = await client.index({
      index: elasticsearchConfig.index,
      document: document,
      refresh: true, // Pour que ce soit disponible immédiatement
    });

    return result;
  } catch (error) {
    console.error(`Erreur lors de l'indexation du fichier: ${error}`);
    throw error;
  }
}

