"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Download } from "lucide-react";

interface Log {
  timestamp: string;
  type: "search" | "upload" | "error";
  message: string;
  details?: any;
}

export function LogsViewer() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [logType, setLogType] = useState<string>("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = logType === "all" ? "/api/logs" : `/api/logs?type=${logType}`;

      const response = await fetch(url);
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Rafraîchir les logs toutes les 30 secondes
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [logType]);

  const downloadLogs = () => {
    const jsonString = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${logType}-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Logs du système</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={logType} onValueChange={setLogType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type de logs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les logs</SelectItem>
              <SelectItem value="search">Recherche</SelectItem>
              <SelectItem value="upload">Upload</SelectItem>
              <SelectItem value="error">Erreurs</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>

          <Button
            variant="outline"
            onClick={downloadLogs}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun log disponible
          </div>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-auto">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-3 rounded-md text-sm font-mono whitespace-pre-wrap ${
                  log.type === "error"
                    ? "bg-destructive/10 text-destructive"
                    : log.type === "search"
                    ? "bg-blue-100 dark:bg-blue-900/20"
                    : "bg-green-100 dark:bg-green-900/20"
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{log.type.toUpperCase()}</span>
                  <span className="text-xs opacity-70">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>{log.message}</div>
                {log.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">
                      Détails
                    </summary>
                    <pre className="mt-1 text-xs overflow-auto p-2 bg-black/5 dark:bg-white/5 rounded">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
