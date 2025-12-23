import { Client } from "@elastic/elasticsearch";

// Service pour communiquer avec Elasticsearch
import type { SearchFiltersType } from "@/components/search-interface";

// Configuration Elasticsearch
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

// Fonction pour obtenir le client Elasticsearch
export async function getElasticsearchClient() {
  return client;
}

// Fonction pour obtenir les documents d'un utilisateur
export async function getUserDocuments(
  userId: string,
  size: number = 20,
  from: number = 0
) {
  try {
    const result = await client.search({
      index: process.env.ELASTICSEARCH_INDEX || "cenadi_document1",
      query: {
        term: {
          "user_id.keyword": userId,
        },
      },
      size,
      from,
      sort: [{ "file.indexing_date": { order: "desc" } }],
    });

    return {
      documents: result.hits.hits,
      total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total || 0,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération des documents utilisateur:", error);
    throw error;
  }
}

// Fonction pour supprimer un document utilisateur
export async function deleteUserDocument(userId: string, documentId: string) {
  try {
    // Vérifier que le document appartient à l'utilisateur
    const doc = await client.get({
      index: process.env.ELASTICSEARCH_INDEX || "cenadi_document1",
      id: documentId,
    });

    // @ts-ignore - _source is present but types might need strict definition
    if (doc._source && doc._source.user_id !== userId) {
      throw new Error("Document non autorisé pour cet utilisateur");
    }

    // Supprimer le document
    await client.delete({
      index: process.env.ELASTICSEARCH_INDEX || "cenadi_document1",
      id: documentId,
    });

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du document:", error);
    throw error;
  }
}

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
  index: process.env.ELASTICSEARCH_INDEX || "cenadi_document1",
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
  from = 0,
  division?: string,
  role?: string
) {
  // Filtre de division (RBAC basé sur le chemin)
  // Si l'utilisateur n'est pas le Directeur Général de CENADI, on restreint à son dossier
  const pathFilter = (() => {
    if (!role || role === "CENADI_DIRECTOR") return null;

    // Si l'utilisateur a une division (ex: DEL), on filtre par le chemin contenant /DEL/
    if (division) {
      return {
        wildcard: {
          "path.real": `*/${division}/*`
        }
      };
    }

    return null;
  })();
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
    ...(pathFilter ? [pathFilter] : []),
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
            operator: "and", // Force all terms to be present
            // fuzziness: "AUTO", // Disable fuzziness for exact matching
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
      max_analyzed_offset: 1000000,
    },
    ...(filters.sort === "date" ? { sort: [{ date: { order: "desc" } }] } : {}),
  };

  return esQuery;
}

// Helper pour extraire un snippet manuellement si Elasticsearch ne renvoie pas de highlight
function extractSnippet(content: string, query: string, windowData: number = 100): string {
  if (!content || !query) return "";

  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);

  let bestIndex = -1;
  let bestTerm = "";

  // Chercher la meilleure occurrence d'un terme
  for (const term of queryTerms) {
    const idx = contentLower.indexOf(term);
    if (idx !== -1) {
      if (bestIndex === -1 || idx < bestIndex) {
        bestIndex = idx;
        bestTerm = term;
      }
    }
  }

  if (bestIndex === -1) return content.substring(0, 200) + "...";

  const start = Math.max(0, bestIndex - windowData);
  const end = Math.min(content.length, bestIndex + bestTerm.length + windowData);

  let snippet = content.substring(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";

  // Highlighter grossièrement
  queryTerms.forEach(term => {
    snippet = snippet.replace(new RegExp(term, 'gi'), match => `<mark>${match}</mark>`);
  });

  return snippet;
}

// Fonction pour transformer les résultats Elasticsearch en format attendu par l'interface
export function transformElasticsearchResults(results: ElasticsearchResult[], query: string = "") {
  return results.map((result) => {
    const source = result._source;

    // Utiliser les highlights s'ils existent
    // Utiliser les highlights s'ils existent, sinon extraction manuelle, sinon description
    const description =
      result.highlight?.description?.[0] ||
      result.highlight?.content?.[0] ||
      source.description ||
      (source.content ? extractSnippet(source.content, query) : "Aucune description disponible");

    // Déterminer le type de fichier
    let fileType = "document";
    const extension = (source.file?.extension ||
      (source.file_name || "").split('.').pop()?.toLowerCase() || "").toLowerCase();

    if ((source.file_type && source.file_type.includes("image")) || ["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) {
      fileType = "image";
    } else if (source.file_type && source.file_type.includes("video")) {
      fileType = "video";
    } else if (["pptx", "ppt"].includes(extension)) {
      fileType = "powerpoint";
    } else if (["docx", "doc"].includes(extension)) {
      fileType = "word";
    } else if (["xlsx", "xls"].includes(extension)) {
      fileType = "excel";
    } else if (extension === "pdf") {
      fileType = "pdf";
    }

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

    // Générer une URL HTTP valide pour les PDFs
    let documentUrl = source.url || source.file?.url || `#${result._id}`;

    // Extensions de fichiers supportées pour la visualisation via l'API
    const supportedExtensions = [".pdf", ".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls"];
    const fileExtension = source.file?.extension ? `.${source.file.extension}` : "";
    const fileNameLower = (source.file_name || source.file?.filename || "").toLowerCase();

    const isSupportedDocument =
      supportedExtensions.some(ext => fileNameLower.endsWith(ext)) ||
      (fileExtension && supportedExtensions.includes(fileExtension.toLowerCase()));

    // Si c'est un document supporté avec un chemin local, créer une URL API
    if (filePath && isSupportedDocument) {
      // Approche simplifiée: extraire seulement le nom du fichier
      // Le serveur API utilise une recherche récursive pour trouver le fichier
      let relativePath = filePath;

      // Nettoyer les URLs file://
      if (relativePath.startsWith("file://")) {
        relativePath = relativePath.replace("file://", "");
      }

      // Extraire seulement le nom du fichier (le serveur fera la recherche récursive)
      const fileName = relativePath.split(/[/\\]/).pop() || relativePath;

      // Encoder le nom du fichier pour l'URL
      const encodedPath = encodeURIComponent(fileName);
      documentUrl = `/api/pdf/${encodedPath}`;

      console.log("🔄 Document URL transformée:", {
        original: filePath,
        fileName: fileName,
        transformed: documentUrl,
      });
    }

    // Déterminer l'URL de l'image
    const imageUrl =
      source.image_url ||
      (fileType === "image" ? source.file?.url || filePath : undefined);

    return {
      id: result._id,
      title: result.highlight?.title?.[0] || source.title,
      description: description,
      url: documentUrl,
      type: fileType,
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
