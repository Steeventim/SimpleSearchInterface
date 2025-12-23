"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Loader2,
  FileText,
  Eye,
} from "lucide-react";
import { usePdfjs } from "@/lib/pdf-utils";

interface PartitionedPage {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  pageNumber: number;
  canvas: HTMLCanvasElement;
  hasSearchTerm: boolean;
  relevanceScore: number;
  searchMatches: number;
  pageType: "first" | "content" | "last";
}

interface SmartPdfPartitionerProps {
  documentUrl: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export function SimplePdfPartitioner({
  documentUrl,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: SmartPdfPartitionerProps) {
  const { pdfjs, loading: pdfjsLoading, error: pdfjsError } = usePdfjs();

  const [partitionedPages, setPartitionedPages] = useState<PartitionedPage[]>(
    []
  );
  const [currentPartition, setCurrentPartition] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<{
    totalPages: number;
    contentPages: number[];
    bestContentPage: number;
  } | null>(null);

  // Transformer une URL file:// en URL d'API
  const transformFileUrlToApiUrl = (url: string): string => {
    if (!url.startsWith("file://")) {
      return url;
    }

    let filePath = url.replace("file://", "");
    filePath = decodeURIComponent(filePath);

    // This logic relies on the server's recursive search, so we extract just the filename
    // or use relative path if known. But server accepts filename only for robust search.
    // However, the existing logic tries to strip base paths.

    // Simplification based on previous conversation:
    // Extract filename if needed, or keep relative path logic if it works.
    // The previous fix used "Doc1" path.

    const basePaths = [
      "/home/tims/Documents/",
      "/home/tims/Documents",
      "/Users/laure/Desktop/Doc1/",
      "/Users/laure/Desktop/Doc1",
      "C:/Users/laure/Desktop/Doc1/",
      "C:/Users/laure/Desktop/Doc1",
      "C:/Users/laure/Desktop/Document/",
      "C:/Users/laure/Desktop/Document",
    ];

    let relativePath = filePath;
    for (const basePath of basePaths) {
      if (filePath.startsWith(basePath)) {
        relativePath = filePath.substring(basePath.length);
        if (relativePath.startsWith("/")) {
          relativePath = relativePath.substring(1);
        }
        break;
      }
    }

    const encodedPath = relativePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    return `/api/pdf/${encodedPath}`;
  };

  // Analyser le PDF
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const analyzePdfAndCreatePartitions = async (pdf: any) => {
    try {
      setLoading(true);
      const numPages = pdf.numPages;
      const searchTermLower = searchTerm.toLowerCase();

      // Escape special characters for regex
      const escapeRegExp = (string: string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };

      // Create a flexible regex that matches the search term with variable whitespace
      const safeSearchTerm = escapeRegExp(searchTermLower);
      // Replace spaces with \s+ to match newlines or multiple spaces
      const flexibleRegex = new RegExp(safeSearchTerm.replace(/\s+/g, '\\s+'), 'gi');

      // Tokens for highlighting (split by whitespace)
      const searchTokens = searchTermLower.split(/\s+/).filter(t => t.length > 0);

      const contentPages: number[] = [];
      let bestContentPage = 1;
      let maxRelevanceScore = 0;

      // Analyser toutes les pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        // Use flexible regex for matching
        const matches = (pageText.match(flexibleRegex) || []).length;

        if (matches > 0) {
          contentPages.push(pageNum);
          const relevanceScore =
            matches + (pageText.includes(searchTermLower) ? 10 : 0);
          if (relevanceScore > maxRelevanceScore) {
            maxRelevanceScore = relevanceScore;
            bestContentPage = pageNum;
          }
        }
      }

      // Déterminer les pages à afficher
      const pagesToRender: Array<{
        pageNum: number;
        type: "first" | "content" | "last";
      }> = [];

      if (numPages === 1) {
        pagesToRender.push({ pageNum: 1, type: "first" });
      } else {
        // Initialize with unique pages
        const uniquePages = new Set<number>();
        uniquePages.add(1); // Always first page
        if (numPages > 1) uniquePages.add(numPages); // Always last page if exists

        // Add all pages with search matches
        contentPages.forEach((p) => uniquePages.add(p));

        const sortedPages = Array.from(uniquePages).sort((a, b) => a - b);

        sortedPages.forEach((pageNum) => {
          let type: "first" | "content" | "last" = "content";
          if (pageNum === 1)
            type = contentPages.includes(1) ? "content" : "first";
          else if (pageNum === numPages)
            type = contentPages.includes(numPages) ? "content" : "last";

          pagesToRender.push({ pageNum, type });
        });
      }

      // Rendre les pages
      const renderedPartitions: PartitionedPage[] = [];

      for (const { pageNum, type } of pagesToRender) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const textContent = await page.getTextContent();

        // Highlight search terms
        if (searchTerm && context) {
          context.fillStyle = "rgba(255, 255, 0, 0.5)"; // Yellow highlight

          // Helper for matrix multiplication
          const multiplyTransform = (m1: number[], m2: number[]) => {
            return [
              m1[0] * m2[0] + m1[2] * m2[1],
              m1[1] * m2[0] + m1[3] * m2[1],
              m1[0] * m2[2] + m1[2] * m2[3],
              m1[1] * m2[2] + m1[3] * m2[3],
              m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
              m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
            ];
          };

          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          textContent.items.forEach((item: any) => {
            const str = item.str.toLowerCase();

            // Check if ANY token matches
            const hasMatch = searchTokens.some(token => str.includes(token));

            if (hasMatch) {
              // Get the transformation matrix for the text item
              const tx = multiplyTransform(viewport.transform, item.transform);

              // Approximate width and height based on the transformed vector
              const fontHeight = Math.hypot(tx[2], tx[3]);
              const width = item.width * viewport.scale;

              // Draw highlight
              // tx[4], tx[5] is the origin (baseline), so we draw up by height
              context.fillRect(tx[4], tx[5] - fontHeight, width, fontHeight);
            }
          });
        }

        const pageText = textContent.items
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        const matches = (pageText.match(flexibleRegex) || []).length;

        renderedPartitions.push({
          pageNumber: pageNum,
          canvas,
          hasSearchTerm: matches > 0,
          relevanceScore: matches,
          searchMatches: matches,
          pageType: type,
        });
      }

      setPartitionedPages(renderedPartitions);
      setCurrentPartition(0);
      setAnalysisResults({
        totalPages: numPages,
        contentPages,
        bestContentPage,
      });
    } catch (error) {
      console.error("Erreur lors de l'analyse du PDF:", error);
      setError("Erreur lors de l'analyse du document");
    } finally {
      setLoading(false);
    }
  };

