import { NextResponse } from "next/server";
import { readFile, access, constants, stat } from "fs/promises";
import path from "path";
import fs from "fs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");
    const download = searchParams.get("download") === "true";

    if (!filePath) {
      return NextResponse.json(
        { error: "Chemin de fichier non spécifié" },
        { status: 400 }
      );
    }

    // Vérifier que le chemin est valide
    const normalizedPath = path.normalize(filePath);

    console.log(`Tentative d'accès au fichier: ${normalizedPath}`);

    // Vérifier si le chemin existe
    if (!fs.existsSync(normalizedPath)) {
      console.error(`Le fichier n'existe pas: ${normalizedPath}`);
      return NextResponse.json(
        {
          error: `Le fichier n'existe pas: ${normalizedPath}`,
        },
        { status: 404 }
      );
    }

    // Vérifier si c'est un fichier (et non un répertoire)
    const fileStats = await stat(normalizedPath);
    if (!fileStats.isFile()) {
      console.error(`Le chemin n'est pas un fichier: ${normalizedPath}`);
      return NextResponse.json(
        {
          error: `Le chemin n'est pas un fichier: ${normalizedPath}`,
        },
        { status: 400 }
      );
    }

    // Vérifier si le fichier est accessible en lecture
    try {
      await access(normalizedPath, constants.R_OK);
    } catch (error) {
      console.error(
        `Le fichier n'est pas accessible en lecture: ${normalizedPath}`,
        error
      );
      return NextResponse.json(
        {
          error: `Le fichier n'est pas accessible en lecture: ${normalizedPath}`,
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 403 }
      );
    }

    // Lire le fichier
    try {
      const fileBuffer = await readFile(normalizedPath);

      // Déterminer le type MIME
      const mimeType = getFileType(normalizedPath);

      // Créer une réponse avec le contenu du fichier
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": download
            ? `attachment; filename="${path.basename(normalizedPath)}"`
            : `inline; filename="${path.basename(normalizedPath)}"`,
        },
      });
    } catch (readError) {
      console.error(
        `Erreur lors de la lecture du fichier: ${normalizedPath}`,
        readError
      );
      return NextResponse.json(
        {
          error: `Erreur lors de la lecture du fichier: ${normalizedPath}`,
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
