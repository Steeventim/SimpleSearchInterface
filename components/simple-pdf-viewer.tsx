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
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { usePdfjs } from "@/lib/pdf-utils";

interface PartitionedPage {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  hasSearchTerm: boolean;
  searchMatches: number;
  pageType: "first" | "content" | "last";
}

interface SimplePdfViewerProps {
  documentUrl: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export function SimplePdfViewer({
  documentUrl,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: SimplePdfViewerProps) {
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
  const [zoomLevel, setZoomLevel] = useState(1);

  // Transformer une URL file:// en URL d'API
  const transformFileUrlToApiUrl = (url: string): string => {
    if (!url.startsWith("file://")) {
      return url;
    }

    let filePath = url.replace("file://", "");
    filePath = decodeURIComponent(filePath);

    const basePaths = [
      "/home/tims/Documents/",
      "/home/tims/Documents",
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

  // Analyser le PDF de manière simplifiée
  const analyzePdfAndCreatePartitions = async (pdf: any) => {
    try {
      setLoading(true);
      const numPages = pdf.numPages;
      const searchTermLower = searchTerm.toLowerCase();
      const contentPages: number[] = [];
      let bestContentPage = 1;
      let maxRelevanceScore = 0;

      // Analyser toutes les pages
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        const matches = (
          pageText.match(new RegExp(searchTermLower, "gi")) || []
        ).length;

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

      // Déterminer les pages à afficher de manière simplifiée
      const pagesToRender: Array<{
        pageNum: number;
        type: "first" | "content" | "last";
      }> = [];

      if (numPages === 1) {
        pagesToRender.push({ pageNum: 1, type: "first" });
      } else {
        // Première page
        pagesToRender.push({
          pageNum: 1,
          type: contentPages.includes(1) ? "content" : "first",
        });

        // Meilleure page de contenu (si différente de la première et dernière)
        if (bestContentPage !== 1 && bestContentPage !== numPages) {
          pagesToRender.push({ pageNum: bestContentPage, type: "content" });
        }

        // Dernière page (si différente de la première)
        if (
          numPages > 1 &&
          !pagesToRender.some((p) => p.pageNum === numPages)
        ) {
          pagesToRender.push({
            pageNum: numPages,
            type: contentPages.includes(numPages) ? "content" : "last",
          });
        }
      }

      // Rendre les pages sélectionnées avec une qualité plus élevée
      const renderedPartitions: PartitionedPage[] = [];

      for (const { pageNum, type } of pagesToRender) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2 }); // Qualité plus élevée

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        const matches = (
          pageText.match(new RegExp(searchTermLower, "gi")) || []
        ).length;

        renderedPartitions.push({
          pageNumber: pageNum,
          canvas,
          hasSearchTerm: matches > 0,
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
        const pdf = await pdfjs.getDocument(validUrl).promise;

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


  // Fonctions de zoom
  const zoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoomLevel(1);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
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
            <div className="flex-1 flex flex-col min-h-0">
              {/* Barre de contrôle compacte */}
              <div className="flex-shrink-0 mb-4">
                <Card>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      {/* Info & Stats */}
                      <div className="flex items-center space-x-4">
                        <div className="text-sm font-medium px-3 flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          {partitionedPages.length} pages pertinentes affichées
                          <span className="text-gray-400 mx-2">/</span>
                          {analysisResults?.totalPages} pages totales
                        </div>

                        <div className="flex items-center space-x-2">
                          <Search className="h-4 w-4 text-blue-600" />
                          <span className="text-sm border-l pl-2">"{searchTerm}" found {analysisResults?.contentPages.length} times</span>
                        </div>
                      </div>

                      {/* Contrôles de zoom */}
                      <div className="flex items-center space-x-1 border rounded px-2 py-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={zoomOut}
                          disabled={zoomLevel <= 0.5}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-medium min-w-[3rem] text-center">
                          {Math.round(zoomLevel * 100)}%
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={zoomIn}
                          disabled={zoomLevel >= 3}
                          className="h-6 w-6 p-0"
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetZoom}
                          className="h-6 w-6 p-0"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Zone d'affichage du PDF - Liste défilante */}
              <div className="flex-1 bg-gray-50 rounded-lg overflow-y-auto min-h-0 p-4">
                <div className="flex flex-col items-center space-y-6">
                  {partitionedPages.map((partition, index) => (
                    <div key={index} className="relative shadow-xl border border-gray-300 bg-white rounded">
                      <div className="absolute -top-3 -left-3 z-10">
                        <Badge variant="outline" className="bg-white font-bold border-blue-200 text-blue-700">
                          Page {partition.pageNumber}
                        </Badge>
                      </div>

                      <canvas
                        ref={(canvas) => {
                          if (canvas) {
                            const ctx = canvas.getContext("2d");
                            const sourceCanvas = partition.canvas;
                            // Éviter de redessiner si déjà fait (simple check)
                            if (canvas.width !== sourceCanvas.width) {
                              canvas.width = sourceCanvas.width;
                              canvas.height = sourceCanvas.height;
                              ctx?.drawImage(sourceCanvas, 0, 0);
                            }
                          }
                        }}
                        className="max-w-full object-contain bg-white rounded"
                        style={{
                          transform: `scale(${zoomLevel})`,
                          transformOrigin: "top center",
                          transition: "transform 0.2s ease-in-out",
                        }}
                      />

                      {/* Badge de correspondances flottant */}
                      {partition.hasSearchTerm && (
                        <div className="absolute top-2 right-2">
                          <Badge
                            variant="default"
                            className="bg-green-600 shadow-lg opacity-90"
                          >
                            <Search className="h-3 w-3 mr-1" />
                            {partition.searchMatches} correspondances
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}

                  {partitionedPages.length === 0 && (
                    <div className="py-20 text-center text-gray-500">
                      Aucune page à afficher
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
