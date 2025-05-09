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

interface IframeDocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export function IframeDocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: IframeDocumentViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Construire l'URL du fichier
  const fileUrl = `/api/files/content?path=${encodeURIComponent(documentPath)}`;

  // Vérifier si le fichier existe
  useEffect(() => {
    if (!isOpen) return;

    const checkFile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(fileUrl, { method: "HEAD" });
        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: Le document n'est pas accessible`
          );
        }
      } catch (err: any) {
        console.error("Erreur lors de la vérification du fichier:", err);
        setError(err.message || "Le document n'est pas accessible");
      } finally {
        setLoading(false);
      }
    };

    checkFile();
  }, [isOpen, fileUrl]);

  const handleDownload = () => {
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
            <iframe
              src={fileUrl}
              className="w-full h-full min-h-[70vh]"
              title={documentTitle || "Document"}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
