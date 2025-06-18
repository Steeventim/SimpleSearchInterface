"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Search,
  ArrowLeft,
  Eye,
  Clock,
  Download,
  RefreshCw,
  TrendingDown,
} from "lucide-react";

// Types pour les données analytics
interface AnalyticsData {
  totalSearches: number;
  activeUsers: number;
  totalDocuments: number;
  averageSearchTime: number;
  searchTrends: Array<{ date: string; count: number }>;
  popularQueries: Array<{ query: string; count: number }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    searchCount: number;
  }>;
  documentTypes: Array<{ type: string; count: number }>;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // États pour les données analytics
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fonction pour charger les données analytics
  const loadAnalyticsData = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      console.log("📊 Chargement des données analytics...");

      const response = await fetch(`/api/analytics?period=${period}`);

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      setLastUpdate(new Date());

      console.log("✅ Données analytics chargées:", data);

      toast({
        title: "Données mises à jour",
        description: "Les analytics ont été actualisées avec succès",
      });
    } catch (error) {
      console.error("❌ Erreur chargement analytics:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Vérifier les permissions (Manager+)
    const userLevel = session.user?.roleLevel || 1;
    if (userLevel < 2) {
      router.push("/unauthorized");
      return;
    }

    // Charger les données analytics
    loadAnalyticsData();
  }, [session, status, router, period]);

  // Auto-refresh toutes les 30 secondes
  useEffect(() => {
    if (!session || !analyticsData) return;

    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [session, analyticsData]);

  // Fonction pour formater les tendances
  const formatTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      isPositive: change >= 0,
    };
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600 dark:text-slate-400">
            Chargement des analytics...
          </p>
        </div>
      </div>
    );
  }

  if (!session || (session.user?.roleLevel || 1) < 2 || !analyticsData) {
    return null;
  }

  // Calculer les tendances pour l'affichage
  const searchTrend =
    analyticsData.searchTrends.length >= 2
      ? formatTrend(
          analyticsData.searchTrends[analyticsData.searchTrends.length - 1]
            .count,
          analyticsData.searchTrends[analyticsData.searchTrends.length - 2]
            .count
        )
      : { value: 0, isPositive: true };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à la recherche
                </Button>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Analytics en temps réel
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Tableau de bord des statistiques de recherche
                  {lastUpdate && (
                    <span className="block text-sm">
                      Dernière mise à jour : {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                >
                  <option value="7d">7 derniers jours</option>
                  <option value="30d">30 derniers jours</option>
                  <option value="90d">90 derniers jours</option>
                </select>
                <Badge variant="outline">{session.user?.role}</Badge>
              </div>
            </div>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Recherches totales
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.totalSearches.toLocaleString()}
                    </p>
                  </div>
                  <Search className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center mt-4 text-sm">
                  {searchTrend.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                  )}
                  <span
                    className={
                      searchTrend.isPositive ? "text-green-600" : "text-red-600"
                    }
                  >
                    {searchTrend.isPositive ? "+" : "-"}
                    {searchTrend.value.toFixed(1)}%
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-1">
                    vs hier
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Utilisateurs actifs
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.activeUsers}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Période sélectionnée
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Documents indexés
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.totalDocuments.toLocaleString()}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">
                    Base de données actuelle
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      Temps moyen
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {analyticsData.averageSearchTime}ms
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span
                    className={
                      analyticsData.averageSearchTime < 250
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {analyticsData.averageSearchTime < 250
                      ? "Excellent"
                      : "Moyen"}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-1">
                    performance
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques et données détaillées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Tendances de recherche ({period})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.searchTrends.map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <span className="text-sm font-medium">
                        {new Date(trend.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (trend.count /
                                  Math.max(
                                    ...analyticsData.searchTrends.map(
                                      (t) => t.count
                                    )
                                  )) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <Badge variant="secondary">{trend.count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  Requêtes populaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.popularQueries.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400">
                          {index + 1}
                        </div>
                        <span className="font-medium">"{item.query}"</span>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Données supplémentaires */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Activité utilisateurs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.userActivity.map((user, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{user.userName}</span>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{user.searchCount}</Badge>
                        <p className="text-xs text-slate-500 mt-1">
                          recherches
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Types de documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.documentTypes.map((type, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400">
                          {type.type.toUpperCase()}
                        </div>
                        <span className="font-medium">.{type.type}</span>
                      </div>
                      <Badge variant="secondary">{type.count}</Badge>
                    </div>
                  ))}
                  {analyticsData.documentTypes.length === 0 && (
                    <p className="text-center text-slate-500 py-4">
                      Aucun document indexé pour le moment
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-between items-center">
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Données en temps réel</span>
              <span>•</span>
              <span>Mise à jour automatique toutes les 30s</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter les données
              </Button>
              <Button onClick={loadAnalyticsData} disabled={loading}>
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Actualiser
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
