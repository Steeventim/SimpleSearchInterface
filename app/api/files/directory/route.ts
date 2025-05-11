import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import util from "util";

// Promisify fs functions
const mkdir = util.promisify(fs.mkdir);

export async function POST(request: Request) {
  try {
    const { path: dirPath } = await request.json();

    if (!dirPath) {
      return NextResponse.json(
        { error: "Chemin de répertoire non spécifié" },
        { status: 400 }
      );
    }

    // Construire le chemin complet du répertoire
    const baseDir = process.env.UPLOAD_DIRECTORY || "./uploads";
    const normalizedPath = path.join(
      baseDir,
      dirPath.replace(/\.\./g, "") // Empêcher la traversée de répertoire
    );

    console.log(`Tentative de création du répertoire: ${normalizedPath}`);

    // Vérifier si le répertoire existe déjà
    if (fs.existsSync(normalizedPath)) {
      return NextResponse.json(
        {
          success: false,
          message: "Le répertoire existe déjà",
        },
        { status: 400 }
      );
    }

    // Créer le répertoire
    await mkdir(normalizedPath, { recursive: true });

    return NextResponse.json({
      success: true,
      message: "Répertoire créé avec succès",
      path: normalizedPath,
    });
  } catch (error) {
    console.error("Directory creation API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de la création du répertoire: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
