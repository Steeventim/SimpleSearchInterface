import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as fs from "fs"; // Import fs as a namespace for fs.readdirSync, fs.statSync
import * as path from "path"; // Import path as a namespace for path.join

// Répertoire de base pour les PDFs (REQUIS)
const PDF_BASE_DIRECTORY = process.env.UPLOAD_DIRECTORY;
if (!PDF_BASE_DIRECTORY) {
  console.error("❌ ERREUR: La variable d'environnement UPLOAD_DIRECTORY n'est pas définie.");
}

// Helper pour normaliser les noms de fichiers pour la comparaison
function normalizeForMatch(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .toLowerCase()
    .replace(/_/g, " ") // Underscores -> Spaces
    .replace(/\u00a0/g, " ") // Non-breaking space -> Space
    .replace(/[^\w\s\-\.]/g, " ") // Special chars -> Spaces
    .replace(/\s+/g, " ") // Collapse multiple spaces
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

// Map des types MIME par extension
const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
};

// Extensions de fichiers supportées
const SUPPORTED_EXTENSIONS = [".pdf", ".pptx", ".ppt", ".docx", ".doc", ".xlsx", ".xls"];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    // Vérifier que UPLOAD_DIRECTORY est défini
    if (!PDF_BASE_DIRECTORY) {
      return NextResponse.json(
        { error: "Configuration serveur incorrecte: UPLOAD_DIRECTORY non défini" },
        { status: 500 }
      );
    }

    const { slug } = await params;

    // Reconstruire le chemin du fichier à partir des segments d'URL
    const filePath = slug.join("/");
    const decodedPath = decodeURIComponent(filePath);
    const fileName = decodedPath.split("/").pop() || decodedPath;

    // Déterminer l'extension et le type MIME
    const ext = path.extname(fileName).toLowerCase();
    const mimeType = MIME_TYPES[ext] || "application/octet-stream";

    // Vérifier que l'extension est supportée
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Type de fichier non supporté: ${ext}. Extensions supportées: ${SUPPORTED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    console.log("🔍 Tentative d'accès au fichier:", {
      originalPath: filePath,
      decodedPath: decodedPath,
      fileName: fileName,
      extension: ext,
      baseDirectory: PDF_BASE_DIRECTORY,
    });

    // Stratégie de recherche du fichier
    let fullPath: string | null = null;

    // 1. Essayer le chemin complet
    const directPath = join(PDF_BASE_DIRECTORY, decodedPath);
    if (existsSync(directPath)) {
      fullPath = directPath;
      console.log("✅ Fichier trouvé au chemin direct:", fullPath);
    }

    // 2. Essayer à la racine du dossier
    if (!fullPath) {
      const rootPath = join(PDF_BASE_DIRECTORY, fileName);
      if (existsSync(rootPath)) {
        fullPath = rootPath;
        console.log("✅ Fichier trouvé à la racine:", fullPath);
      }
    }

    // 3. Recherche récursive avec correspondance normalisée
    if (!fullPath) {
      console.log("🔄 Recherche récursive du fichier:", fileName);
      fullPath = findFileRecursively(PDF_BASE_DIRECTORY, fileName);
      if (fullPath) {
        console.log("✅ Fichier trouvé par recherche récursive:", fullPath);
      }
    }

    // Si toujours pas trouvé
    if (!fullPath) {
      console.error("❌ Fichier non trouvé après toutes les tentatives:", fileName);
      return NextResponse.json(
        { error: "Fichier non trouvé", details: { fileName, searchedIn: PDF_BASE_DIRECTORY } },
        { status: 404 }
      );
    }

    // Vérifier que le chemin est sécurisé (pas de remontée de répertoire)
    const normalizedFullPath = fullPath.replace(/\\/g, "/");
    const normalizedBaseCheck = PDF_BASE_DIRECTORY.replace(/\\/g, "/");

    if (!normalizedFullPath.startsWith(normalizedBaseCheck)) {
      console.error("❌ Tentative d'accès non autorisé:", fullPath);
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    console.log("✅ Servir le fichier:", fullPath, "Type:", mimeType);

    // Lire le fichier directement en tant que Buffer
    const fileBuffer = readFileSync(fullPath);

    // Convertir en Uint8Array pour éviter les problèmes Unicode/ByteString
    const uint8Array = new Uint8Array(fileBuffer);

    // Encoder correctement le nom de fichier pour les headers
    const encodedFileName = encodeURIComponent(path.basename(fullPath));

    // Retourner le fichier avec les bons headers
    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache pour 1 an
        "Content-Disposition": `inline; filename*=UTF-8''${encodedFileName}`,
      },
    });
  } catch (error: any) {
    console.error("❌ Erreur lors de la lecture du fichier:", error);

    if (error.code === "ENOENT") {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur lors de la lecture du fichier" },
      { status: 500 }
    );
  }
}
