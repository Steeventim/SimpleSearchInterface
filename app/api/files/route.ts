import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import util from "util";

// Promisify fs functions
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const mkdir = util.promisify(fs.mkdir);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const directory = searchParams.get("directory") || "";

    // Construire le chemin complet du répertoire
    const baseDir = process.env.UPLOAD_DIRECTORY || "./uploads";
    const dirPath = path.join(baseDir, directory.replace(/\.\./g, "")); // Empêcher la traversée de répertoire

    console.log(`Tentative de lecture du répertoire: ${dirPath}`);

    // Vérifier si le répertoire existe
    try {
      const dirStat = await stat(dirPath);
      if (!dirStat.isDirectory()) {
        console.error(`Le chemin n'est pas un répertoire: ${dirPath}`);
        return NextResponse.json(
          {
            error: `Le chemin n'est pas un répertoire: ${dirPath}`,
            files: [],
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error(
        `Erreur lors de la vérification du répertoire: ${dirPath}`,
        error
      );
      // Si le répertoire n'existe pas, créer le répertoire
      try {
        await mkdir(dirPath, { recursive: true });
        console.log(`Répertoire créé: ${dirPath}`);
      } catch (mkdirError) {
        console.error(
          `Impossible de créer le répertoire: ${dirPath}`,
          mkdirError
        );
        return NextResponse.json(
          {
            error: `Impossible d'accéder ou de créer le répertoire: ${dirPath}`,
            files: [],
          },
          { status: 500 }
        );
      }
    }

    // Lire le contenu du répertoire
    let files;
    try {
      files = await readdir(dirPath);
      console.log(`Fichiers trouvés dans ${dirPath}: ${files.length}`);
    } catch (readError) {
      console.error(
        `Erreur lors de la lecture du répertoire: ${dirPath}`,
        readError
      );
      return NextResponse.json(
        {
          error: `Erreur lors de la lecture du répertoire: ${dirPath}`,
          files: [],
        },
        { status: 500 }
      );
    }

    // Récupérer les informations de chaque fichier
    const fileInfos = await Promise.all(
      files.map(async (fileName) => {
        try {
          const filePath = path.join(dirPath, fileName);
          const fileStat = await stat(filePath);

          return {
            name: fileName,
            path: filePath,
            size: fileStat.size,
            lastModified: fileStat.mtime.toISOString(),
            isDirectory: fileStat.isDirectory(),
            type: getFileType(fileName),
          };
        } catch (fileError) {
          console.error(
            `Erreur lors de la récupération des informations du fichier ${fileName}:`,
            fileError
          );
          return null;
        }
      })
    );

    // Filtrer les entrées nulles et les répertoires
    const filesList = fileInfos.filter(
      (file) => file !== null && !file.isDirectory
    );

    return NextResponse.json({ files: filesList });
  } catch (error) {
    console.error("Files API error:", error);
    return NextResponse.json(
      {
        error: `Erreur lors de la récupération des fichiers: ${
          error instanceof Error ? error.message : String(error)
        }`,
        files: [],
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin de fichier non spécifié" },
        { status: 400 }
      );
    }

    // Vérifier que le chemin est dans le répertoire d'upload
    const baseDir = process.env.UPLOAD_DIRECTORY || "./uploads";
    const normalizedPath = path.normalize(filePath);

    if (!normalizedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: "Chemin de fichier non autorisé" },
        { status: 403 }
      );
    }

    // Supprimer le fichier
    await unlink(normalizedPath);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete file API error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du fichier" },
      { status: 500 }
    );
  }
}

// Fonction pour déterminer le type de fichier à partir de son extension
function getFileType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();

  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
