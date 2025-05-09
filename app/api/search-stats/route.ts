import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Chemin du fichier pour stocker les statistiques
const STATS_FILE_PATH = path.join(process.cwd(), "data", "search-stats.json");

// Structure des statistiques
interface SearchStat {
  term: string;
  count: number;
  lastSearched: string;
}

// Fonction pour lire les statistiques existantes
async function readStats(): Promise<SearchStat[]> {
  try {
    // Créer le répertoire data s'il n'existe pas
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Vérifier si le fichier existe
    if (!fs.existsSync(STATS_FILE_PATH)) {
      // Créer un fichier vide avec un tableau vide
      fs.writeFileSync(STATS_FILE_PATH, JSON.stringify([]));
      return [];
    }

    // Lire le fichier
    const data = fs.readFileSync(STATS_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Erreur lors de la lecture des statistiques:", error);
    return [];
  }
}

// Fonction pour écrire les statistiques
async function writeStats(stats: SearchStat[]): Promise<void> {
  try {
    // Créer le répertoire data s'il n'existe pas
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Écrire les statistiques dans le fichier
    fs.writeFileSync(STATS_FILE_PATH, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error("Erreur lors de l'écriture des statistiques:", error);
  }
}

// Route GET pour récupérer les statistiques
export async function GET() {
  try {
    const stats = await readStats();

    // Trier par nombre de recherches (décroissant)
    stats.sort((a, b) => b.count - a.count);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}

// Route POST pour enregistrer une recherche
export async function POST(request: Request) {
  try {
    const { searchTerm } = await request.json();

    if (!searchTerm || typeof searchTerm !== "string") {
      return NextResponse.json(
        { error: "Terme de recherche invalide" },
        { status: 400 }
      );
    }

    // Normaliser le terme de recherche (minuscules, suppression des espaces en trop)
    const normalizedTerm = searchTerm.trim().toLowerCase();

    if (normalizedTerm.length === 0) {
      return NextResponse.json(
        { error: "Terme de recherche vide" },
        { status: 400 }
      );
    }

    // Lire les statistiques existantes
    const stats = await readStats();

    // Rechercher si le terme existe déjà
    const existingStatIndex = stats.findIndex(
      (stat) => stat.term.toLowerCase() === normalizedTerm
    );

    if (existingStatIndex !== -1) {
      // Mettre à jour les statistiques existantes
      stats[existingStatIndex].count += 1;
      stats[existingStatIndex].lastSearched = new Date().toISOString();
    } else {
      // Ajouter une nouvelle entrée
      stats.push({
        term: normalizedTerm,
        count: 1,
        lastSearched: new Date().toISOString(),
      });
    }

    // Écrire les statistiques mises à jour
    await writeStats(stats);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de la recherche:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de la recherche" },
      { status: 500 }
    );
  }
}
