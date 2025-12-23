import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import util from "util";

// Promisify fs functions
const stat = util.promisify(fs.stat);

// Répertoire de base pour les documents (REQUIS)
const UPLOAD_DIRECTORY = process.env.UPLOAD_DIRECTORY;
if (!UPLOAD_DIRECTORY) {
    console.error("❌ ERREUR: La variable d'environnement UPLOAD_DIRECTORY n'est pas définie.");
}

// Répertoire temporaire pour stocker les images de pages
const TEMP_DIR = path.join(process.cwd(), "tmp");

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
        if (!UPLOAD_DIRECTORY) {
            return NextResponse.json(
                { error: "Configuration serveur incorrecte: UPLOAD_DIRECTORY non défini" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(request.url);
        const filePath = searchParams.get("path");
        const searchTerm = searchParams.get("searchTerm") || "";

        if (!filePath) {
            return NextResponse.json(
                { error: "Chemin de fichier non spécifié" },
                { status: 400 }
            );
        }

        // Stratégie de recherche du fichier (similaire à /api/pdf)
        let resolvedPath: string | null = null;
        const fileName = path.basename(filePath);

        // 1. Essayer le chemin direct
        if (fs.existsSync(filePath)) {
            resolvedPath = filePath;
        }

        // 2. Essayer dans le répertoire d'upload
        if (!resolvedPath) {
            const directUploadPath = path.join(UPLOAD_DIRECTORY, fileName);
            if (fs.existsSync(directUploadPath)) {
                resolvedPath = directUploadPath;
            }
        }

        // 3. Recherche récursive
        if (!resolvedPath) {
            resolvedPath = findFileRecursively(UPLOAD_DIRECTORY, fileName);
        }

        if (!resolvedPath) {
            return NextResponse.json(
                { error: `Fichier non trouvé: ${fileName}` },
                { status: 404 }
            );
        }

        // Vérifier si c'est un fichier
        const fileStats = await stat(resolvedPath);
        if (!fileStats.isFile()) {
            return NextResponse.json(
                { error: `Le chemin n'est pas un fichier: ${resolvedPath}` },
                { status: 400 }
            );
        }

        // Vérifier l'extension du fichier
        const fileExtension = path.extname(resolvedPath).toLowerCase();

        // Créer le répertoire temporaire s'il n'existe pas
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        // Simuler le traitement du document
        // Si c'est un PowerPoint ou autre non-PDF, nous retournons 1 seule page placeholder
        const totalPages = fileExtension === ".pdf" ? 5 : 1;

        // Simuler les pages contenant le terme recherché
        const pagesWithSearchTerm = new Set<number>();
        if (searchTerm && totalPages > 1) {
            // Mock search hits
            pagesWithSearchTerm.add(1);
            pagesWithSearchTerm.add(2);
            pagesWithSearchTerm.add(4);
        }

        // Déterminer quelles pages afficher
        const pagesToRender = new Set<number>();
        pagesToRender.add(1);
        pagesToRender.add(totalPages);
        pagesWithSearchTerm.forEach((pageNum) => {
            pagesToRender.add(pageNum);
        });

        const sortedPages = Array.from(pagesToRender).sort((a, b) => a - b);

        const pageInfos = sortedPages.map((pageNum) => {
            const imageUrl = `/placeholder.svg?height=800&width=600&text=Page ${pageNum}`;

            return {
                pageNumber: pageNum,
                imageUrl,
                hasSearchTerm: pagesWithSearchTerm.has(pageNum),
            };
        });

        return NextResponse.json({
            totalPages,
            pages: pageInfos,
        });
    } catch (error) {
        console.error("Document pages API error:", error);
        return NextResponse.json(
            {
                error: `Erreur lors du traitement du document: ${error instanceof Error ? error.message : String(error)
                    }`,
            },
            { status: 500 }
        );
    }
}
