"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  Eye,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

interface PageInfo {
  pageNumber: number;
  imageUrl: string;
  hasSearchTerm: boolean;
}

export function DocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: DocumentViewerProps) {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"full" | "reduced">("full");
  const [allPages, setAllPages] = useState<PageInfo[]>([]);

  useEffect(() => {
    if (!isOpen || !documentPath) return;

    const fetchDocumentPages = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("Récupération des pages du document:", documentPath);
        // Appeler l'API pour obtenir les informations sur les pages du document
        const pagesUrl = `/api/document/pages?path=${encodeURIComponent(
          documentPath
        )}&searchTerm=${encodeURIComponent(searchTerm || "")}`;
        console.log("URL de l'API pages:", pagesUrl);

        const response = await fetch(pagesUrl);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Erreur lors du chargement du document"
          );
        }

        const data = await response.json();
        console.log("Pages récupérées:", data);

        if (data.pages && Array.isArray(data.pages)) {
          setAllPages(data.pages);
          setTotalPages(data.totalPages || 0);

          // Filter pages based on view mode
          const filteredPages = getFilteredPages(data.pages, viewMode, data.totalPages || 0);
          setPages(filteredPages);

          // Set current page to first page with search term if in reduced mode, otherwise first page
          if (filteredPages.length > 0) {
            const firstPageWithTerm = filteredPages.findIndex(p => p.hasSearchTerm);
            setCurrentPage(firstPageWithTerm >= 0 ? firstPageWithTerm : 0);
          }
        } else {
          throw new Error(
            "Format de données invalide pour les pages du document"
          );
        }
      } catch (error: any) {
        console.error("Erreur:", error);
        setError(
          error.message ||
            "Une erreur est survenue lors du chargement du document"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentPages();
  }, [isOpen, documentPath, searchTerm, viewMode]);

  // Update filtered pages when view mode changes
  useEffect(() => {
    if (allPages.length > 0) {
      const filteredPages = getFilteredPages(allPages, viewMode, totalPages);
      setPages(filteredPages);

      // Reset to first page or first page with search term
      if (filteredPages.length > 0) {
        const firstPageWithTerm = filteredPages.findIndex(p => p.hasSearchTerm);
        setCurrentPage(firstPageWithTerm >= 0 ? firstPageWithTerm : 0);
      }
    }
  }, [viewMode, allPages, totalPages]);

  const getFilteredPages = (allPages: PageInfo[], mode: "full" | "reduced", totalPages: number): PageInfo[] => {
    if (mode === "full") {
      return allPages;
    }

    // Reduced mode: show first page, last page, and pages with search terms
    const filteredPages: PageInfo[] = [];
    const pagesWithTerms: PageInfo[] = [];

    allPages.forEach(page => {
      if (page.hasSearchTerm) {
        pagesWithTerms.push(page);
      }
    });

    // Add first page if it exists
    if (allPages.length > 0) {
      filteredPages.push(allPages[0]);
    }

    // Add pages with search terms (excluding first page if it already has terms)
    pagesWithTerms.forEach(page => {
      if (page.pageNumber !== 1) {
        filteredPages.push(page);
      }
    });

    // Add last page if it exists and is different from first page
    if (allPages.length > 1 && allPages[allPages.length - 1].pageNumber !== 1) {
      filteredPages.push(allPages[allPages.length - 1]);
    }

    return filteredPages;
  };

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
    // Créer un lien pour télécharger le document complet
    const downloadLink = document.createElement("a");
    downloadLink.href = `/api/files/content?path=${encodeURIComponent(
      documentPath
    )}&download=true`;
    downloadLink.download = documentTitle || "document";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Fonction pour générer une description des pages affichées
  const getPageDescription = () => {
    if (pages.length === 0) return "";

    if (pages.length === 2) {
      return `Affichage des pages 1 et ${totalPages} sur ${totalPages}`;
    }

    const pagesWithTerm = pages
      .filter((p) => p.hasSearchTerm)
      .map((p) => p.pageNumber);
    if (pagesWithTerm.length > 0) {
      return `Affichage de la première page, dernière page, et pages contenant le terme recherché (${pagesWithTerm.join(
        ", "
      )})`;
    }

    return `Affichage des pages sélectionnées (${pages
      .map((p) => p.pageNumber)
      .join(", ")})`;
  };

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
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === "full" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("full")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Complet
                    </Button>
                    <Button
                      variant={viewMode === "reduced" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("reduced")}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Réduit
                    </Button>
                  </div>
                </div>
              </div>

              {pages.length > 0 && (
                <div className="text-xs text-muted-foreground mb-2">
                  {getPageDescription()}
                </div>
              )}

              <div className="flex-1 overflow-auto bg-muted rounded-md relative">
                {pages.length > 0 ? (
                  <div className="flex justify-center p-4">
                    <img
                      src={pages[currentPage]?.imageUrl || "/placeholder.svg"}
                      alt={`Page ${pages[currentPage]?.pageNumber}`}
                      className="max-w-full max-h-[60vh] object-contain shadow-lg"
                    />
                  </div>
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
