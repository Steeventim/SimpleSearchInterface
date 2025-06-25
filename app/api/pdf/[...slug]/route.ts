import { NextRequest, NextResponse } from "next/server";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Répertoire de base pour les PDFs (configurable via env)
const PDF_BASE_DIRECTORY = process.env.PDF_DIRECTORY || "/home/tims/Documents";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  try {
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
