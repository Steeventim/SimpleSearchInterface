"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SearchBar } from "@/components/search-bar";
import { SearchResults } from "@/components/search-results";
import { UserInfo } from "@/components/user-info";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileUpload } from "@/components/file-upload";
import { UserDocumentsManager } from "@/components/user-documents-manager";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Settings,
  BarChart3,
  Users,
  Shield,
  Zap,
  Clock,
  Menu,
  Upload,
  Plus,
  FolderOpen,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  SearchResult,
  SearchFiltersType,
} from "@/components/search-interface";

export default function SimpleSearchInterface() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [lastSearchTime, setLastSearchTime] = useState<number | null>(null);

  const debouncedQuery = useDebounce(query, 300);
  const userRole = session?.user?.role || "EMPLOYEE";
  const userLevel = session?.user?.roleLevel || 1;

  // Effectuer la recherche
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const startTime = performance.now();
    setIsLoading(true);
    setCurrentSearchQuery(searchQuery);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&size=20&from=0`
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
        throw new Error("Erreur lors de la recherche");
      }

      const data = await response.json();
      const resultsData = data.results || [];
      const totalResultsData = data.total || 0;

      setResults(resultsData);
      setTotalResults(totalResultsData);

      // Calculer le temps de réponse
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      setLastSearchTime(responseTime);

      toast({
        title: "Recherche terminée",
        description: `${totalResultsData} résultat${
          totalResultsData > 1 ? "s" : ""
        } trouvé${totalResultsData > 1 ? "s" : ""} en ${responseTime}ms`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Erreur de recherche:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la recherche",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctionnalités spéciales selon le rôle
  const getRoleSpecialFeatures = () => {
    switch (userRole) {
      case "ADMIN":
        return {
          showAnalytics: true,
          showUserManagement: true,
          showSystemSettings: true,
          showAdvancedFilters: true,
          canExport: true,
        };
      case "DIRECTOR":
        return {
          showAnalytics: true,
          showUserManagement: false,
          showSystemSettings: false,
          showAdvancedFilters: true,
          canExport: true,
        };
      case "MANAGER":
        return {
          showAnalytics: true,
          showUserManagement: false,
          showSystemSettings: false,
          showAdvancedFilters: true,
          canExport: false,
        };
      default: // EMPLOYEE
        return {
          showAnalytics: false,
          showUserManagement: false,
          showSystemSettings: false,
          showAdvancedFilters: false,
          canExport: false,
        };
    }
  };

  const features = getRoleSpecialFeatures();

  // Fonction d'export pour les rôles avancés
  const handleExportResults = () => {
    if (!features.canExport || results.length === 0) return;

    const exportData = {
      searchQuery: currentSearchQuery,
      totalResults,
      searchTime: lastSearchTime,
      exportDate: new Date().toISOString(),
      results: results.map((result) => ({
        title: result.title,
        description: result.description?.substring(0, 200),
        path: result.filePath,
        url: result.url,
        type: result.type,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `search-export-${currentSearchQuery}-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export réussi",
      description: `${results.length} résultats exportés`,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header simplifié */}
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src="/Logo_DGI_Cameroun.png"
                alt="Logo DGI Cameroun"
                className="w-10 h-10 object-contain"
              />
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                Système de Recherche DGI
              </h1>
              <Badge variant="outline" className="text-xs">
                {session?.user?.role}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {/* Menu mobile pour les options avancées */}
              {(features.showAnalytics || features.showSystemSettings) && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="md:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Options avancées</SheetTitle>
                      <SheetDescription>
                        Fonctionnalités spéciales pour {session?.user?.role}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {features.showAnalytics && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => (window.location.href = "/analytics")}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Button>
                      )}
                      {features.showUserManagement && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() =>
                            (window.location.href = "/system-settings")
                          }
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Gestion utilisateurs
                        </Button>
                      )}
                      {features.showSystemSettings && (
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() =>
                            (window.location.href = "/system-settings")
                          }
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Paramètres système
                        </Button>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              )}

              {/* Boutons d'options pour desktop */}
              <div className="hidden md:flex items-center space-x-2">
                {features.showAnalytics && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = "/analytics")}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </Button>
                )}
              </div>

              <UserInfo />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec onglets */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Interface avec onglets */}
          <Card className="mb-8 shadow-lg">
            <CardContent className="p-6">
              <Tabs defaultValue="search" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="search" className="flex items-center">
                    <Search className="w-4 h-4 mr-2" />
                    Rechercher
                  </TabsTrigger>
                  <TabsTrigger value="upload" className="flex items-center">
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter des documents
                  </TabsTrigger>
                  <TabsTrigger value="documents" className="flex items-center">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Mes Documents
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Recherche */}
                <TabsContent value="search" className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Trouvez ce que vous cherchez
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Recherchez dans votre base documentaire
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <SearchBar
                      query={query}
                      setQuery={setQuery}
                      onSearch={handleSearch}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* Statistiques rapides pour les rôles avancés */}
                  {features.showAnalytics && lastSearchTime && (
                    <div className="flex justify-center">
                      <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center">
                          <Zap className="w-4 h-4 mr-1" />
                          {lastSearchTime}ms
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {totalResults} résultats
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Onglet Upload */}
                <TabsContent value="upload" className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Ajouter de nouveaux documents
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Enrichissez votre base documentaire pour de meilleures
                      recherches
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <FileUpload
                      onUploadComplete={(files) => {
                        toast({
                          title: "Documents ajoutés !",
                          description: `${files.length} fichier${
                            files.length > 1 ? "s" : ""
                          } ajouté${
                            files.length > 1 ? "s" : ""
                          } avec succès. Ils seront indexés et disponibles pour la recherche sous peu.`,
                          duration: 5000,
                        });
                      }}
                      maxFiles={10}
                      acceptedFileTypes=".pdf,.doc,.docx,.txt,.rtf,.odt"
                    />
                  </div>

                  {/* Info sur les types de fichiers acceptés */}
                  <div className="max-w-2xl mx-auto">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                        Types de fichiers supportés
                      </h3>
                      <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <p>
                          • <strong>Documents :</strong> PDF, DOC, DOCX, RTF,
                          ODT
                        </p>
                        <p>
                          • <strong>Texte :</strong> TXT, MD
                        </p>
                        <p>
                          • <strong>Taille max :</strong> 50 MB par fichier
                        </p>
                        <p>
                          • <strong>Indexation :</strong> Automatique après
                          upload
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Onglet Mes Documents */}
                <TabsContent value="documents" className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      Mes Documents
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400">
                      Gérez vos documents téléchargés
                    </p>
                  </div>

                  <div className="max-w-4xl mx-auto">
                    <UserDocumentsManager />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Résultats */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Résultats pour "{currentSearchQuery}"
                  </CardTitle>
                  {features.canExport && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportResults}
                    >
                      Exporter
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <SearchResults
                  results={results}
                  filters={{ date: "all", type: "all", sort: "relevance" }}
                  isLoading={isLoading}
                  totalResults={totalResults}
                  searchQuery={currentSearchQuery}
                />
              </CardContent>
            </Card>
          )}

          {/* État vide */}
          {!isLoading && results.length === 0 && currentSearchQuery && (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Essayez avec d'autres mots-clés
                </p>
                <Button variant="outline" onClick={() => setQuery("")}>
                  Nouvelle recherche
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
