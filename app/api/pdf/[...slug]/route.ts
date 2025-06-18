import { NextRequest, NextResponse } from "next/server";
import { existsSync, createReadStream } from "fs";
import { join } from "path";

// Répertoire de base pour les PDFs (configurable via env)
const PDF_BASE_DIRECTORY = process.env.PDF_DIRECTORY || "/home/tims/Documents";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
    // Reconstruire le chemin du fichier à partir des segments d'URL
    const filePath = params.slug.join("/");
    const decodedPath = decodeURIComponent(filePath);

    console.log("🔍 Tentative d'accès au PDF:", {
      originalPath: filePath,
      decodedPath: decodedPath,
      baseDirectory: PDF_BASE_DIRECTORY,
    });

    // Construire le chemin complet du fichier
    const fullPath = join(PDF_BASE_DIRECTORY, decodedPath);

    // Vérifier que le fichier existe et qu'il est dans le répertoire autorisé
    if (!existsSync(fullPath)) {
      console.error("❌ Fichier PDF non trouvé:", fullPath);
      return NextResponse.json(
        { error: "Fichier PDF non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le chemin est sécurisé (pas de remontée de répertoire)
    const normalizedBase = join(PDF_BASE_DIRECTORY, "/");
    const normalizedPath = join(fullPath, "/");

    if (!normalizedPath.startsWith(normalizedBase)) {
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

    // Créer un stream de lecture du fichier
    const fileStream = createReadStream(fullPath);

    // Convertir le stream en buffer pour Next.js
    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    // Convertir le Buffer Node.js en ArrayBuffer pour le navigateur
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );

    // Retourner le PDF avec les bons headers
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000", // Cache pour 1 an
        "Content-Disposition": `inline; filename="${decodedPath
          .split("/")
          .pop()}"`,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la lecture du PDF:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
