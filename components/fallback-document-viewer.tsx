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
  Download,
  ExternalLink,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FallbackDocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export function FallbackDocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: FallbackDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("document");
  const [documentPages, setDocumentPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pagesError, setPagesError] = useState<string | null>(null);

  // Vérifier si le fichier existe avant de l'afficher
  useEffect(() => {
    if (!isOpen || !documentPath) return;

    const checkFile = async () => {
      setLoading(true);
      setError(null);
      setPagesError(null);

      try {
        // Construire l'URL du fichier
        const url = `/api/files/content?path=${encodeURIComponent(
          documentPath
        )}`;

        // Vérifier si le fichier existe
        const response = await fetch(url, { method: "HEAD" });

        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: Le fichier n'est pas accessible`
          );
        }

        setFileUrl(url);

        // Récupérer les pages du document dans un bloc try/catch séparé
        try {
          console.log("Récupération des pages du document:", documentPath);
          const pagesUrl = `/api/document/pages?path=${encodeURIComponent(
            documentPath
          )}&searchTerm=${encodeURIComponent(searchTerm || "")}`;
          console.log("URL de l'API pages:", pagesUrl);

          const pagesResponse = await fetch(pagesUrl);

          if (!pagesResponse.ok) {
            const errorData = await pagesResponse.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                "Erreur lors de la récupération des pages du document"
            );
          }

          const pagesData = await pagesResponse.json();
          console.log("Pages récupérées:", pagesData);

          if (pagesData.pages && Array.isArray(pagesData.pages)) {
            setDocumentPages(pagesData.pages);
            setTotalPages(pagesData.totalPages || 0);
            setCurrentPage(0);
          } else {
            throw new Error(
              "Format de données invalide pour les pages du document"
            );
          }
        } catch (pagesError: any) {
          console.error(
            "Erreur lors de la récupération des pages:",
            pagesError
          );
          setPagesError(
            pagesError.message ||
              "Erreur lors de la récupération des pages du document"
          );
          // Ne pas bloquer l'affichage du document si les pages ne peuvent pas être récupérées
        }
      } catch (err: any) {
        console.error("Erreur lors de la vérification du fichier:", err);
        setError(err.message || "Le fichier n'est pas accessible");
      } finally {
        setLoading(false);
      }
    };

    checkFile();
  }, [isOpen, documentPath, searchTerm]);

  const isPdf = documentPath.toLowerCase().endsWith(".pdf");
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentPath);
  const isText = /\.(txt|md|csv|json|html|htm)$/i.test(documentPath);

  const handleDownload = () => {
    if (!fileUrl) return;

    const downloadLink = document.createElement("a");
    downloadLink.href = `${fileUrl}&download=true`;
    downloadLink.download = documentTitle || "document";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleNextPage = () => {
    if (currentPage < documentPages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Fonction pour générer une description des pages affichées
  const getPageDescription = () => {
    if (documentPages.length === 0) return "";

    if (documentPages.length === 2) {
      return `Affichage des pages 1 et ${totalPages} sur ${totalPages}`;
    }

    const pagesWithTerm = documentPages
      .filter((p) => p.hasSearchTerm)
      .map((p) => p.pageNumber);
    if (pagesWithTerm.length > 0) {
      return `Affichage de la première page, dernière page, et pages contenant le terme recherché (${pagesWithTerm.join(
        ", "
      )})`;
    }

    return `Affichage des pages sélectionnées (${documentPages
      .map((p) => p.pageNumber)
      .join(", ")})`;
  };

  // Déterminer si l'onglet "pages" doit être affiché
  const showPagesTab = documentPages.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 truncate">
            <div className="flex items-center">
              {documentTitle || "Visualisation du document"}
              {searchTerm && (
                <Badge variant="outline" className="ml-2">
                  Recherche: {searchTerm}
                </Badge>
              )}
            </div>
            {!loading && !error && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir
                  </a>
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <span className="ml-2">Chargement du document...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {pagesError && (
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {pagesError}. L'affichage des pages n'est pas disponible,
                    mais vous pouvez toujours visualiser le document.
                  </AlertDescription>
                </Alert>
              )}

              <Tabs
                value={showPagesTab ? activeTab : "document"}
                onValueChange={setActiveTab}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList
                  className="grid w-full max-w-md mx-auto"
                  style={{
                    gridTemplateColumns: showPagesTab ? "1fr 1fr" : "1fr",
                  }}
                >
                  <TabsTrigger value="document">Document</TabsTrigger>
                  {showPagesTab && (
                    <TabsTrigger value="pages">Pages</TabsTrigger>
                  )}
                </TabsList>

                <div className="flex-1 overflow-hidden flex flex-col mt-4">
                  <TabsContent
                    value="document"
                    className="flex-1 overflow-hidden"
                  >
                    {isPdf ? (
                      <object
                        data={fileUrl}
                        type="application/pdf"
                        className="w-full h-full min-h-[60vh]"
                      >
                        <p>
                          Votre navigateur ne peut pas afficher ce PDF.{" "}
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Cliquez ici pour le télécharger
                          </a>
                          .
                        </p>
                      </object>
                    ) : isImage ? (
                      <div className="flex justify-center items-center p-4 h-full">
                        <img
                          src={fileUrl || "/placeholder.svg"}
                          alt={documentTitle || "Image"}
                          className="max-w-full max-h-[60vh] object-contain"
                        />
                      </div>
                    ) : isText ? (
                      <iframe
                        src={fileUrl}
                        className="w-full h-full min-h-[60vh]"
                        title={documentTitle || "Document texte"}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-12">
                        <p className="mb-4 text-muted-foreground">
                          La prévisualisation n'est pas disponible pour ce type
                          de document.
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={handleDownload}>
                            <Download className="h-4 w-4 mr-2" />
                            Télécharger
                          </Button>
                          <Button variant="default" asChild>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Ouvrir dans un nouvel onglet
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {showPagesTab && (
                    <TabsContent
                      value="pages"
                      className="flex-1 overflow-hidden flex flex-col"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm">
                          Page {documentPages[currentPage]?.pageNumber} sur{" "}
                          {totalPages}
                          {documentPages[currentPage]?.hasSearchTerm && (
                            <Badge variant="secondary" className="ml-2">
                              Terme trouvé
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mb-2">
                        {getPageDescription()}
                      </div>

                      <div className="flex-1 overflow-auto bg-muted rounded-md relative">
                        <div className="flex justify-center p-4">
                          <img
                            src={
                              documentPages[currentPage]?.imageUrl ||
                              "/placeholder.svg"
                            }
                            alt={`Page ${documentPages[currentPage]?.pageNumber}`}
                            className="max-w-full max-h-[60vh] object-contain shadow-lg"
                          />
                        </div>
                      </div>

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
                          {documentPages.map((page, index) => (
                            <Button
                              key={page.pageNumber}
                              variant={
                                currentPage === index ? "default" : "outline"
                              }
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
                          disabled={currentPage === documentPages.length - 1}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
