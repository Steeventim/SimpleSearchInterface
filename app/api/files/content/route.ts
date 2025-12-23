import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import util from "util";

// Promisify fs functions
const readFile = util.promisify(fs.readFile);
const access = util.promisify(fs.access);
const stat = util.promisify(fs.stat);

// Répertoire de base pour les fichiers (REQUIS)
const BASE_DIRECTORY = process.env.UPLOAD_DIRECTORY;
if (!BASE_DIRECTORY) {
  console.error("❌ ERREUR: La variable d'environnement UPLOAD_DIRECTORY n'est pas définie.");
}

// Helper pour normaliser les noms de fichiers pour la comparaison
function normalizeForMatch(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFC")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[^\w\s\-\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Recherche récursive de fichier
function findFileRecursively(dir: string, filename: string): string | null {
  try {
    const files = fs.readdirSync(dir);
    const targetNormalized = normalizeForMatch(filename);

    // Check files in current dir first
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const fileStat = fs.statSync(fullPath);

      if (fileStat.isFile()) {
        if (file === filename) return fullPath; // Exact match
        if (normalizeForMatch(file) === targetNormalized) return fullPath; // Fuzzy match
      }
    }

    // Then check subdirectories
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const fileStat = fs.statSync(fullPath);

      if (fileStat.isDirectory()) {
        const found = findFileRecursively(fullPath, filename);
        if (found) return found;
      }
    }
  } catch (error) {
    // Ignore access errors
  }
  return null;
}

export async function GET(request: Request) {
  try {
    // Vérifier que UPLOAD_DIRECTORY est défini
    if (!BASE_DIRECTORY) {
      return NextResponse.json(
        { error: "Configuration serveur incorrecte: UPLOAD_DIRECTORY non défini" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    const download = searchParams.get("download") === "true";

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin de fichier non spécifié" },
        { status: 400 }
      );
    }

    // Extraire le nom de fichier du chemin
    const fileName = path.basename(filePath);

    console.log(`Tentative d'accès au fichier: ${filePath}`);
    console.log(`Nom de fichier extrait: ${fileName}`);
    console.log(`Répertoire de base: ${BASE_DIRECTORY}`);

    // Stratégie de recherche du fichier
    let resolvedPath: string | null = null;

    // 1. Essayer le chemin directement (cas absolu Windows)
    if (fs.existsSync(filePath)) {
      resolvedPath = filePath;
      console.log("✅ Fichier trouvé au chemin direct:", resolvedPath);
    }

    // 2. Essayer avec le chemin relatif dans le répertoire de base
    if (!resolvedPath) {
      const relativePath = filePath.startsWith("/") ? filePath.substring(1) : filePath;
      const combinedPath = path.join(BASE_DIRECTORY, relativePath);
      if (fs.existsSync(combinedPath)) {
        resolvedPath = combinedPath;
        console.log("✅ Fichier trouvé au chemin combiné:", resolvedPath);
      }
    }

    // 3. Essayer à la racine du répertoire de base
    if (!resolvedPath) {
      const rootPath = path.join(BASE_DIRECTORY, fileName);
      if (fs.existsSync(rootPath)) {
        resolvedPath = rootPath;
        console.log("✅ Fichier trouvé à la racine:", resolvedPath);
      }
    }

    // 4. Recherche récursive avec correspondance normalisée
    if (!resolvedPath) {
      console.log("🔄 Recherche récursive du fichier:", fileName);
      resolvedPath = findFileRecursively(BASE_DIRECTORY, fileName);
      if (resolvedPath) {
        console.log("✅ Fichier trouvé par recherche récursive:", resolvedPath);
      }
    }

    // Si toujours pas trouvé
    if (!resolvedPath) {
      console.error(`❌ Fichier non trouvé après toutes les tentatives: ${fileName}`);
      return NextResponse.json(
        {
          error: `Le fichier n'existe pas: ${fileName}`,
          details: { originalPath: filePath, searchedIn: BASE_DIRECTORY }
        },
        { status: 404 }
      );
    }

    // Vérifier si c'est un fichier (et non un répertoire)
    const fileStats = await stat(resolvedPath);
    if (!fileStats.isFile()) {
      console.error(`Le chemin n'est pas un fichier: ${resolvedPath}`);
      return NextResponse.json(
        {
          error: `Le chemin n'est pas un fichier: ${resolvedPath}`,
        },
        { status: 400 }
      );
    }

    // Vérifier si le fichier est accessible en lecture
    try {
      await access(resolvedPath, fs.constants.R_OK);
    } catch (error) {
      console.error(
        `Le fichier n'est pas accessible en lecture: ${resolvedPath}`,
        error
      );
      return NextResponse.json(
        {
          error: `Le fichier n'est pas accessible en lecture: ${resolvedPath}`,
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 403 }
      );
    }

    // Lire le fichier
    try {
      const fileBuffer = await readFile(resolvedPath);

      // Déterminer le type MIME
      const mimeType = getFileType(resolvedPath);

      console.log("✅ Servir le fichier:", resolvedPath, "Type:", mimeType);

      // Créer une réponse avec le contenu du fichier
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": download
            ? `attachment; filename*=UTF-8''${encodeURIComponent(path.basename(resolvedPath))}`
            : `inline; filename*=UTF-8''${encodeURIComponent(path.basename(resolvedPath))}`,
        },
      });
    } catch (readError) {
      console.error(
        `Erreur lors de la lecture du fichier: ${resolvedPath}`,
        readError
      );
      return NextResponse.json(
        {
          error: `Erreur lors de la lecture du fichier: ${resolvedPath}`,
          details:
            readError instanceof Error ? readError.message : String(readError),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("File content API error:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la lecture du fichier",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also handle HEAD requests for file existence checks
export async function HEAD(request: Request) {
  try {
    // Vérifier que UPLOAD_DIRECTORY est défini
    if (!BASE_DIRECTORY) {
      return new NextResponse(null, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return new NextResponse(null, { status: 400 });
    }

    const fileName = path.basename(filePath);
    let resolvedPath: string | null = null;

    // Try different search strategies
    if (fs.existsSync(filePath)) {
      resolvedPath = filePath;
    } else {
      const rootPath = path.join(BASE_DIRECTORY, fileName);
      if (fs.existsSync(rootPath)) {
        resolvedPath = rootPath;
      } else {
        resolvedPath = findFileRecursively(BASE_DIRECTORY, fileName);
      }
    }

    if (resolvedPath) {
      const mimeType = getFileType(resolvedPath);
      return new NextResponse(null, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
        },
      });
    }

    return new NextResponse(null, { status: 404 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}

// Fonction pour déterminer le type de fichier à partir de son extension
function getFileType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
    ".html": "text/html",
    ".htm": "text/html",
    ".mp4": "video/mp4",
    ".mp3": "audio/mpeg",
    ".zip": "application/zip",
  };

  return mimeTypes[extension] || "application/octet-stream";
}

