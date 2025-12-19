"use client";

import { useState, useEffect } from "react";
import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import { SearchHistory } from "@/components/search-history";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserInfo } from "@/components/user-info";
import { FileUpload } from "@/components/file-upload";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertCircle, Database, Settings, Search } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";

// Types pour notre application
export type SearchResult = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  date: string;
  imageUrl?: string;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  // Nouveaux champs
  meta?: {
    date?: string;
    format?: string;
    creator_tool?: string;
    created?: string;
    metadata_date?: string;
  };
  fileInfo?: {
    extension?: string;
    content_type?: string;
    created?: string;
    last_modified?: string;
    last_accessed?: string;
    indexing_date?: string;
    filesize?: number;
    filename?: string;
    url?: string;
  };
  path?: {
    root?: string;
    virtual?: string;
    real?: string;
  };
};

export type SearchFiltersType = {
  date?: "today" | "this-week" | "this-month" | "this-year" | "all";
  type?: "all" | "article" | "image" | "video" | "document";
  sort?: "relevance" | "date";
};

interface SearchInterfaceProps {
  userDivision?: string;
}

export default function SearchInterface(props: SearchInterfaceProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [filters, setFilters] = useState<SearchFiltersType>({
    date: "all",
    type: "all",
    sort: "relevance",
  });
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Global loading (deprecated/legacy use)
  const [isSearching, setIsSearching] = useState(false); // Specific for search execution
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false); // Specific for suggestion fetching
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const { toast } = useToast();

  const debouncedQuery = useDebounce(query, 300);

  // Récupérer les suggestions depuis l'API
  useEffect(() => {
    if (debouncedQuery.length > 1) {
      setIsSuggestionsLoading(true);

      // Appel à l'API pour les suggestions
      fetch(`/api/suggestions?q=${encodeURIComponent(debouncedQuery)}`)
        .then((response) => {
          if (!response.ok)
            throw new Error("Erreur lors de la récupération des suggestions");
          return response.json();
        })
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        })
        .catch((error) => {
          console.error("Erreur de suggestions:", error);
          // Fallback sur des suggestions simulées en cas d'erreur
          const mockSuggestions = [
            `${debouncedQuery} recherche`,
            `${debouncedQuery} avancée`,
            `${debouncedQuery} intelligence artificielle`,
          ];
          setSuggestions(mockSuggestions);
        })
        .finally(() => {
          setIsSuggestionsLoading(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);

  // Fonction pour enregistrer une recherche dans les statistiques
  const recordSearch = async (searchTerm: string) => {
    try {
      await fetch("/api/search-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchTerm }),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la recherche:", error);
    }
  };

  // Effectuer la recherche avec Elasticsearch
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSuggestions(false);
    setShowHistory(false);
    setSearchError(null);
    setCurrentSearchQuery(searchQuery);

    // Ajouter à l'historique s'il n'existe pas déjà
    if (!history.includes(searchQuery)) {
      setHistory((prev) => [searchQuery, ...prev].slice(0, 5));
    }

    // Enregistrer la recherche dans les statistiques
    await recordSearch(searchQuery);

    try {
      // Construire l'URL de recherche avec les filtres
      const searchUrl = `/api/search?q=${encodeURIComponent(
        searchQuery
      )}&date=${filters.date}&type=${filters.type}&sort=${filters.sort}`;

      // Appeler l'API de recherche
      const response = await fetch(searchUrl);

      if (!response.ok) {
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      setResults(data.results || []);
      setTotalResults(data.total || 0);
    } catch (error) {
      console.error("Erreur de recherche:", error);
      setSearchError(
        "Une erreur est survenue lors de la recherche. Veuillez réessayer."
      );
      setResults([]);

      // Simuler des résultats en cas d'erreur pour la démo
      setTimeout(() => {
        const mockResults: SearchResult[] = Array.from(
          { length: 5 },
          (_, i) => ({
            id: `result-${i}`,
            title: `Résultat pour "${searchQuery}" ${i + 1}`,
            description: `Ceci est une description pour le résultat de recherche "${searchQuery}". Il contient des informations pertinentes sur votre requête.`,
            url: `https://example.com/result-${i}`,
            type: ["article", "image", "video", "document"][
              Math.floor(Math.random() * 4)
            ],
            date: new Date(
              Date.now() - Math.floor(Math.random() * 10000000000)
            ).toISOString(),
            imageUrl:
              i % 3 === 0 ? `/placeholder.svg?height=100&width=150` : undefined,
          })
        );

        setResults(mockResults);
      }, 800);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFileUploadComplete = (files: File[]) => {
    toast({
      title: "Documents ajoutés !",
      description: `${files.length} document${files.length > 1 ? "s" : ""} avec succès. Ils seront indexés sous peu.`,
      duration: 5000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between mb-4 items-center">
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" suppressHydrationWarning>
                <Upload className="h-4 w-4 mr-2" />
                Télécharger des fichiers
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Télécharger des fichiers</DialogTitle>
                <DialogDescription className="sr-only">
                  Glissez-déposez vos fichiers ici pour les indexer
                </DialogDescription>
              </DialogHeader>
              <FileUpload
                onUploadComplete={handleFileUploadComplete}
                maxFiles={5}
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                userDivision={props.userDivision}
              />
            </DialogContent>
          </Dialog>

          {/* Lien vers la bibliothèque (Documents de la division) */}
          <Link href="/documents">
            <Button variant="outline" size="sm" suppressHydrationWarning>
              <Database className="h-4 w-4 mr-2" />
              Bibliothèque
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <UserInfo />
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg">
            <Search className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-primary tracking-tight">
            Système de Recherche CENADI
          </h1>
          <p className="text-muted-foreground mt-2">Centre National de Développement Informatique</p>
        </div>

        <div className="relative">
          <SearchBar
            query={query}
            setQuery={setQuery}
            onSearch={handleSearch}
            isLoading={isSearching}
            onFocus={() =>
              query.length > 0 ? setShowSuggestions(true) : setShowHistory(true)
            }
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-card rounded-md shadow-lg border border-border">
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-4 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setQuery(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {showHistory && history.length > 0 && !showSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-card rounded-md shadow-lg border border-border">
              <div className="p-2 border-b border-border">
                <h3 className="text-sm font-medium">Recherches récentes</h3>
              </div>
              <SearchHistory
                history={history}
                onSelect={(item) => {
                  setQuery(item);
                  handleSearch(item);
                }}
                onClear={() => setHistory([])}
              />
            </div>
          )}
        </div>

        {searchError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}


        {results.length > 0 && (
          <>
            <div className="mt-8">
              <SearchFilters filters={filters} onChange={setFilters} />
            </div>

            <div className="mt-4">
              <SearchResults
                results={results}
                filters={filters}
                isLoading={isLoading}
                totalResults={totalResults}
                searchQuery={currentSearchQuery}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
