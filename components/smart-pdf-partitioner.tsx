"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Loader2,
  FileText,
  Eye,
  BookOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { usePdfjs } from "@/lib/pdf-utils";

interface PartitionedPage {
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

export function SmartPdfPartitioner({
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
    hasFirstPageContent: boolean;
    hasLastPageContent: boolean;
  } | null>(null);
  const [totalPartitions, setTotalPartitions] = useState(0);
  const [pdfDocument, setPdfDocument] = useState<any>(null);

  // États pour le zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });

  // Transformer une URL file:// en URL d'API
  const transformFileUrlToApiUrl = (url: string): string => {
    if (!url.startsWith("file://")) {
      return url; // Déjà une URL HTTP valide
    }

    // Extraire le chemin du fichier à partir de l'URL file://
    let filePath = url.replace("file://", "");

    // Décoder l'URL si elle est encodée
    filePath = decodeURIComponent(filePath);

    // Convertir le chemin absolu en chemin relatif par rapport aux répertoires de base connus
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

    // Encoder le chemin pour l'URL
    const encodedPath = relativePath
      .split("/")
      .map(encodeURIComponent)
      .join("/");
    const apiUrl = `/api/pdf/${encodedPath}`;

    console.log("🔄 URL transformée:", {
      original: url,
      filePath: filePath,
      relativePath: relativePath,
      transformed: apiUrl,
    });

    return apiUrl;
  };

  // Analyser le PDF et créer les partitions intelligentes
  const analyzePdfAndCreatePartitions = async (pdf: any) => {
    try {
      setLoading(true);
      const numPages = pdf.numPages;
      const searchTermLower = searchTerm.toLowerCase();
      const contentPages: number[] = [];
      let bestContentPage = 1;
      let maxRelevanceScore = 0;

      console.log(`🔍 Analyse du PDF: ${numPages} pages pour "${searchTerm}"`);

      // 1. Analyser toutes les pages pour trouver le contenu
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

          // Calculer un score de pertinence
          const relevanceScore =
            matches + (pageText.includes(searchTermLower) ? 10 : 0);

          if (relevanceScore > maxRelevanceScore) {
            maxRelevanceScore = relevanceScore;
            bestContentPage = pageNum;
          }
        }
      }

      console.log(`📊 Pages avec contenu: ${contentPages.join(", ")}`);
      console.log(`🎯 Meilleure page de contenu: ${bestContentPage}`);

      // 2. Déterminer les pages à inclure dans les partitions
      const pagesToRender: Array<{
        pageNum: number;
        type: "first" | "content" | "last";
      }> = [];

      const hasFirstPageContent = contentPages.includes(1);
      const hasLastPageContent = contentPages.includes(numPages);

      // Logique de partitionnement intelligent
      if (numPages === 1) {
        // Un seul page: afficher seulement cette page
        pagesToRender.push({ pageNum: 1, type: "first" });
      } else if (numPages === 2) {
        // Deux pages: afficher les deux
        pagesToRender.push({ pageNum: 1, type: "first" });
        if (bestContentPage === 2 || contentPages.includes(2)) {
          pagesToRender.push({ pageNum: 2, type: "content" });
        } else {
          pagesToRender.push({ pageNum: 2, type: "last" });
        }
      } else {
        // Plus de 2 pages: logique complète

        // Toujours inclure la première page
        pagesToRender.push({
          pageNum: 1,
          type: hasFirstPageContent ? "content" : "first",
        });

        // Inclure la meilleure page de contenu (si différente de la première et dernière)
        if (bestContentPage !== 1 && bestContentPage !== numPages) {
          pagesToRender.push({ pageNum: bestContentPage, type: "content" });
        }

        // Inclure la dernière page (si différente de la première et du contenu)
        if (
          numPages > 1 &&
          !pagesToRender.some((p) => p.pageNum === numPages)
        ) {
          pagesToRender.push({
            pageNum: numPages,
            type: hasLastPageContent ? "content" : "last",
          });
        }
      }

      console.log(`📑 Pages sélectionnées:`, pagesToRender);

      // 3. Rendre les pages sélectionnées
      const renderedPartitions: PartitionedPage[] = [];

      for (let i = 0; i < pagesToRender.length; i++) {
        const { pageNum, type } = pagesToRender[i];
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        // Analyser le contenu de cette page
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ")
          .toLowerCase();

        const matches = (
          pageText.match(new RegExp(searchTermLower, "gi")) || []
        ).length;
        const hasSearchTerm = matches > 0;
        const relevanceScore =
          matches + (pageText.includes(searchTermLower) ? 10 : 0);

        renderedPartitions.push({
          pageNumber: pageNum,
          canvas,
          hasSearchTerm,
          relevanceScore,
          searchMatches: matches,
          pageType: type,
        });
      }

      setPartitionedPages(renderedPartitions);
      setTotalPartitions(renderedPartitions.length);
      setCurrentPartition(0);

      // Stocker les résultats d'analyse
      setAnalysisResults({
        totalPages: numPages,
        contentPages,
        bestContentPage,
        hasFirstPageContent,
        hasLastPageContent,
      });

      console.log(`✅ ${renderedPartitions.length} partitions créées`);
    } catch (error) {
      console.error("Erreur lors de l'analyse du PDF:", error);
      setError("Erreur lors de l'analyse du document");
    } finally {
      setLoading(false);
    }
  };

  // Charger le PDF quand pdfjs est disponible
  useEffect(() => {
    if (!isOpen || !documentUrl || !pdfjs || pdfjsLoading) return;

    const loadPdf = async () => {
      try {
        setLoading(true);
        setError(null);

        // Transformer l'URL file:// en URL d'API si nécessaire
        const validUrl = transformFileUrlToApiUrl(documentUrl);
        console.log("📄 Chargement du PDF:", validUrl);

        const pdf = await pdfjs.getDocument(validUrl).promise;
        setPdfDocument(pdf);

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

  // Gérer les erreurs de PDF.js
  useEffect(() => {
    if (pdfjsError) {
      setError(`Erreur PDF.js: ${pdfjsError}`);
      setLoading(false);
    }
  }, [pdfjsError]);

  // Navigation entre les partitions
  const goToPreviousPartition = () => {
    setCurrentPartition((prev) => Math.max(0, prev - 1));
  };

  const goToNextPartition = () => {
    setCurrentPartition((prev) => Math.min(totalPartitions - 1, prev + 1));
  };

  // Obtenir l'icône du type de page
  const getPageTypeIcon = (type: "first" | "content" | "last") => {
    switch (type) {
      case "first":
        return <BookOpen className="h-4 w-4" />;
      case "content":
        return <Search className="h-4 w-4" />;
      case "last":
        return <FileText className="h-4 w-4" />;
    }
  };

  // Obtenir la description du type de page
  const getPageTypeLabel = (type: "first" | "content" | "last") => {
    switch (type) {
      case "first":
        return "Première page";
      case "content":
        return "Contenu trouvé";
      case "last":
        return "Dernière page";
    }
  };

  // Télécharger le document
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = documentUrl;
    link.download = documentTitle || "document.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonctions de zoom
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const resetZoom = () => {
    setZoomLevel(1);
    setScrollPosition({ x: 0, y: 0 });
  };

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            goToPreviousPartition();
          }
          break;
        case "ArrowRight":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            goToNextPartition();
          }
          break;
        case "+":
        case "=":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case "-":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case "0":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            resetZoom();
          }
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentPartition, totalPartitions]);

  // Composant d'indicateur de progression
  const ProgressIndicator = ({
    progress,
    message,
  }: {
    progress: number;
    message: string;
  }) => (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center space-x-3 mb-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{message}</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(progress)}% terminé
          </p>
        </div>
      </div>
    </div>
  );

  // Composant d'aide avec raccourcis
  const KeyboardShortcuts = () => (
    <div className="absolute top-4 right-4 z-10">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-3">
          <h4 className="text-xs font-semibold mb-2 text-gray-700">
            Raccourcis
          </h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between items-center space-x-3">
              <span>Navigation</span>
              <div className="flex space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  Ctrl
                </kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  ←→
                </kbd>
              </div>
            </div>
            <div className="flex justify-between items-center space-x-3">
              <span>Zoom +/-</span>
              <div className="flex space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  Ctrl
                </kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  +/-
                </kbd>
              </div>
            </div>
            <div className="flex justify-between items-center space-x-3">
              <span>Reset zoom</span>
              <div className="flex space-x-1">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  Ctrl
                </kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">0</kbd>
              </div>
            </div>
            <div className="flex justify-between items-center space-x-3">
              <span>Fermer</span>
              <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Esc</kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <span>{documentTitle || "Document PDF"}</span>
            {analysisResults && (
              <Badge variant="outline">
                {analysisResults.totalPages} pages • {partitionedPages.length}{" "}
                sections
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {(loading || pdfjsLoading) && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-lg">
              <CardContent className="p-8">
                <ProgressIndicator
                  progress={pdfjsLoading ? 20 : loading ? 60 : 100}
                  message={
                    pdfjsLoading
                      ? "Initialisation du moteur PDF..."
                      : "Analyse intelligente du document en cours..."
                  }
                />
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Cette opération peut prendre quelques instants selon la
                    taille du document
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {(error || pdfjsError) && (
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md border-red-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erreur de traitement
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  {error || pdfjsError}
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-red-700">
                    Suggestions pour résoudre le problème :
                  </p>
                  <ul className="text-xs text-red-600 mt-2 space-y-1 text-left">
                    <li>• Vérifiez que le fichier PDF n'est pas corrompu</li>
                    <li>• Assurez-vous que le fichier est accessible</li>
                    <li>• Essayez de rafraîchir la page</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="border-red-300 text-red-600 hover:bg-red-50"
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
            <div className="flex flex-col h-full relative">
              {/* Composant d'aide avec raccourcis */}
              <KeyboardShortcuts />

              {/* En-tête avec résumé de l'analyse */}
              <div className="mb-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Search className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            Partitionnement Intelligent
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Analyse pour le terme :{" "}
                            <span className="font-medium">"{searchTerm}"</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownload}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                    </div>
                  </CardHeader>

                  {analysisResults && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {analysisResults.totalPages}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pages totales
                          </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {analysisResults.contentPages.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Pages avec contenu
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">
                            {partitionedPages.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Sections créées
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Meilleure correspondance trouvée à la{" "}
                          <strong>
                            page {analysisResults.bestContentPage}
                          </strong>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {partitionedPages.map((partition, index) => (
                            <Badge
                              key={index}
                              variant={
                                partition.hasSearchTerm
                                  ? "default"
                                  : "secondary"
                              }
                              className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                              onClick={() => setCurrentPartition(index)}
                            >
                              {getPageTypeIcon(partition.pageType)}
                              <span>
                                P.{partition.pageNumber} -{" "}
                                {getPageTypeLabel(partition.pageType)}
                                {partition.searchMatches > 0 &&
                                  ` (${partition.searchMatches})`}
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </div>

              {/* Visualiseur principal */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Barre de navigation */}
                <Card className="mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToPreviousPartition}
                          disabled={currentPartition === 0}
                          className="flex items-center space-x-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>Précédent</span>
                        </Button>

                        <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg">
                          {getPageTypeIcon(
                            partitionedPages[currentPartition]?.pageType
                          )}
                          <div className="text-center">
                            <div className="text-sm font-semibold">
                              Section {currentPartition + 1} / {totalPartitions}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Page{" "}
                              {partitionedPages[currentPartition]?.pageNumber} •{" "}
                              {getPageTypeLabel(
                                partitionedPages[currentPartition]?.pageType
                              )}
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToNextPartition}
                          disabled={currentPartition === totalPartitions - 1}
                          className="flex items-center space-x-2"
                        >
                          <span>Suivant</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        {partitionedPages[currentPartition]?.hasSearchTerm && (
                          <Badge
                            variant="default"
                            className="flex items-center space-x-1"
                          >
                            <Search className="h-3 w-3" />
                            <span>
                              {partitionedPages[currentPartition].searchMatches}{" "}
                              correspondances
                            </span>
                          </Badge>
                        )}

                        {/* Contrôles de zoom */}
                        <div className="flex items-center space-x-1 border rounded-lg px-2 py-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={zoomOut}
                            disabled={zoomLevel <= 0.5}
                            className="h-7 w-7 p-0"
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
                            className="h-7 w-7 p-0"
                          >
                            <ZoomIn className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetZoom}
                            className="h-7 w-7 p-0"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Navigation par onglets */}
                    <div className="mt-4 flex justify-center">
                      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                        {partitionedPages.map((partition, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPartition(index)}
                            className={`px-3 py-2 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
                              index === currentPartition
                                ? "bg-white shadow-sm text-blue-600"
                                : "text-gray-600 hover:text-gray-900"
                            }`}
                          >
                            {getPageTypeIcon(partition.pageType)}
                            <span>P.{partition.pageNumber}</span>
                            {partition.hasSearchTerm && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Zone d'affichage du PDF */}
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardContent className="p-6 flex-1 flex flex-col min-h-0">
                    <div
                      className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 min-h-0 relative"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                      }}
                    >
                      <div className="flex justify-center items-center h-full">
                        {partitionedPages[currentPartition] && (
                          <div className="relative">
                            <canvas
                              ref={(canvas) => {
                                if (
                                  canvas &&
                                  partitionedPages[currentPartition]
                                ) {
                                  const ctx = canvas.getContext("2d");
                                  const sourceCanvas =
                                    partitionedPages[currentPartition].canvas;
                                  canvas.width = sourceCanvas.width;
                                  canvas.height = sourceCanvas.height;
                                  ctx?.drawImage(sourceCanvas, 0, 0);
                                }
                              }}
                              className="border border-gray-300 shadow-xl rounded-lg bg-white"
                              style={{
                                transform: `scale(${zoomLevel})`,
                                transformOrigin: "center center",
                                transition: "transform 0.2s ease-in-out",
                              }}
                            />

                            {/* Indicateur de correspondances */}
                            {partitionedPages[currentPartition]
                              .hasSearchTerm && (
                              <div
                                className="absolute top-2 right-2"
                                style={{
                                  transform: `scale(${Math.max(
                                    0.8 / zoomLevel,
                                    0.6
                                  )})`,
                                  transformOrigin: "top right",
                                }}
                              >
                                <Badge
                                  variant="default"
                                  className="shadow-lg bg-green-600 hover:bg-green-700"
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  {
                                    partitionedPages[currentPartition]
                                      .searchMatches
                                  }{" "}
                                  match
                                  {partitionedPages[currentPartition]
                                    .searchMatches > 1
                                    ? "es"
                                    : ""}
                                </Badge>
                              </div>
                            )}

                            {/* Indicateur du type de page */}
                            <div
                              className="absolute top-2 left-2"
                              style={{
                                transform: `scale(${Math.max(
                                  0.8 / zoomLevel,
                                  0.6
                                )})`,
                                transformOrigin: "top left",
                              }}
                            >
                              <Badge
                                variant="secondary"
                                className="shadow-lg bg-white/95 backdrop-blur-sm border"
                              >
                                {getPageTypeIcon(
                                  partitionedPages[currentPartition].pageType
                                )}
                                <span className="ml-1">
                                  {getPageTypeLabel(
                                    partitionedPages[currentPartition].pageType
                                  )}
                                </span>
                              </Badge>
                            </div>

                            {/* Numéro de page */}
                            <div
                              className="absolute bottom-2 left-2"
                              style={{
                                transform: `scale(${Math.max(
                                  0.8 / zoomLevel,
                                  0.6
                                )})`,
                                transformOrigin: "bottom left",
                              }}
                            >
                              <Badge
                                variant="outline"
                                className="shadow-lg bg-white/95 backdrop-blur-sm"
                              >
                                Page{" "}
                                {partitionedPages[currentPartition].pageNumber}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Instructions de zoom */}
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                          Utilisez les contrôles de zoom ci-dessus
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

        <KeyboardShortcuts />
      </DialogContent>
    </Dialog>
  );
}
