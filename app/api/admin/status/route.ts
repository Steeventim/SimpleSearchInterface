import { NextResponse } from "next/server";
import { elasticsearchConfig } from "@/lib/elasticsearch";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SystemStatus {
  elasticsearch: {
    connected: boolean;
    cluster_name?: string;
    status?: string;
    documents?: number;
    error?: string;
  };
  database: {
    connected: boolean;
    error?: string;
  };
  storage: {
    uploads_path: string;
    exists: boolean;
    file_count: number;
    total_size_mb: number;
  };
  search_stats: {
    total_searches: number;
    unique_terms: number;
    top_searches: Array<{ term: string; count: number }>;
  };
}

// Function to read search stats
async function getSearchStats() {
  const statsFilePath = path.join(process.cwd(), "data", "search-stats.json");
  try {
    if (fs.existsSync(statsFilePath)) {
      const data = fs.readFileSync(statsFilePath, "utf-8");
      const stats = JSON.parse(data);
      const totalSearches = stats.reduce(
        (sum: number, s: { count: number }) => sum + s.count,
        0
      );
      const uniqueTerms = stats.length;
      const topSearches = stats
        .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
        .slice(0, 10)
        .map((s: { term: string; count: number }) => ({
          term: s.term,
          count: s.count,
        }));

      return { totalSearches, uniqueTerms, topSearches };
    }
  } catch (error) {
    console.error("Error reading search stats:", error);
  }
  return { totalSearches: 0, uniqueTerms: 0, topSearches: [] };
}

// Function to get directory size
function getDirectoryStats(dirPath: string): { fileCount: number; totalSize: number } {
  let fileCount = 0;
  let totalSize = 0;

  try {
    if (!fs.existsSync(dirPath)) {
      return { fileCount: 0, totalSize: 0 };
    }

    const walkDir = (currentPath: string) => {
      const files = fs.readdirSync(currentPath);
      for (const file of files) {
        const filePath = path.join(currentPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          walkDir(filePath);
        } else {
          fileCount++;
          totalSize += stat.size;
        }
      }
    };

    walkDir(dirPath);
  } catch (error) {
    console.error("Error getting directory stats:", error);
  }

  return { fileCount, totalSize };
}

export async function GET() {
  const status: SystemStatus = {
    elasticsearch: { connected: false },
    database: { connected: false },
    storage: {
      uploads_path: "",
      exists: false,
      file_count: 0,
      total_size_mb: 0,
    },
    search_stats: {
      total_searches: 0,
      unique_terms: 0,
      top_searches: [],
    },
  };

  // Check Elasticsearch
  try {
    const esUrl = `${elasticsearchConfig.node}/_cluster/health`;
    const response = await fetch(esUrl, {
      method: "GET",
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
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const health = await response.json();
      status.elasticsearch = {
        connected: true,
        cluster_name: health.cluster_name,
        status: health.status,
      };

      // Get document count
      try {
        const countResponse = await fetch(
          `${elasticsearchConfig.node}/${elasticsearchConfig.index}/_count`,
          {
            method: "GET",
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
            signal: AbortSignal.timeout(5000),
          }
        );

        if (countResponse.ok) {
          const countData = await countResponse.json();
          status.elasticsearch.documents = countData.count;
        }
      } catch (e) {
        console.error("Error getting document count:", e);
      }
    } else {
      status.elasticsearch.error = `HTTP ${response.status}`;
    }
  } catch (error: any) {
    status.elasticsearch.error = error.message || "Connection failed";
  }

  // Check database via Prisma
  try {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    status.database.connected = true;
  } catch (error: any) {
    status.database.error = error.message || "Connection failed";
  }

  // Check storage
  try {
    const uploadsPath = path.join(process.cwd(), "uploads");
    status.storage.uploads_path = uploadsPath;
    status.storage.exists = fs.existsSync(uploadsPath);

    if (status.storage.exists) {
      const dirStats = getDirectoryStats(uploadsPath);
      status.storage.file_count = dirStats.fileCount;
      status.storage.total_size_mb = Math.round(dirStats.totalSize / (1024 * 1024) * 100) / 100;
    }
  } catch (error) {
    console.error("Error checking storage:", error);
  }

  // Get search stats
  const searchStats = await getSearchStats();
  status.search_stats = {
    total_searches: searchStats.totalSearches,
    unique_terms: searchStats.uniqueTerms,
    top_searches: searchStats.topSearches,
  };

  return NextResponse.json({
    ...status,
    timestamp: new Date().toISOString(),
  });
}
