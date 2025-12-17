import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as fs from "fs"; // Import fs as a namespace for fs.readdirSync, fs.statSync
import * as path from "path"; // Import path as a namespace for path.join

// Répertoire de base pour les PDFs (configurable via env)
const PDF_BASE_DIRECTORY = process.env.UPLOAD_DIRECTORY || process.env.PDF_DIRECTORY || "C:\\Users\\laure\\Desktop\\Document";

// Helper pour normaliser les noms de fichiers pour la comparaison
function normalizeForMatch(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\w\s\-\.]/g, "") // Garder seulement alphanum, espaces, tirets, points
    .replace(/\s+/g, " ")
    .trim();
}

function findFileRecursively(dir: string, filename: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    const targetNormalized = normalizeForMatch(filename);

    // Check files in current dir first
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isFile()) {
        if (file === filename) return fullPath; // Exact match
        if (normalizeForMatch(file) === targetNormalized) return fullPath; // Fuzzy match
      }
    }

    // Then check subdirectories
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = findFileRecursively(fullPath, filename);
        if (found) return found;
      }
    }
  } catch (error) {
    // Ignore access errors
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    // Next.js 15 - Await params avant utilisation
    const resolvedParams = await params;

    // Reconstruire le chemin du fichier à partir des segments d'URL
    const filePath = resolvedParams.slug.join("/");
    const decodedPath = decodeURIComponent(filePath);

    console.log("🔍 Tentative d'accès au PDF:", {
      originalPath: filePath,
      decodedPath: decodedPath,
      baseDirectory: PDF_BASE_DIRECTORY,
    });

    // Construire le chemin complet du fichier
    let fullPath = join(PDF_BASE_DIRECTORY, decodedPath);

    // Vérifier que le fichier existe et qu'il est dans le répertoire autorisé
    if (!existsSync(fullPath)) {
      // Tenter de trouver le fichier directement à la racine du dossier (fallback pour migration chemins Linux -> Windows)
      const fileName = decodedPath.split("/").pop() || decodedPath;
      const fallbackPath = join(PDF_BASE_DIRECTORY, fileName);

      if (existsSync(fallbackPath)) {
        console.log(`⚠️ Chemin original non trouvé, utilisation du fallback: ${fallbackPath}`);
        fullPath = fallbackPath;
      } else {
        console.error("❌ Fichier PDF non trouvé:", fullPath);
        return NextResponse.json(
          { error: "Fichier PDF non trouvé" },
          { status: 404 }
        );
      }
    }

    // Vérifier que le chemin est sécurisé (pas de remontée de répertoire)
    const normalizedBase = join(PDF_BASE_DIRECTORY, "/");
    // S'assurer que fullPath se termine par un séparateur pour la comparaison si c'est un dossier (pas le cas ici) 
    // ou simplement utiliser startsWith sur le path resolve
    // On normalise simplement les séparateurs pour la comparaison

    // Note: Pour Windows, on normalise les séparateurs
    const normalizedFullPath = fullPath.replace(/\\/g, "/");
    const normalizedBaseCheck = PDF_BASE_DIRECTORY.replace(/\\/g, "/");

    if (!normalizedFullPath.startsWith(normalizedBaseCheck)) {
      console.error("❌ Tentative d'accès non autorisé:", fullPath);
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Vérifier que c'est bien un PDF
    if (!decodedPath.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Seuls les fichiers PDF sont autorisés" },
        { status: 400 }
      );
    }

    console.log("✅ Servir le PDF:", fullPath);

    // Lire le fichier directement en tant que Buffer
    const fileBuffer = readFileSync(fullPath);

    // Convertir en Uint8Array pour éviter les problèmes Unicode/ByteString
    const uint8Array = new Uint8Array(fileBuffer);

    // Encoder correctement le nom de fichier pour les headers
    const fileName = decodedPath.split("/").pop() || "document.pdf";
    const encodedFileName = encodeURIComponent(fileName);

    // Retourner le PDF avec les bons headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache pour 1 an
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la lecture du PDF:", error);

    if (error.code === "ENOENT") {
      return NextResponse.json(
        { error: "Fichier PDF non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur lors de la lecture du PDF" },
      { status: 500 }
    );
  }
}
