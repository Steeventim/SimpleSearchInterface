"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SimpleDocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
  documentType?: string;
}

export function SimpleDocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
  documentType = "",
}: SimpleDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Vérifier si le fichier existe avant de l'afficher
  useEffect(() => {
    if (!isOpen || !documentPath) return;

    const checkFile = async () => {
      setLoading(true);
      setError(null);

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
      } catch (err: any) {
        console.error("Erreur lors de la vérification du fichier:", err);
        setError(err.message || "Le fichier n'est pas accessible");
      } finally {
        setLoading(false);
      }
    };

    checkFile();
  }, [isOpen, documentPath]);

  const isPdf =
    documentType === "pdf" || documentPath.toLowerCase().endsWith(".pdf");
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
            <div className="flex-1 overflow-auto bg-muted rounded-md relative">
              {isPdf ? (
                <object
                  data={fileUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[60vh]"
                >
                  <p>
                    Votre navigateur ne peut pas afficher ce PDF.{" "}
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
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
                    La prévisualisation n'est pas disponible pour ce type de
                    document.
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
