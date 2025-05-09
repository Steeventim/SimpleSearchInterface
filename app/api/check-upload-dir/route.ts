import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { access, constants, readdir } from "fs/promises";

export async function GET() {
  try {
    // Récupérer le répertoire d'upload depuis les variables d'environnement
    const uploadDir = process.env.UPLOAD_DIRECTORY || "./uploads";

    // Vérifier si le répertoire existe
    const exists = fs.existsSync(uploadDir);

    let files = [];
    let isAccessible = false;
    let error = null;

    if (exists) {
      try {
        // Vérifier si le répertoire est accessible
        await access(uploadDir, constants.R_OK | constants.W_OK);
        isAccessible = true;

        // Lister les fichiers dans le répertoire
        files = await readdir(uploadDir);
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    }

    // Récupérer le chemin absolu
    const absolutePath = path.resolve(uploadDir);

    return NextResponse.json({
      uploadDirectory: uploadDir,
      absolutePath,
      exists,
      isAccessible,
      files: files.slice(0, 10), // Limiter à 10 fichiers pour éviter une réponse trop grande
      error,
      cwd: process.cwd(),
    });
  } catch (error) {
    console.error("Error checking upload directory:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la vérification du répertoire d'upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
