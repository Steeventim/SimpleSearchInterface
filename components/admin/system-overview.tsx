"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Database,
  Search,
  HardDrive,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface SystemStatus {
  elasticsearch: {
    connected: boolean;
    cluster_name?: string;
    status?: string;
    documents?: number;
    error?: string;
  };
  database: {
    connected: boolean;
    error?: string;
  };
  storage: {
    uploads_path: string;
    exists: boolean;
    file_count: number;
    total_size_mb: number;
  };
  search_stats: {
    total_searches: number;
    unique_terms: number;
    top_searches: Array<{ term: string; count: number }>;
  };
  timestamp: string;
}

export function SystemOverview() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/status", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error("Error fetching status:", err);
      setError(err.message || "Impossible de charger le statut système");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Auto-refresh every 10 seconds if enabled
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchStatus, 10000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const getStatusBadge = (connected: boolean, status?: string) => {
    if (!connected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          Déconnecté
        </Badge>
      );
    }

    if (status === "red") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Critique
        </Badge>
      );
    }

    if (status === "yellow") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-500 text-white">
          <AlertCircle className="h-3 w-3" />
          Avertissement
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Opérationnel
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Statut du système
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Pause" : "Auto-refresh"}
            </Button>
            <Button
              onClick={fetchStatus}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {status && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Elasticsearch */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="font-medium">Elasticsearch</span>
                    </div>
                    {getStatusBadge(
                      status.elasticsearch.connected,
                      status.elasticsearch.status
                    )}
                  </div>
                  {status.elasticsearch.connected ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Cluster: {status.elasticsearch.cluster_name || "N/A"}</p>
                      <p className="font-medium text-foreground text-lg">
                        {status.elasticsearch.documents?.toLocaleString() || 0} documents
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">
                      {status.elasticsearch.error || "Non connecté"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Database */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      <span className="font-medium">Base de données</span>
                    </div>
                    {getStatusBadge(status.database.connected)}
                  </div>
                  {status.database.connected ? (
                    <p className="text-sm text-muted-foreground">
                      PostgreSQL connecté
                    </p>
                  ) : (
                    <p className="text-sm text-destructive">
                      {status.database.error || "Non connecté"}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Storage */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-5 w-5 text-primary" />
                      <span className="font-medium">Stockage</span>
                    </div>
                    {getStatusBadge(status.storage.exists)}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground text-lg">
                      {status.storage.file_count} fichiers
                    </p>
                    <p>{status.storage.total_size_mb} MB utilisés</p>
                  </div>
                </CardContent>
              </Card>

              {/* Search Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Search className="h-5 w-5 text-primary" />
                      <span className="font-medium">Recherches</span>
                    </div>
                    <Badge variant="secondary">
                      {status.search_stats.total_searches} total
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground text-lg">
                      {status.search_stats.unique_terms} termes uniques
                    </p>
                    {status.search_stats.top_searches.length > 0 && (
                      <p>Top: "{status.search_stats.top_searches[0]?.term}"</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Searches Section */}
          {status && status.search_stats.top_searches.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recherches populaires
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {status.search_stats.top_searches.slice(0, 10).map((search, index) => (
                  <div
                    key={search.term}
                    className="p-3 bg-muted rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm truncate" title={search.term}>
                      {index + 1}. {search.term}
                    </span>
                    <Badge variant="outline" className="ml-2 shrink-0">
                      {search.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status && (
            <p className="text-xs text-muted-foreground mt-4">
              Dernière mise à jour: {new Date(status.timestamp).toLocaleString()}
              {autoRefresh && " (auto-refresh actif)"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
