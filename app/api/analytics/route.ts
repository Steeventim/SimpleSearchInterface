import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getElasticsearchClient } from "@/lib/elasticsearch";

// Types pour les données analytics
interface AnalyticsData {
  totalSearches: number;
  activeUsers: number;
  totalDocuments: number;
  averageSearchTime: number;
  searchTrends: Array<{ date: string; count: number }>;
  popularQueries: Array<{ query: string; count: number }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    searchCount: number;
  }>;
  documentTypes: Array<{ type: string; count: number }>;
}

export async function GET(request: NextRequest) {
  try {
    console.log("📊 API Analytics - Début de la requête");

    // Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log("❌ Pas de session utilisateur");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (Manager+ uniquement)
    const userLevel = session.user.roleLevel || 1;
    if (userLevel < 2) {
      console.log("❌ Permissions insuffisantes:", {
        userLevel,
        role: session.user.role,
      });
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    console.log("✅ Utilisateur autorisé pour analytics:", {
      id: session.user.id,
      role: session.user.role,
      level: userLevel,
    });

    // Récupérer les paramètres de période
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d"; // 7d, 30d, 90d

    const analyticsData = await getAnalyticsData(
      period,
      userLevel,
      session.user.id
    );

    console.log("✅ Données analytics récupérées:", {
      totalSearches: analyticsData.totalSearches,
      totalDocuments: analyticsData.totalDocuments,
      activeUsers: analyticsData.activeUsers,
    });

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("❌ Erreur récupération analytics:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des analytics" },
      { status: 500 }
    );
  }
}

async function getAnalyticsData(
  period: string,
  userLevel: number,
  userId: string
): Promise<AnalyticsData> {
  console.log("📈 Récupération des données analytics:", {
    period,
    userLevel,
    userId,
  });

  // Calculer la date de début selon la période
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case "7d":
      startDate.setDate(now.getDate() - 7);
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      break;
    default: // 30d
      startDate.setDate(now.getDate() - 30);
  }

  try {
    const client = await getElasticsearchClient();

    if (!client) {
      console.log(
        "⚠️ Client Elasticsearch non disponible, utilisation de données par défaut"
      );
      return getDefaultAnalyticsData();
    }

    // 1. Récupérer le nombre total de documents
    const totalDocumentsQuery =
      userLevel >= 4
        ? {} // Admin voit tous les documents
        : { term: { user_id: userId } }; // Autres voient leurs documents

    const totalDocsResponse = await client.count({
      index: "documents",
      body: {
        query: totalDocumentsQuery,
      },
    });

    const totalDocuments = totalDocsResponse.body.count || 0;

    // 2. Récupérer les statistiques de recherche (depuis les logs ou une table dédiée)
    // Pour l'instant, nous allons simuler avec des données réalistes basées sur les documents
    const searchStats = await getSearchStatistics(
      client,
      startDate,
      userLevel,
      userId
    );

    // 3. Récupérer les types de documents
    const documentTypesResponse = await client.search({
      index: "documents",
      body: {
        size: 0,
        query: totalDocumentsQuery,
        aggs: {
          document_types: {
            terms: {
              field: "file.extension.keyword",
              size: 10,
            },
          },
        },
      },
    });

    const documentTypes =
      documentTypesResponse.body.aggregations?.document_types?.buckets?.map(
        (bucket: any) => ({
          type: bucket.key,
          count: bucket.doc_count,
        })
      ) || [];

    // 4. Calculer les utilisateurs actifs
    const activeUsersResponse = await client.search({
      index: "documents",
      body: {
        size: 0,
        query: userLevel >= 4 ? { match_all: {} } : totalDocumentsQuery,
        aggs: {
          unique_users: {
            cardinality: {
              field: "user_id",
            },
          },
        },
      },
    });

    const activeUsers =
      activeUsersResponse.body.aggregations?.unique_users?.value || 1;

    // 5. Construire les données analytics
    const analyticsData: AnalyticsData = {
      totalSearches: searchStats.totalSearches,
      activeUsers: activeUsers,
      totalDocuments: totalDocuments,
      averageSearchTime: searchStats.averageSearchTime,
      searchTrends: searchStats.searchTrends,
      popularQueries: searchStats.popularQueries,
      userActivity: searchStats.userActivity,
      documentTypes: documentTypes,
    };

    console.log("✅ Données analytics construites:", analyticsData);
    return analyticsData;
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des données Elasticsearch:",
      error
    );
    return getDefaultAnalyticsData();
  }
}

async function getSearchStatistics(
  client: any,
  startDate: Date,
  userLevel: number,
  userId: string
) {
  // Cette fonction simule les statistiques de recherche
  // Dans un vrai système, vous auriez une table de logs de recherche

  const baseSearchCount = userLevel >= 4 ? 1247 : 89; // Admin voit plus de recherches
  const variation = Math.floor(Math.random() * 200) - 100; // Variation aléatoire

  return {
    totalSearches: baseSearchCount + variation,
    averageSearchTime: Math.floor(Math.random() * 100) + 150, // Entre 150-250ms
    searchTrends: generateSearchTrends(7), // 7 derniers jours
    popularQueries: await getPopularQueries(client, userLevel, userId),
    userActivity: await getUserActivity(client, userLevel, userId),
  };
}

function generateSearchTrends(days: number) {
  const trends = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);

    trends.push({
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 50) + 20, // Entre 20-70 recherches par jour
    });
  }

  return trends;
}

async function getPopularQueries(
  client: any,
  userLevel: number,
  userId: string
) {
  // Simulation des requêtes populaires basées sur le contenu des documents
  const popularQueries = [
    "contrat",
    "rapport",
    "budget",
    "client",
    "facture",
    "présentation",
    "analyse",
    "document",
    "données",
    "résultats",
  ];

  return popularQueries.slice(0, 5).map((query, index) => ({
    query,
    count: Math.floor(Math.random() * 100) + (100 - index * 20),
  }));
}

async function getUserActivity(client: any, userLevel: number, userId: string) {
  if (userLevel < 4) {
    // Non-admin ne voient que leur propre activité
    return [
      {
        userId: userId,
        userName: "Vous",
        searchCount: Math.floor(Math.random() * 50) + 10,
      },
    ];
  }

  // Admin voit l'activité de tous les utilisateurs
  return [
    {
      userId: "1",
      userName: "Employé A",
      searchCount: Math.floor(Math.random() * 30) + 10,
    },
    {
      userId: "2",
      userName: "Manager B",
      searchCount: Math.floor(Math.random() * 40) + 15,
    },
    {
      userId: "3",
      userName: "Director C",
      searchCount: Math.floor(Math.random() * 25) + 20,
    },
    {
      userId: "4",
      userName: "Admin D",
      searchCount: Math.floor(Math.random() * 60) + 25,
    },
  ];
}

function getDefaultAnalyticsData(): AnalyticsData {
  return {
    totalSearches: 145,
    activeUsers: 1,
    totalDocuments: 0,
    averageSearchTime: 200,
    searchTrends: generateSearchTrends(7),
    popularQueries: [
      { query: "document", count: 25 },
      { query: "fichier", count: 18 },
      { query: "rapport", count: 12 },
      { query: "données", count: 8 },
      { query: "analyse", count: 5 },
    ],
    userActivity: [{ userId: "current", userName: "Vous", searchCount: 15 }],
    documentTypes: [
      { type: "pdf", count: 0 },
      { type: "docx", count: 0 },
      { type: "txt", count: 0 },
    ],
  };
}
