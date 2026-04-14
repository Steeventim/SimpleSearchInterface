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
  AlertCircle,
  FileText,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TextDocumentViewerProps {
  documentPath: string;
  searchTerm: string;
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

interface MatchPosition {
  start: number;
  end: number;
  pageNumber?: number;
}

export function TextDocumentViewer({
  documentPath,
  searchTerm,
  isOpen,
  onClose,
  documentTitle,
}: TextDocumentViewerProps) {
  const [text, setText] = useState<string>("");
  const [matches, setMatches] = useState<MatchPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"full" | "reduced">("full");

  const contentRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Fetch document text when opened
  useEffect(() => {
    if (isOpen && documentPath) {
      fetchDocumentText();
    }
  }, [isOpen, documentPath]);

  // Scroll to current match when it changes
  useEffect(() => {
    if (matches.length > 0 && contentRef.current) {
      scrollToMatch(currentMatchIndex);
    }
  }, [currentMatchIndex, matches]);

  // Auto-scroll to first match when document loads
  useEffect(() => {
    if (text && matches.length > 0 && !loading) {
      setTimeout(() => scrollToMatch(0), 100);
    }
  }, [text, matches, loading]);

  const fetchDocumentText = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/document/text?path=${encodeURIComponent(documentPath)}&search=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch document text");
      }

      const data = await response.json();
      setText(data.text || "");
      setMatches(data.matches || []);
      setCurrentMatchIndex(0);
    } catch (err) {
      console.error("Error fetching document text:", err);
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const scrollToMatch = (matchIndex: number) => {
    if (!contentRef.current || matches.length === 0) return;

    const match = matches[matchIndex];
    if (!match) return;

    // Find the highlighted span element
    const highlights = contentRef.current.querySelectorAll('.search-highlight');
    const targetHighlight = highlights[matchIndex] as HTMLElement;

    if (targetHighlight && scrollAreaRef.current) {
      // Scroll the highlight into view
      targetHighlight.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const navigateMatch = (direction: 'prev' | 'next') => {
    if (matches.length === 0) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentMatchIndex < matches.length - 1 ? currentMatchIndex + 1 : 0;
    } else {
      newIndex = currentMatchIndex > 0 ? currentMatchIndex - 1 : matches.length - 1;
    }

    setCurrentMatchIndex(newIndex);
  };

  const highlightText = (text: string, matches: MatchPosition[]): React.ReactNode => {
    if (!searchTerm || matches.length === 0) {
      return text;
    }

    const result: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // Add text before the match
      if (match.start > lastIndex) {
        result.push(text.slice(lastIndex, match.start));
      }

      // Add the highlighted match
      const matchText = text.slice(match.start, match.end);
      result.push(
        <span
          key={index}
          className={`search-highlight px-1 rounded ${
            index === currentMatchIndex
              ? 'bg-yellow-300 text-black font-semibold'
              : 'bg-yellow-200 text-black'
          }`}
        >
          {matchText}
        </span>
      );

      lastIndex = match.end;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      result.push(text.slice(lastIndex));
    }

    return result;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `/api/files/download?path=${encodeURIComponent(documentPath)}`;
    link.download = documentTitle || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPageDescription = () => {
    if (matches.length === 0) return "Aucun terme trouvé";

    const current = currentMatchIndex + 1;
    const total = matches.length;
    return `Occurrence ${current} sur ${total}`;
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

                {matches.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {getPageDescription()}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMatch('prev')}
                        disabled={matches.length <= 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMatch('next')}
                        disabled={matches.length <= 1}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-md" ref={scrollAreaRef}>
                <div
                  ref={contentRef}
                  className="p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed"
                  style={{ minHeight: '400px' }}
                >
                  {highlightText(text, matches)}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}