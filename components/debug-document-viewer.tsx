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
  FileText,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DebugDocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  onError?: () => void;
}

export function DebugDocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
  onError,
}: DebugDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileInfo, setFileInfo] = useState<any>(null);
  const [uploadDirInfo, setUploadDirInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("document");
  const [documentPages, setDocumentPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Construire l'URL du fichier
  const fileUrl = `/api/files/content?path=${encodeURIComponent(documentPath)}`;

  // Vérifier le fichier et le répertoire d'upload
  useEffect(() => {
    if (!isOpen) return;

    const checkFile = async () => {
      setLoading(true);
      setError(null);

      try {
        // Vérifier le répertoire d'upload
        const uploadDirResponse = await fetch("/api/check-upload-dir");
        const uploadDirData = await uploadDirResponse.json();
        setUploadDirInfo(uploadDirData);

        // Vérifier le fichier
        const response = await fetch(fileUrl, { method: "HEAD" });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: `Erreur ${response.status}` }));
          throw new Error(
            errorData.error ||
              `Erreur ${response.status}: Le document n'est pas accessible`
          );
        }

        // Récupérer les informations sur le fichier
        setFileInfo({
          path: documentPath,
          url: fileUrl,
          contentType: response.headers.get("Content-Type"),
          contentLength: response.headers.get("Content-Length"),
          lastModified: response.headers.get("Last-Modified"),
        });

        // Récupérer les pages du document
        const pagesResponse = await fetch(
          `/api/document/pages?path=${encodeURIComponent(
            documentPath
          )}&searchTerm=${encodeURIComponent(searchTerm || "")}`
        );

        if (!pagesResponse.ok) {
          throw new Error(
            "Erreur lors de la récupération des pages du document"
          );
        }

        const pagesData = await pagesResponse.json();
        setDocumentPages(pagesData.pages || []);
        setTotalPages(pagesData.totalPages || 0);
        setCurrentPage(0);
      } catch (err: any) {
        console.error("Erreur lors de la vérification du fichier:", err);
        setError(err.message || "Le document n'est pas accessible");

        // Appeler le callback d'erreur si fourni
        if (onError) {
          onError();
        }
      } finally {
        setLoading(false);
      }
    };

    checkFile();
  }, [isOpen, fileUrl, documentPath, searchTerm, onError]);

  const handleDownload = () => {
    const downloadLink = document.createElement("a");
    downloadLink.href = `${fileUrl}&download=true`;
    downloadLink.download = documentTitle || "document";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);

    // Recharger la page dans l'iframe
    const iframe = document.getElementById(
      "document-iframe"
    ) as HTMLIFrameElement;
    if (iframe) {
      iframe.src = fileUrl;
    }

    setTimeout(() => setLoading(false), 1000);
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
                <Button variant="outline" size="sm" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
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

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
            <TabsTrigger value="document">Document</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="debug">Débogage</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden flex flex-col mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-full py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span className="ml-2">Chargement du document...</span>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="my-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <TabsContent
                  value="document"
                  className="flex-1 overflow-hidden"
                >
                  <iframe
                    id="document-iframe"
                    src={fileUrl}
                    className="w-full h-full min-h-[70vh]"
                    title={documentTitle || "Document"}
                  />
                </TabsContent>

                <TabsContent
                  value="pages"
                  className="flex-1 overflow-hidden flex flex-col"
                >
                  {documentPages.length > 0 ? (
                    <>
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
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full py-12">
                      Aucune page à afficher
                    </div>
                  )}
                </TabsContent>
              </>
            )}

            <TabsContent value="debug" className="flex-1 overflow-auto p-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Informations sur le répertoire d'upload
                  </h3>
                  {uploadDirInfo ? (
                    <div className="bg-muted p-4 rounded-md overflow-auto max-h-[200px]">
                      <pre className="text-xs">
                        {JSON.stringify(uploadDirInfo, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      Aucune information disponible
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Variables d'environnement
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="font-medium">UPLOAD_DIRECTORY</div>
                    <div>
                      {process.env.NEXT_PUBLIC_UPLOAD_DIRECTORY || "Non défini"}
                    </div>

                    <div className="font-medium">ELASTICSEARCH_URL</div>
                    <div>
                      {process.env.NEXT_PUBLIC_ELASTICSEARCH_URL ||
                        "Non défini"}
                    </div>

                    <div className="font-medium">ELASTICSEARCH_INDEX</div>
                    <div>
                      {process.env.NEXT_PUBLIC_ELASTICSEARCH_INDEX ||
                        "Non défini"}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Chemin du document
                  </h3>
                  <div className="bg-muted p-4 rounded-md">
                    <p className="break-all text-sm">{documentPath}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Actions de débogage
                  </h3>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleRefresh}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualiser
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href="/api/check-upload-dir"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Vérifier le répertoire
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
