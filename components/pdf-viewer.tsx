"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { initializePdfjs } from "@/lib/pdf-utils";

interface PdfViewerProps {
  documentUrl: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

interface PageInfo {
  pageNumber: number;
  canvas: HTMLCanvasElement;
  hasSearchTerm: boolean;
}

export function PdfViewer({
  documentUrl,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: PdfViewerProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !documentUrl) return;

    const loadPdf = async () => {
      setLoading(true);
      setError(null);

      try {
        // Initialiser PDF.js de manière dynamique
        const pdfjs = await initializePdfjs();
        if (!pdfjs) {
          throw new Error("Impossible d'initialiser PDF.js");
        }

        // Charger le document PDF
        const loadingTask = pdfjs.getDocument(documentUrl);
        const pdf = await loadingTask.promise;

        setTotalPages(pdf.numPages);

        // Identifier les pages contenant le terme recherché
        const pagesWithSearchTerm = new Set<number>();

        if (searchTerm) {
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(" ")
              .toLowerCase();

            if (pageText.includes(searchTerm.toLowerCase())) {
              pagesWithSearchTerm.add(i);
            }
          }
        }

        // Déterminer quelles pages afficher
        const pagesToRender = new Set<number>();

        // Toujours inclure la première page
        pagesToRender.add(1);

        // Toujours inclure la dernière page
        pagesToRender.add(pdf.numPages);

        // Ajouter les pages contenant le terme recherché
        pagesWithSearchTerm.forEach((pageNum) => pagesToRender.add(pageNum));

        // Convertir en tableau et trier
        const sortedPageNumbers = Array.from(pagesToRender).sort(
          (a, b) => a - b
        );

        // Rendre les pages
        const pageInfos: PageInfo[] = [];

        for (const pageNum of sortedPageNumbers) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const context = canvas.getContext("2d");
          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;
          }

          pageInfos.push({
            pageNumber: pageNum,
            canvas,
            hasSearchTerm: pagesWithSearchTerm.has(pageNum),
          });
        }

        setPages(pageInfos);

        if (pageInfos.length > 0) {
          setCurrentPage(0);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du PDF:", error);
        setError("Une erreur est survenue lors du chargement du document PDF");
      } finally {
        setLoading(false);
      }
    };

    loadPdf();
  }, [isOpen, documentUrl, searchTerm]);

  const handleNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDownload = () => {
    window.open(documentUrl, "_blank");
  };

  useEffect(() => {
    // Afficher le canvas actuel
    if (canvasRef.current && pages.length > 0) {
      canvasRef.current.innerHTML = "";
      canvasRef.current.appendChild(pages[currentPage].canvas);
    }
  }, [currentPage, pages]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 truncate">
            {documentTitle || "Visualisation du document"}
            {searchTerm && (
              <Badge variant="outline" className="ml-2">
                Recherche: {searchTerm}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Chargement du document...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full py-12 text-destructive">
              {error}
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm">
                  {pages.length > 0 && (
                    <>
                      Page {pages[currentPage]?.pageNumber} sur {totalPages}
                      {pages[currentPage]?.hasSearchTerm && (
                        <Badge variant="secondary" className="ml-2">
                          <Search className="h-3 w-3 mr-1" />
                          Terme trouvé
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
              </div>

              <div className="flex-1 overflow-auto bg-muted rounded-md relative">
                {pages.length > 0 ? (
                  <div
                    className="flex justify-center p-4"
                    ref={canvasRef}
                  ></div>
                ) : (
                  <div className="flex items-center justify-center h-full py-12">
                    Aucune page à afficher
                  </div>
                )}
              </div>

              {pages.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Précédent
                  </Button>

                  <div className="flex gap-1">
                    {pages.map((page, index) => (
                      <Button
                        key={page.pageNumber}
                        variant={currentPage === index ? "default" : "outline"}
                        size="sm"
                        className={`w-8 h-8 p-0 ${
                          page.hasSearchTerm ? "border-primary" : ""
                        }`}
                        onClick={() => setCurrentPage(index)}
                      >
                        {page.pageNumber}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === pages.length - 1}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
