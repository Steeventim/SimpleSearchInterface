"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, Search, Database, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ElasticsearchManager() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState("_search");

  const executeQuery = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Valider que la requête est un JSON valide
      let parsedQuery;
      try {
        parsedQuery = JSON.parse(query);
      } catch (parseError) {
        throw new Error("Erreur de syntaxe JSON dans la requête");
      }

      // Envoyer la requête à notre API proxy Elasticsearch
      const response = await fetch(`/api/elasticsearch?endpoint=${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: query, // Envoyer la requête JSON telle quelle
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Erreur ${response.status}: ${JSON.stringify(data.details || {})}`
        );
      }

      setResult(data);
    } catch (error: any) {
      console.error("Erreur:", error);
      setError(
        error.message ||
          "Une erreur est survenue lors de l'exécution de la requête"
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour formater la taille des résultats
  const formatResultSize = (result: any) => {
    if (!result) return "0 résultats";

    if (result.hits?.total?.value !== undefined) {
      return `${result.hits.total.value} document(s) trouvé(s) en ${
        result.took || 0
      }ms`;
    }

    // Pour d'autres types de requêtes (comme _count, _mapping, etc.)
    return `Requête exécutée en ${result.took || 0}ms`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Requête Elasticsearch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="es-endpoint">Endpoint</Label>
                <Select value={endpoint} onValueChange={setEndpoint}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Sélectionner un endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_search">_search (Recherche)</SelectItem>
                    <SelectItem value="_count">_count (Comptage)</SelectItem>
                    <SelectItem value="_mapping">
                      _mapping (Structure)
                    </SelectItem>
                    <SelectItem value="_analyze">
                      _analyze (Analyse de texte)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Label htmlFor="es-query">Requête JSON</Label>
              <Textarea
                id="es-query"
                placeholder='{"query": {"match_all": {}}}'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="font-mono h-40"
              />
              <p className="text-xs text-muted-foreground">
                Entrez une requête Elasticsearch au format JSON pour l'endpoint{" "}
                {endpoint}.
              </p>
            </div>

            <Button onClick={executeQuery} disabled={loading || !query.trim()}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exécution...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Exécuter la requête
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-medium">Résultat</h3>
                <div className="bg-muted p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-sm">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Database className="h-4 w-4 mr-2" />
                  {formatResultSize(result)}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