  // Charger le PDF
  useEffect(() => {
    if (!isOpen || !documentUrl || !pdfjs || pdfjsLoading) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        const validUrl = transformFileUrlToApiUrl(documentUrl);
        const pdf = await pdfjs.getDocument({
          url: validUrl,
          withCredentials: true,
        }).promise;

        if (searchTerm) {
          await analyzePdfAndCreatePartitions(pdf);
        }
      } catch (error) {
        console.error("Erreur de chargement PDF:", error);
        setError("Impossible de charger le document PDF");
        setLoading(false);
      }
    };

    loadPdf();
  }, [isOpen, documentUrl, searchTerm, pdfjs, pdfjsLoading]);

  // Navigation
  const goToPreviousPartition = () => {
    setCurrentPartition((prev) => Math.max(0, prev - 1));
  };

  const goToNextPartition = () => {
    setCurrentPartition((prev) =>
      Math.min(partitionedPages.length - 1, prev + 1)
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>{documentTitle || "Document PDF"}</span>
            {analysisResults && (
              <Badge variant="outline">
                {partitionedPages.length} sections trouvées
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {(loading || pdfjsLoading) && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                {pdfjsLoading ? "Initialisation..." : "Analyse en cours..."}
              </p>
            </div>
          </div>
        )}

        {(error || pdfjsError) && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md border-red-200">
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-red-600" />
                <p className="text-sm text-red-600">{error || pdfjsError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="mt-4"
                >
                  Fermer
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading &&
          !error &&
          !pdfjsLoading &&
          !pdfjsError &&
          partitionedPages.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3">
              {/* Résumé simple */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <Search className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">
                    Recherche : <strong>"{searchTerm}"</strong>
                  </span>
                  <Badge variant="secondary">
                    {analysisResults?.contentPages.length} pages avec contenu
                  </Badge>
                </div>

                {/* Navigation simple */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPartition}
                    disabled={currentPartition === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="text-sm font-medium px-3">
                    Page {partitionedPages[currentPartition]?.pageNumber} /{" "}
                    {analysisResults?.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPartition}
                    disabled={currentPartition === partitionedPages.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Navigation par pages */}
              <div className="flex justify-center">
                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                  {partitionedPages.map((partition, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPartition(index)}
                      className={`px-3 py-1 rounded text-sm transition-all ${index === currentPartition
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-200"
                        }`}
                    >
                      Page {partition.pageNumber}
                      {partition.hasSearchTerm && (
                        <span className="ml-1">🔍</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone d'affichage du PDF - Pleine taille */}
              <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden min-h-0">
                <div className="h-full w-full flex items-center justify-center p-4">
                  {partitionedPages[currentPartition] && (
                    <div className="relative max-w-full max-h-full">
                      <canvas
                        ref={(canvas) => {
                          if (canvas && partitionedPages[currentPartition]) {
                            const ctx = canvas.getContext("2d");
                            const sourceCanvas =
                              partitionedPages[currentPartition].canvas;
                            canvas.width = sourceCanvas.width;
                            canvas.height = sourceCanvas.height;
                            ctx?.drawImage(sourceCanvas, 0, 0);
                          }
                        }}
                        className="max-w-full max-h-full object-contain shadow-lg border border-gray-300 bg-white rounded"
                      />

                      {/* Badge de correspondances */}
                      {partitionedPages[currentPartition].hasSearchTerm && (
                        <div className="absolute top-2 right-2">
                          <Badge variant="default" className="bg-green-600">
                            {partitionedPages[currentPartition].searchMatches}{" "}
                            correspondances
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}
