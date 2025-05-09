import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Chemin du fichier pour stocker les statistiques
const STATS_FILE_PATH = path.join(process.cwd(), "data", "search-stats.json");

export async function POST() {
  try {
    // Créer le répertoire data s'il n'existe pas
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Réinitialiser les statistiques (tableau vide)
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify([]));

    return NextResponse.json({
      success: true,
      message: "Statistiques réinitialisées avec succès",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation des statistiques:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation des statistiques" },
      { status: 500 }
    );
  }
}
