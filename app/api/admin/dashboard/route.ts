import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { elasticsearchConfig } from "@/lib/elasticsearch";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "CENADI_DIRECTOR") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Parallel fetches for speed
    const [
      usersData,
      searchHistoryData,
      recentActivity,
      searchTrends,
      esData,
      storageData,
      searchStatsData,
    ] = await Promise.all([
      getUsersOverview(),
      getSearchHistoryStats(),
      getRecentActivity(),
      getSearchTrends(),
      getElasticsearchStats(),
      getStorageStats(),
      getFileSearchStats(),
    ]);

    return NextResponse.json({
      users: usersData,
      searchHistory: searchHistoryData,
      recentActivity,
      searchTrends,
      elasticsearch: esData,
      storage: storageData,
      searchStats: searchStatsData,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

async function getUsersOverview() {
  try {
    const [total, byRole, byDivision, recentUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
      prisma.user.groupBy({ by: ["division"], _count: { division: true } }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, division: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    return {
      total,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count.role })),
      byDivision: byDivision
        .filter((d) => d.division !== null)
        .map((d) => ({ division: d.division!, count: d._count.division })),
      recentUsers,
    };
  } catch {
    return { total: 0, byRole: [], byDivision: [], recentUsers: [] };
  }
}

async function getSearchHistoryStats() {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, today, week, month, topQueries, avgResults] =
      await Promise.all([
        prisma.searchHistory.count(),
        prisma.searchHistory.count({ where: { createdAt: { gte: last24h } } }),
        prisma.searchHistory.count({ where: { createdAt: { gte: last7d } } }),
        prisma.searchHistory.count({ where: { createdAt: { gte: last30d } } }),
        prisma.searchHistory.groupBy({
          by: ["query"],
          _count: { query: true },
          orderBy: { _count: { query: "desc" } },
          take: 10,
        }),
        prisma.searchHistory.aggregate({ _avg: { resultsCount: true } }),
      ]);

    return {
      total,
      today,
      week,
      month,
      avgResultsPerSearch: Math.round(avgResults._avg.resultsCount || 0),
      topQueries: topQueries.map((q) => ({
        query: q.query,
        count: q._count.query,
      })),
    };
  } catch {
    return {
      total: 0,
      today: 0,
      week: 0,
      month: 0,
      avgResultsPerSearch: 0,
      topQueries: [],
    };
  }
}

async function getRecentActivity() {
  try {
    const activities = await prisma.activityLog.findMany({
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        user: { select: { name: true, email: true, division: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return activities;
  } catch {
    return [];
  }
}

async function getSearchTrends() {
  try {
    // Get daily search counts for the last 30 days
    const last30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const searches = await prisma.searchHistory.findMany({
      where: { createdAt: { gte: last30d } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const byDate = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      byDate.set(d.toISOString().split("T")[0], 0);
    }
    for (const s of searches) {
      const key = s.createdAt.toISOString().split("T")[0];
      byDate.set(key, (byDate.get(key) || 0) + 1);
    }

    return Array.from(byDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  } catch {
    return [];
  }
}

async function getElasticsearchStats() {
  try {
    const esUrl = elasticsearchConfig.node;
    const index = elasticsearchConfig.index;

    const [healthRes, countRes, indexRes] = await Promise.all([
      fetch(`${esUrl}/_cluster/health`).then((r) => r.json()),
      fetch(`${esUrl}/${index}/_count`).then((r) => r.json()),
      fetch(`${esUrl}/${index}/_stats`).then((r) => r.json()),
    ]);

    const indexStats = indexRes._all?.primaries || indexRes.indices?.[index]?.primaries || {};

    return {
      healthy: healthRes.status !== "red",
      status: healthRes.status,
      clusterName: healthRes.cluster_name,
      nodeCount: healthRes.number_of_nodes,
      documentCount: countRes.count || 0,
      indexSizeBytes: indexStats.store?.size_in_bytes || 0,
      indexSizeMB: Math.round((indexStats.store?.size_in_bytes || 0) / 1024 / 1024),
    };
  } catch {
    return {
      healthy: false,
      status: "red",
      clusterName: "unknown",
      nodeCount: 0,
      documentCount: 0,
      indexSizeBytes: 0,
      indexSizeMB: 0,
    };
  }
}

async function getStorageStats() {
  const uploadsDir = process.env.UPLOAD_DIRECTORY || path.join(process.cwd(), "uploads");
  try {
    if (!fs.existsSync(uploadsDir)) {
      return { totalFiles: 0, totalSizeMB: 0, byDivision: [] };
    }

    const divisions = ["DEP", "DEL", "DTB", "DIRE", "DAAF"];
    const byDivision: { division: string; files: number; sizeMB: number }[] = [];
    let totalFiles = 0;
    let totalSize = 0;

    for (const div of divisions) {
      const divPath = path.join(uploadsDir, div);
      if (fs.existsSync(divPath)) {
        const { files, size } = walkDir(divPath);
        byDivision.push({ division: div, files, sizeMB: Math.round(size / 1024 / 1024 * 10) / 10 });
        totalFiles += files;
        totalSize += size;
      } else {
        byDivision.push({ division: div, files: 0, sizeMB: 0 });
      }
    }

    return {
      totalFiles,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 10) / 10,
      byDivision,
    };
  } catch {
    return { totalFiles: 0, totalSizeMB: 0, byDivision: [] };
  }
}

function walkDir(dir: string): { files: number; size: number } {
  let files = 0;
  let size = 0;
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = walkDir(full);
        files += sub.files;
        size += sub.size;
      } else {
        files++;
        try { size += fs.statSync(full).size; } catch {}
      }
    }
  } catch {}
  return { files, size };
}

async function getFileSearchStats() {
  try {
    const statsPath = path.join(process.cwd(), "data", "search-stats.json");
    if (!fs.existsSync(statsPath)) return { terms: [], totalSearches: 0, uniqueTerms: 0 };
    const raw = fs.readFileSync(statsPath, "utf-8");
    const stats: { term: string; count: number }[] = JSON.parse(raw);
    const sorted = stats.sort((a, b) => b.count - a.count);
    return {
      terms: sorted.slice(0, 15),
      totalSearches: sorted.reduce((s, t) => s + t.count, 0),
      uniqueTerms: sorted.length,
    };
  } catch {
    return { terms: [], totalSearches: 0, uniqueTerms: 0 };
  }
}
