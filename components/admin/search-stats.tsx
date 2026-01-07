"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SearchStat {
  term: string;
  count: number;
  lastSearched: string;
}

export function SearchStats() {
  const [stats, setStats] = useState<SearchStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);

  const loadStats = async () => {
    setLoading(true);
    setError(null);

    try {
      // Appeler l'API pour récupérer les statistiques réelles
      const response = await fetch("/api/search-stats");

      if (!response.ok) {
        throw new Error(
          `Erreur ${response.status}: Impossible de récupérer les statistiques`
        );
      }

      const data = await response.json();

      if (data.stats && Array.isArray(data.stats)) {
        setStats(data.stats);
      } else {
        console.warn(
          "Format de données inattendu, aucune statistique disponible"
        );
        setStats([]);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
      setError("Impossible de charger les statistiques de recherche");
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  const resetStats = async () => {
    setResetLoading(true);

    try {
      const response = await fetch("/api/search-stats/reset", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          `Erreur ${response.status}: Impossible de réinitialiser les statistiques`
        );
      }

      // Recharger les statistiques
      await loadStats();
    } catch (err) {
      console.error(
        "Erreur lors de la réinitialisation des statistiques:",
        err
      );
      setError("Impossible de réinitialiser les statistiques");
    } finally {
      setResetLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  // Trouver la valeur maximale pour calculer les pourcentages
  const maxCount = Math.max(...stats.map((stat) => stat.count), 1);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Termes de recherche populaires</CardTitle>
          <div className="flex gap-2">
            <Button
              onClick={loadStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Réinitialiser les statistiques
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir réinitialiser toutes les
                    statistiques de recherche ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetStats}
                    disabled={resetLoading}
                  >
                    {resetLoading ? "Réinitialisation..." : "Réinitialiser"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : stats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune statistique de recherche disponible.
              <p className="text-sm mt-2">
                Effectuez quelques recherches pour voir apparaître des
                statistiques.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {stats.map((stat) => (
                <div key={stat.term} className="flex items-center">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{stat.term}</div>
                    <div className="text-xs text-muted-foreground">
                      Dernière recherche:{" "}
                      {new Date(stat.lastSearched).toLocaleString()}
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <div className="text-lg font-bold">{stat.count}</div>
                    <div className="text-xs text-muted-foreground">
                      recherches
                    </div>
                  </div>
                  <div className="w-full max-w-md ml-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(
                            100,
                            (stat.count / maxCount) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
