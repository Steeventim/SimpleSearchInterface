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

// Simple text extraction for PDFs using pdf-parse
async function extractTextFromPDF(filePath: string): Promise<string> {
    try {
        const pdfParse = await import("pdf-parse");

        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse.default(dataBuffer);

        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        return "";
    }
}

// Extract text from other document types (basic implementation)
async function extractTextFromDocument(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.pdf':
            return await extractTextFromPDF(filePath);
        case '.txt':
            return fs.readFileSync(filePath, 'utf-8');
        default:
            // For other formats, return empty string for now
            // Could be extended with libraries like mammoth (docx), xlsx, etc.
            return "";
    }
}

// Find search term positions in text
function findSearchTermPositions(text: string, searchTerm: string): Array<{start: number, end: number, context: string}> {
    if (!searchTerm || !text) return [];

    const positions: Array<{start: number, end: number, context: string}> = [];
    const lowerText = text.toLowerCase();
    const lowerSearchTerm = searchTerm.toLowerCase();

    let index = lowerText.indexOf(lowerSearchTerm);
    const contextLength = 100; // Characters before and after

    while (index !== -1) {
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + searchTerm.length + contextLength);

        const context = text.substring(start, end);
        const relativeStart = index - start;

        positions.push({
            start: relativeStart,
            end: relativeStart + searchTerm.length,
            context: context
        });

        index = lowerText.indexOf(lowerSearchTerm, index + 1);
    }

    return positions;
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

        // Stratégie de recherche du fichier
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
        const supportedExtensions = [".pdf", ".txt"];

        if (!supportedExtensions.includes(fileExtension)) {
            return NextResponse.json(
                {
                    text: "",
                    positions: [],
                    hasSearchTerm: false,
                    error: `Extraction de texte non supportée pour l'extension: ${fileExtension}`
                },
                { status: 200 }
            );
        }

        // Extraire le texte du document
        const extractedText = await extractTextFromDocument(resolvedPath);

        // Trouver les positions du terme de recherche
        const positions = findSearchTermPositions(extractedText, searchTerm);
        const hasSearchTerm = positions.length > 0;

        return NextResponse.json({
            text: extractedText,
            positions: positions,
            hasSearchTerm: hasSearchTerm,
            totalMatches: positions.length
        });

    } catch (error) {
        console.error("Document text extraction API error:", error);
        return NextResponse.json(
            {
                error: `Erreur lors de l'extraction du texte: ${error instanceof Error ? error.message : String(error)}`,
                text: "",
                positions: [],
                hasSearchTerm: false
            },
            { status: 500 }
        );
    }
}