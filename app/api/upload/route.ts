import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { indexFile } from "@/lib/file-indexer";

// Configuration pour le répertoire d'upload
interface UploadConfig {
  baseDir: string;
  allowedTypes: string[];
  maxSizeInBytes: number;
}

// Charger la configuration depuis les variables d'environnement
const uploadConfig: UploadConfig = {
  baseDir: process.env.UPLOAD_DIRECTORY || "./uploads",
  allowedTypes: (
    process.env.ALLOWED_FILE_TYPES || "image/*,application/pdf,text/*"
  ).split(","),
  maxSizeInBytes: Number.parseInt(process.env.MAX_FILE_SIZE || "10485760"), // 10MB par défaut
};

export async function POST(request: Request) {
  try {
    // Vérifier si la requête est multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "La requête doit être de type multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Récupérer le répertoire de destination personnalisé s'il existe
    const customDir = (formData.get("directory") as string) || "";

    // Construire le chemin complet du répertoire
    const uploadDir = path.join(
      uploadConfig.baseDir,
      customDir.replace(/\.\./g, "") // Empêcher la traversée de répertoire
    );

    // Créer le répertoire s'il n'existe pas
    await mkdir(uploadDir, { recursive: true });

    // Récupérer les fichiers
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier n'a été fourni" },
        { status: 400 }
      );
    }

    // Traiter chaque fichier
    const results = await Promise.all(
      files.map(async (file) => {
        // Vérifier le type de fichier
        const isAllowedType = uploadConfig.allowedTypes.some((type) => {
          if (type.endsWith("/*")) {
            const prefix = type.slice(0, -1);
            return file.type.startsWith(prefix);
          }
          return file.type === type;
        });

        if (!isAllowedType) {
          return {
            name: file.name,
            error: `Type de fichier non autorisé: ${file.type}`,
          };
        }

        // Vérifier la taille du fichier
        if (file.size > uploadConfig.maxSizeInBytes) {
          return {
            name: file.name,
            error: `Taille de fichier dépassée: ${file.size} > ${uploadConfig.maxSizeInBytes}`,
          };
        }

        // Générer un nom de fichier unique
        const uniqueId = uuidv4();
        const fileName = `${uniqueId}-${file.name.replace(
          /[^a-zA-Z0-9.-]/g,
          "_"
        )}`;
        const filePath = path.join(uploadDir, fileName);

        // Lire le contenu du fichier
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Écrire le fichier
        await writeFile(filePath, fileBuffer);

        // Indexer le fichier dans Elasticsearch
        try {
          await indexFile({
            path: filePath,
            name: file.name,
            size: file.size,
            type: file.type,
            directory: customDir,
          });
        } catch (indexError) {
          console.error(
            `Erreur lors de l'indexation du fichier ${file.name}:`,
            indexError
          );
          // On continue même si l'indexation échoue
        }

        return {
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
          success: true,
        };
      })
    );

    return NextResponse.json({ files: results });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'upload des fichiers" },
      { status: 500 }
    );
  }
}
