"use client";

import { useState } from "react";
import type {
  SearchResult,
  SearchFiltersType,
} from "@/components/search-interface";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Eye } from "lucide-react";
import Image from "next/image";
import { FallbackDocumentViewer } from "@/components/fallback-document-viewer";
import { SimplePdfPartitioner } from "@/components/simple-pdf-partitioner";
import { PartitioningHelpDialog } from "@/components/partitioning-help-dialog";
import { PdfComponentWrapper } from "@/components/pdf-component-wrapper";

interface SearchResultsProps {
  results: SearchResult[];
  filters: SearchFiltersType;
  isLoading: boolean;
  totalResults?: number;
  searchQuery?: string;
}

export function SearchResults({
  results,
  filters,
  isLoading,
  totalResults = 0,
  searchQuery = "",
}: SearchResultsProps) {
  const [selectedDocument, setSelectedDocument] = useState<{
    path: string;
    title: string;
  } | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isSmartPartitionerOpen, setIsSmartPartitionerOpen] = useState(false);
  const [smartPartitionerDoc, setSmartPartitionerDoc] = useState<{
    url: string;
    title: string;
    searchTerm: string;
  } | null>(null);

  // Appliquer les filtres aux résultats
  const filteredResults = results.filter((result) => {
    // Filtre par type
    if (filters.type !== "all" && result.type !== filters.type) {
      return false;
    }

    // Filtre par date (simplifié pour la démo)
    if (filters.date !== "all") {
      const resultDate = new Date(result.date);
      const now = new Date();

      if (filters.date === "today") {
        if (resultDate.toDateString() !== now.toDateString()) return false;
      } else if (filters.date === "this-week") {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        if (resultDate < weekAgo) return false;
      } else if (filters.date === "this-month") {
        if (
          resultDate.getMonth() !== now.getMonth() ||
          resultDate.getFullYear() !== now.getFullYear()
        )
          return false;
      } else if (filters.date === "this-year") {
        if (resultDate.getFullYear() !== now.getFullYear()) return false;
      }
    }

    return true;
  });

  // Trier les résultats
  const sortedResults = [...filteredResults].sort((a, b) => {
    if (filters.sort === "date") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
    // Par défaut, on garde l'ordre de pertinence (qui serait normalement déterminé par l'API)
    return 0;
  });

  const handleViewDocument = (result: SearchResult) => {
    // Si c'est un PDF et qu'il y a un terme de recherche, utiliser le visualiseur PDF simplifié
    if (isPdfDocument(result) && searchQuery) {
      handleSmartPartitioning(result);
      return;
    }

    // Sinon, utiliser le visualiseur de document classique
    const documentPath = result.path?.real || result.filePath || "";
    if (documentPath) {
      setSelectedDocument({
        path: documentPath,
        title: result.title || result.fileName || "Document",
      });
      setIsViewerOpen(true);
    }
  };

  const handleSmartPartitioning = (result: SearchResult) => {
    const documentUrl = result.url || result.path?.virtual || "";
    if (documentUrl && result.fileName?.toLowerCase().endsWith(".pdf")) {
      setSmartPartitionerDoc({
        url: documentUrl,
        title: result.title || result.fileName || "Document PDF",
        searchTerm: searchQuery,
      });
      setIsSmartPartitionerOpen(true);
    }
  };

  const isPdfDocument = (result: SearchResult) => {
    return (
      result.fileName?.toLowerCase().endsWith(".pdf") ||
      result.type === "application/pdf" ||
      result.path?.virtual?.includes(".pdf")
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (sortedResults.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium mb-2">Aucun résultat trouvé</h3>
        <p className="text-muted-foreground">
          Essayez de modifier vos filtres ou votre requête de recherche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {sortedResults.length} résultat{sortedResults.length > 1 ? "s" : ""}{" "}
          trouvé{sortedResults.length > 1 ? "s" : ""}
          {totalResults > sortedResults.length
            ? ` (sur ${totalResults} au total)`
            : ""}
        </p>

        {/* Afficher l'aide seulement s'il y a des PDF dans les résultats */}
        {sortedResults.some((result) => isPdfDocument(result)) &&
          searchQuery && <PartitioningHelpDialog />}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sortedResults.map((result) => (
          <Card
            key={result.id}
            className="overflow-hidden transition-all hover:shadow-md"
          >
            <div className="flex flex-col md:flex-row">
              {result.imageUrl && (
                <div className="md:w-1/4 h-40 md:h-auto relative">
                  <Image
                    src={result.imageUrl || "/placeholder.svg"}
                    alt={result.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div
                className={`flex-1 ${result.imageUrl ? "md:w-3/4" : "w-full"}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="mb-2">
                      {result.type.charAt(0).toUpperCase() +
                        result.type.slice(1)}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(result.date).toLocaleDateString()}
                    </div>
                  </div>
                  <CardTitle className="text-xl hover:text-primary transition-colors">
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {result.title}
                    </a>
                  </CardTitle>

                  {/* Nom du fichier mis en évidence et transformé en lien */}
                  {result.fileName && (
                    <div
                      className="mt-2 text-lg font-medium text-primary hover:underline cursor-pointer flex items-center"
                      onClick={() => handleViewDocument(result)}
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {result.fileName}
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <div
                    className="text-sm line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: result.description }}
                  />

                  {result.fileSize && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Taille: {formatFileSize(result.fileSize)}
                    </div>
                  )}

                  {/* Ajouter l'affichage des métadonnées supplémentaires */}
                  {result.meta && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {result.meta.creator_tool && (
                        <div>Créé avec: {result.meta.creator_tool}</div>
                      )}
                      {result.meta.created && (
                        <div>
                          Date de création:{" "}
                          {new Date(result.meta.created).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {result.fileInfo && result.fileInfo.last_modified && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Dernière modification:{" "}
                      {new Date(result.fileInfo.last_modified).toLocaleString()}
                    </div>
                  )}
                </CardContent>

                {/* Actions et boutons */}
                <CardFooter>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      {result.fileName && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDocument(result)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualiser
                        </Button>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {isPdfDocument(result) && searchQuery ? (
                        <span className="text-primary font-medium">
                          PDF • Visualisation avec recherche
                        </span>
                      ) : result.filePath ? (
                        "Fichier visualisable"
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                </CardFooter>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedDocument && (
        <FallbackDocumentViewer
          documentPath={selectedDocument.path}
          documentTitle={selectedDocument.title}
          searchTerm={searchQuery}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}

      {smartPartitionerDoc && (
        <PdfComponentWrapper isOpen={isSmartPartitionerOpen}>
          <SimplePdfPartitioner
            documentUrl={smartPartitionerDoc.url}
            searchTerm={smartPartitionerDoc.searchTerm}
            isOpen={isSmartPartitionerOpen}
            onClose={() => setIsSmartPartitionerOpen(false)}
            documentTitle={smartPartitionerDoc.title}
          />
        </PdfComponentWrapper>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}
