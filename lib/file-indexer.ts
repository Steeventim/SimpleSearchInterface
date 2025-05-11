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
    };

    // Indexer dans Elasticsearch via une API route
    const response = await fetch("/api/index-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(document),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur Elasticsearch: ${error}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Erreur lors de l'indexation du fichier: ${error}`);
    throw error;
  }
}

// Fonction pour supprimer un fichier de l'index
export async function removeFileFromIndex(fileName: string) {
  try {
    // Appeler l'API pour supprimer le fichier de l'index
    const response = await fetch("/api/remove-file-index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileName }),
    });

    if (!response.ok) {
      throw new Error(
        `Erreur lors de la suppression du fichier de l'index: ${await response.text()}`
      );
    }

    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error(
      `Erreur lors de la suppression du fichier de l'index: ${error}`
    );
    throw error;
  }
}
