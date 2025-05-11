import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import util from "util";

// Promisify fs functions
const stat = util.promisify(fs.stat);

// Répertoire temporaire pour stocker les images de pages
const TEMP_DIR = path.join(process.cwd(), "tmp");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    const searchTerm = searchParams.get("searchTerm") || "";

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin de fichier non spécifié" },
        { status: 400 }
      );
    }

    // Vérifier que le chemin est valide
    const normalizedPath = path.normalize(filePath);

    // Vérifier si le fichier existe
    if (!fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: `Le fichier n'existe pas: ${normalizedPath}` },
        { status: 404 }
      );
    }

    // Vérifier si c'est un fichier (et non un répertoire)
    try {
      const fileStats = await stat(normalizedPath);
      if (!fileStats.isFile()) {
        return NextResponse.json(
          { error: `Le chemin n'est pas un fichier: ${normalizedPath}` },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: `Erreur lors de la vérification du fichier: ${normalizedPath}`,
        },
        { status: 500 }
      );
    }

    // Vérifier l'extension du fichier
    const fileExtension = path.extname(normalizedPath).toLowerCase();

    // Créer le répertoire temporaire s'il n'existe pas
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Simuler le traitement du document
    const totalPages = fileExtension === ".pdf" ? 5 : 1; // Simuler 5 pages pour les PDF, 1 pour les autres

    // Simuler les pages contenant le terme recherché
    const pagesWithSearchTerm = new Set<number>();
    if (searchTerm && totalPages > 1) {
      // Simuler que les pages 1, 2 et 4 contiennent le terme recherché
      // Incluons délibérément la page 1 pour tester le cas où le terme est sur la première page
      pagesWithSearchTerm.add(1);
      pagesWithSearchTerm.add(2);
      pagesWithSearchTerm.add(4);
    }

    // Déterminer quelles pages afficher
    const pagesToRender = new Set<number>();

    // Toujours inclure la première page
    pagesToRender.add(1);

    // Toujours inclure la dernière page
    pagesToRender.add(totalPages);

    // Ajouter TOUTES les pages contenant le terme recherché, même si elles incluent la première ou dernière page
    pagesWithSearchTerm.forEach((pageNum) => {
      pagesToRender.add(pageNum);
    });

    // Convertir en tableau et trier
    const sortedPages = Array.from(pagesToRender).sort((a, b) => a - b);

    // Générer des informations de page simulées
    const pageInfos = sortedPages.map((pageNum) => {
      // Utiliser une image de placeholder au lieu de générer des images réelles
      const imageUrl = `/placeholder.svg?height=800&width=600&text=Page ${pageNum}`;

      return {
        pageNumber: pageNum,
        imageUrl,
        hasSearchTerm: pagesWithSearchTerm.has(pageNum),
      };
    });

    return NextResponse.json({
      totalPages,
      pages: pageInfos,
    });
  } catch (error) {
    console.error("Document pages API error:", error);
    return NextResponse.json(
      {
        error: `Erreur lors du traitement du document: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
