import { NextResponse } from "next/server";
import { readdir, stat, unlink, readFile } from "fs/promises";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "Le chemin du fichier contient des caractères non valides." },
        { status: 400 }
      );
    }

    console.log("Original file path:", filePath);
    filePath = normalizeFilePath(filePath);
    console.log("Normalized file path:", filePath);

    const fileBuffer = await readFile(filePath);
    const mimeType = getFileType(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      console.error("File path not specified");
      return NextResponse.json(
        { error: "Chemin de fichier non spécifié" },
        { status: 400 }
      );
    }

    const baseDir = process.env.UPLOAD_DIRECTORY || "./uploads";
    const normalizedPath = path.normalize(filePath);

    console.log("Requested file path:", filePath);
    console.log("Normalized file path:", normalizedPath);

    if (!normalizedPath.startsWith(baseDir)) {
      console.error("Unauthorized file path:", normalizedPath);
      return NextResponse.json(
        { error: "Chemin de fichier non autorisé" },
        { status: 403 }
      );
    }

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

function normalizeFilePath(filePath: string): string {
  return filePath
    .normalize("NFKD") // Normalise les caractères Unicode
    .replace(/[’‘]/g, "'") // Remplace les apostrophes typographiques par des apostrophes simples
    .replace(/[\u2018\u2019\u201C\u201D]/g, "'") // Remplace d'autres guillemets Unicode
    .replace(/[^a-zA-Z0-9_\-./]/g, ""); // Supprime les caractères non valides
}
