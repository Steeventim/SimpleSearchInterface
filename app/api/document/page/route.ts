import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

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

    // Vérifier l'extension du fichier
    const fileExtension = path.extname(normalizedPath).toLowerCase();

    // Créer le répertoire temporaire s'il n'existe pas
    await fs.mkdir(TEMP_DIR, { recursive: true });

    // Pour l'instant, nous utilisons une approche simplifiée sans PDF.js
    // qui peut causer des problèmes de dépendances

    // Simuler le traitement du document
    const totalPages = fileExtension === ".pdf" ? 5 : 1; // Simuler 5 pages pour les PDF, 1 pour les autres

    // Simuler les pages contenant le terme recherché
    const pagesWithSearchTerm = new Set<number>();
    if (searchTerm && totalPages > 1) {
      // Simuler que les pages 2 et 4 contiennent le terme recherché
      pagesWithSearchTerm.add(2);
      pagesWithSearchTerm.add(4);
    }

    // Déterminer quelles pages afficher selon la nouvelle logique
    const pagesToRender = new Set<number>();

    // Toujours inclure la première page
    pagesToRender.add(1);

    // Toujours inclure la dernière page
    pagesToRender.add(totalPages);

    // Ajouter les pages contenant le terme recherché
    pagesWithSearchTerm.forEach((pageNum) => {
      // Éviter les doublons si le terme est trouvé sur la première ou dernière page
      if (pageNum !== 1 && pageNum !== totalPages) {
        pagesToRender.add(pageNum);
      }
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
      { error: "Erreur lors du traitement du document" },
      { status: 500 }
    );
  }
}
