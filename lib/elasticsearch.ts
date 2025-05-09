// Service pour communiquer avec Elasticsearch
import type { SearchFiltersType } from "@/components/search-interface";

// Type pour les résultats Elasticsearch
export interface ElasticsearchResult {
  _id: string;
  _source: {
    title: string;
    description?: string;
    content?: string;
    url?: string;
    type?: string;
    date?: string;
    file_path?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    image_url?: string;
    meta?: {
      date?: string; // Date associée au document
      format?: string; // Format du fichier (ex. application/pdf)
      creator_tool?: string; // Outil utilisé pour créer le fichier
      created?: string; // Date de création du fichier
      metadata_date?: string; // Date des métadonnées
    };
    file?: {
      extension?: string; // Extension du fichier (ex. pdf)
      content_type?: string; // Type MIME du fichier (ex. application/pdf)
      created?: string; // Date de création du fichier
      last_modified?: string; // Dernière modification du fichier
      last_accessed?: string; // Dernier accès au fichier
      indexing_date?: string; // Date d'indexation dans Elasticsearch
      filesize?: number; // Taille du fichier en octets
      filename?: string; // Nom du fichier
      url?: string; // URL du fichier
    };
    path?: {
      root?: string; // Racine du chemin
      virtual?: string; // Chemin virtuel
      real?: string; // Chemin réel sur le système de fichiers
    };
  };
  highlight?: {
    content?: string[];
    title?: string[];
    description?: string[];
  };
}

// Configuration Elasticsearch
export const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  index: process.env.ELASTICSEARCH_INDEX || "search_index",
  // Authentification optionnelle
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || "",
    password: process.env.ELASTICSEARCH_PASSWORD || "",
  },
};

// Fonction pour construire la requête Elasticsearch
export function buildElasticsearchQuery(
  query: string,
  filters: SearchFiltersType,
  size = 20,
  from = 0
) {
  // Filtre de date
  const dateFilter = (() => {
    if (filters.date === "all") return null;

    const now = new Date();
    let dateRange: { gte: string } | null = null;

    if (filters.date === "today") {
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      dateRange = { gte: today.toISOString() };
    } else if (filters.date === "this-week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      dateRange = { gte: weekAgo.toISOString() };
    } else if (filters.date === "this-month") {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      dateRange = { gte: monthAgo.toISOString() };
    } else if (filters.date === "this-year") {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      dateRange = { gte: yearAgo.toISOString() };
    }

    return dateRange ? { range: { date: dateRange } } : null;
  })();

  // Filtre de type
  const typeFilter =
    filters.type !== "all" ? { term: { type: filters.type } } : null;

  // Construire les filtres
  const filterClauses = [
    ...(dateFilter ? [dateFilter] : []),
    ...(typeFilter ? [typeFilter] : []),
  ];

  // Construire la requête
  const esQuery = {
    from,
    size,
    query: {
      bool: {
        must: {
          multi_match: {
            query,
            fields: ["title^3", "description^2", "content", "file_name^2"],
            fuzziness: "AUTO",
          },
        },
        ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
      },
    },
    highlight: {
      fields: {
        title: { number_of_fragments: 0 },
        description: { number_of_fragments: 2, fragment_size: 150 },
        content: { number_of_fragments: 2, fragment_size: 150 },
      },
      pre_tags: ["<mark>"],
      post_tags: ["</mark>"],
    },
    ...(filters.sort === "date" ? { sort: [{ date: { order: "desc" } }] } : {}),
  };

  return esQuery;
}

// Fonction pour transformer les résultats Elasticsearch en format attendu par l'interface
export function transformElasticsearchResults(results: ElasticsearchResult[]) {
  return results.map((result) => {
    const source = result._source;

    // Utiliser les highlights s'ils existent
    const description =
      result.highlight?.description?.[0] ||
      result.highlight?.content?.[0] ||
      source.description ||
      "Aucune description disponible";

    // Déterminer le type de fichier
    const fileType =
      source.type ||
      source.file?.content_type ||
      source.meta?.format ||
      (source.file_type?.includes("image")
        ? "image"
        : source.file_type?.includes("video")
        ? "video"
        : source.file_type?.includes("pdf") || source.file?.extension === "pdf"
        ? "document"
        : "article");

    // Déterminer la date
    const date =
      source.date ||
      source.file?.created ||
      source.file?.last_modified ||
      source.meta?.created ||
      source.meta?.date ||
      new Date().toISOString();

    // Déterminer le chemin du fichier
    const filePath =
      source.file_path ||
      source.path?.real ||
      source.path?.virtual ||
      undefined;

    // Déterminer l'URL de l'image
    const imageUrl =
      source.image_url ||
      (fileType === "image" ? source.file?.url || filePath : undefined);

    return {
      id: result._id,
      title: result.highlight?.title?.[0] || source.title,
      description: description,
      url: source.url || source.file?.url || `#${result._id}`,
      type: "Document",
      date: date,
      imageUrl: imageUrl,
      filePath: filePath,
      fileName: source.file_name || source.file?.filename,
      fileSize: source.file_size || source.file?.filesize,
      // Ajouter des métadonnées supplémentaires
      meta: source.meta,
      fileInfo: source.file,
      path: source.path,
    };
  });
}
