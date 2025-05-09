import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Tableau en mémoire pour stocker les logs (pour la démonstration)
// Dans une application réelle, vous utiliseriez une base de données
const inMemoryLogs: Array<{
  timestamp: string;
  type: "search" | "upload" | "error";
  message: string;
  details?: any;
}> = [];

// Fonction pour ajouter un log
export function addLog(
  type: "search" | "upload" | "error",
  message: string,
  details?: any
) {
  const log = {
    timestamp: new Date().toISOString(),
    type,
    message,
    details,
  };

  inMemoryLogs.push(log);

  // Limiter le nombre de logs en mémoire
  if (inMemoryLogs.length > 1000) {
    inMemoryLogs.shift(); // Supprimer le plus ancien
  }

  return log;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = Number.parseInt(searchParams.get("limit") || "100");

    // Filtrer les logs par type si spécifié
    let filteredLogs = inMemoryLogs;
    if (type) {
      filteredLogs = inMemoryLogs.filter((log) => log.type === type);
    }

    // Retourner les logs les plus récents
    const recentLogs = filteredLogs.slice(-limit).reverse();

    return NextResponse.json({ logs: recentLogs });
  } catch (error) {
    console.error("Erreur lors de la récupération des logs:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la récupération des logs" },
      { status: 500 }
    );
  }
}

// Endpoint pour récupérer les logs du serveur (si disponibles)
export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    if (action === "server-logs") {
      // Essayer de lire les logs du serveur (si disponibles)
      try {
        const logsPath = path.join(process.cwd(), "logs");
        const files = await fs.readdir(logsPath);

        const logFiles = await Promise.all(
          files
            .filter((file) => file.endsWith(".log"))
            .map(async (file) => {
              const content = await fs.readFile(
                path.join(logsPath, file),
                "utf-8"
              );
              return { file, content };
            })
        );

        return NextResponse.json({ serverLogs: logFiles });
      } catch (fsError) {
        return NextResponse.json(
          { error: "Logs serveur non disponibles" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur lors de la récupération des logs serveur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
