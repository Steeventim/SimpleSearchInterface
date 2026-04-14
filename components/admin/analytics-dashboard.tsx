"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  ResponsiveContainer,
} from "recharts";
import {
  RefreshCw,
  Users,
  Search,
  Database,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Activity,
  FileText,
  Shield,
  Clock,
  BarChart3,
  Globe,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Upload,
  Trash2,
  LogIn,
  LogOut,
  Settings,
  UserPlus,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  users: {
    total: number;
    byRole: { role: string; count: number }[];
    byDivision: { division: string; count: number }[];
    recentUsers: {
      id: string;
      name: string | null;
      email: string;
      role: string;
      division: string | null;
      createdAt: string;
    }[];
  };
  searchHistory: {
    total: number;
    today: number;
    week: number;
    month: number;
    avgResultsPerSearch: number;
    topQueries: { query: string; count: number }[];
  };
  recentActivity: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    user: { name: string | null; email: string; division: string | null };
  }[];
  searchTrends: { date: string; count: number }[];
  elasticsearch: {
    healthy: boolean;
    status: string;
    clusterName: string;
    nodeCount: number;
    documentCount: number;
    indexSizeMB: number;
  };
  storage: {
    totalFiles: number;
    totalSizeMB: number;
    byDivision: { division: string; files: number; sizeMB: number }[];
  };
  searchStats: {
    terms: { term: string; count: number }[];
    totalSearches: number;
    uniqueTerms: number;
  };
  generatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DIVISION_COLORS: Record<string, string> = {
  DEP: "hsl(221, 83%, 53%)",
  DEL: "hsl(142, 71%, 45%)",
  DTB: "hsl(38, 92%, 50%)",
  DIRE: "hsl(262, 83%, 58%)",
  DAAF: "hsl(0, 84%, 60%)",
};

const DIVISION_LABELS: Record<string, string> = {
  DEP: "Études & Projets",
  DEL: "Exploitation & Logiciels",
  DTB: "Téléinformatique & Bureautique",
  DIRE: "Informatique Recherche",
  DAAF: "Affaires Admin. & Financières",
};

const ROLE_LABELS: Record<string, string> = {
  CENADI_DIRECTOR: "Directeur CENADI",
  DIVISION_DIRECTOR: "Chef de Division",
  DIVISION_SECRETARY: "Secrétaire",
};

const ACTIVITY_ICONS: Record<string, any> = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  SEARCH: Search,
  DOCUMENT_VIEW: Eye,
  DOCUMENT_UPLOAD: Upload,
  DOCUMENT_DELETE: Trash2,
  USER_CREATE: UserPlus,
  USER_UPDATE: Users,
  USER_DELETE: Trash2,
  SETTINGS_CHANGE: Settings,
};

const PIE_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(262, 83%, 58%)",
  "hsl(0, 84%, 60%)",
];

// ─── Main Component ──────────────────────────────────────────────────────────

export function AnalyticsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Non authentifié");
        if (res.status === 403) throw new Error("Accès réservé aux administrateurs");
        throw new Error(`Erreur ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || "Impossible de charger le tableau de bord");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erreur</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchDashboard}>Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Tableau de bord analytique
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d&apos;ensemble du système CENADI
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Mis à jour {lastRefresh.toLocaleTimeString("fr-FR")}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Utilisateurs"
          value={data.users.total}
          icon={Users}
          description={`${data.users.byRole.find((r) => r.role === "CENADI_DIRECTOR")?.count || 0} administrateurs`}
          color="blue"
        />
        <KPICard
          title="Recherches totales"
          value={data.searchHistory.total}
          icon={Search}
          description={`${data.searchHistory.today} aujourd'hui`}
          trend={data.searchHistory.today > 0 ? "up" : undefined}
          color="green"
        />
        <KPICard
          title="Documents indexés"
          value={data.elasticsearch.documentCount}
          icon={Database}
          description={`${data.elasticsearch.indexSizeMB} MB d'index`}
          color="purple"
        />
        <KPICard
          title="Fichiers stockés"
          value={data.storage.totalFiles}
          icon={HardDrive}
          description={`${data.storage.totalSizeMB} MB total`}
          color="orange"
        />
      </div>

      {/* Service Health Bar */}
      <ServiceHealthBar elasticsearch={data.elasticsearch} />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Recherches
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activité
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="search" className="space-y-4">
          <SearchTab data={data} />
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <UsersTab data={data} />
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <ActivityTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  description: string;
  trend?: "up" | "down";
  color: "blue" | "green" | "purple" | "orange";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20",
    purple: "from-violet-500/10 to-violet-600/5 border-violet-500/20",
    orange: "from-amber-500/10 to-amber-600/5 border-amber-500/20",
  };
  const iconColorMap = {
    blue: "text-blue-500",
    green: "text-emerald-500",
    purple: "text-violet-500",
    orange: "text-amber-500",
  };

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color]} border`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">
                {value.toLocaleString("fr-FR")}
              </p>
              {trend === "up" && (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className={`p-3 rounded-xl bg-background/50 ${iconColorMap[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Service Health Bar ──────────────────────────────────────────────────────

function ServiceHealthBar({
  elasticsearch,
}: {
  elasticsearch: DashboardData["elasticsearch"];
}) {
  const services = [
    {
      name: "Elasticsearch",
      status: elasticsearch.healthy ? (elasticsearch.status === "green" ? "healthy" : "warning") : "error",
      detail: `${elasticsearch.documentCount.toLocaleString()} docs | ${elasticsearch.status}`,
    },
    {
      name: "PostgreSQL",
      status: "healthy" as const,
      detail: "Connecté",
    },
    {
      name: "Application",
      status: "healthy" as const,
      detail: "En ligne",
    },
  ];

  return (
    <Card>
      <CardContent className="py-3 px-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Zap className="h-4 w-4" />
            Services
          </div>
          <Separator orientation="vertical" className="h-6" />
          {services.map((svc) => (
            <div key={svc.name} className="flex items-center gap-2">
              {svc.status === "healthy" && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              )}
              {svc.status === "warning" && (
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              )}
              {svc.status === "error" && (
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              )}
              <span className="text-sm font-medium">{svc.name}</span>
              <span className="text-xs text-muted-foreground">{svc.detail}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: DashboardData }) {
  const trendConfig: ChartConfig = {
    count: { label: "Recherches", color: "hsl(221, 83%, 53%)" },
  };

  const storageConfig: ChartConfig = {};
  data.storage.byDivision.forEach((d) => {
    storageConfig[d.division] = {
      label: DIVISION_LABELS[d.division] || d.division,
      color: DIVISION_COLORS[d.division] || "#888",
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Search Trends Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendances des recherches (30 jours)
          </CardTitle>
          <CardDescription>
            Nombre de recherches par jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={trendConfig} className="h-[280px] w-full">
            <AreaChart data={data.searchTrends}>
              <defs>
                <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getDate()}/${d.getMonth() + 1}`;
                }}
                className="text-xs"
              />
              <YAxis className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(221, 83%, 53%)"
                strokeWidth={2}
                fill="url(#searchGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Documents by Division */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichiers par division
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.storage.byDivision.map((d) => {
              const maxFiles = Math.max(...data.storage.byDivision.map((x) => x.files), 1);
              const pct = (d.files / maxFiles) * 100;
              return (
                <div key={d.division} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: DIVISION_COLORS[d.division] }}
                      />
                      <span className="font-medium">{d.division}</span>
                      <span className="text-muted-foreground text-xs">
                        {DIVISION_LABELS[d.division]}
                      </span>
                    </div>
                    <span className="font-mono text-muted-foreground">
                      {d.files} fichiers ({d.sizeMB} MB)
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Termes les plus recherchés
          </CardTitle>
          <CardDescription>Depuis le début</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ count: { label: "Recherches", color: "hsl(142, 71%, 45%)" } }}
            className="h-[260px] w-full"
          >
            <BarChart
              data={data.searchStats.terms.slice(0, 8)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" className="text-xs" />
              <YAxis
                dataKey="term"
                type="category"
                width={90}
                className="text-xs"
                tickFormatter={(v) => (v.length > 12 ? v.slice(0, 12) + "…" : v)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="hsl(142, 71%, 45%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Search Tab ──────────────────────────────────────────────────────────────

function SearchTab({ data }: { data: DashboardData }) {
  const { searchHistory, searchStats } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Search KPI Row */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Aujourd&apos;hui</p>
            <p className="text-4xl font-bold text-blue-500">{searchHistory.today}</p>
            <p className="text-xs text-muted-foreground mt-1">recherches</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Cette semaine</p>
            <p className="text-4xl font-bold text-emerald-500">{searchHistory.week}</p>
            <p className="text-xs text-muted-foreground mt-1">recherches</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Ce mois</p>
            <p className="text-4xl font-bold text-violet-500">{searchHistory.month}</p>
            <p className="text-xs text-muted-foreground mt-1">recherches</p>
          </div>
        </CardContent>
      </Card>

      {/* Top Queries by DB */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Requêtes fréquentes (historique utilisateur)</CardTitle>
          <CardDescription>Basé sur l&apos;historique de recherche des utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          {searchHistory.topQueries.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              Aucune recherche enregistrée pour le moment.
            </p>
          ) : (
            <div className="space-y-3">
              {searchHistory.topQueries.map((q, i) => {
                const max = searchHistory.topQueries[0]?.count || 1;
                return (
                  <div key={q.query} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6 text-right">
                      {i + 1}.
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{q.query}</span>
                        <Badge variant="secondary">{q.count}x</Badge>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(q.count / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Statistiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total recherches</span>
            <span className="font-bold">{searchHistory.total}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Résultats moyens</span>
            <span className="font-bold">{searchHistory.avgResultsPerSearch}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Termes uniques (stats)</span>
            <span className="font-bold">{searchStats.uniqueTerms}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Recherches (stats fichier)</span>
            <span className="font-bold">{searchStats.totalSearches}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────

function UsersTab({ data }: { data: DashboardData }) {
  const divisionChartConfig: ChartConfig = {};
  data.users.byDivision.forEach((d) => {
    divisionChartConfig[d.division] = {
      label: d.division,
      color: DIVISION_COLORS[d.division] || "#888",
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Roles Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Répartition par rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.users.byRole.map((r) => (
              <div key={r.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      r.role === "CENADI_DIRECTOR"
                        ? "default"
                        : r.role === "DIVISION_DIRECTOR"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {ROLE_LABELS[r.role] || r.role}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{r.count}</span>
                  <span className="text-sm text-muted-foreground">
                    ({Math.round((r.count / data.users.total) * 100)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Division Distribution Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Répartition par division
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.users.byDivision.length > 0 ? (
            <ChartContainer config={divisionChartConfig} className="h-[250px] w-full">
              <PieChart>
                <Pie
                  data={data.users.byDivision}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="division"
                  label={({ division, count }) => `${division} (${count})`}
                  labelLine={false}
                >
                  {data.users.byDivision.map((d, i) => (
                    <Cell
                      key={d.division}
                      fill={DIVISION_COLORS[d.division] || PIE_COLORS[i % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée de division
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Users Table */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Derniers utilisateurs inscrits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Inscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "CENADI_DIRECTOR"
                          ? "default"
                          : user.role === "DIVISION_DIRECTOR"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {ROLE_LABELS[user.role] || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.division ? (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: DIVISION_COLORS[user.division],
                          color: DIVISION_COLORS[user.division],
                        }}
                      >
                        {user.division}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────────────────────

function ActivityTab({ data }: { data: DashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activité récente
        </CardTitle>
        <CardDescription>Les 20 dernières actions enregistrées</CardDescription>
      </CardHeader>
      <CardContent>
        {data.recentActivity.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>Aucune activité enregistrée pour le moment.</p>
            <p className="text-xs mt-1">
              Les actions des utilisateurs apparaîtront ici.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-1">
              {data.recentActivity.map((activity) => {
                const IconComponent = ACTIVITY_ICONS[activity.type] || Activity;
                const isDestructive = activity.type.includes("DELETE");
                const isAuth = activity.type === "LOGIN" || activity.type === "LOGOUT";

                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isDestructive
                          ? "bg-red-500/10 text-red-500"
                          : isAuth
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.user.name || activity.user.email}
                        </span>
                        {activity.user.division && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1">
                            {activity.user.division}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {formatRelativeTime(activity.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-muted rounded-lg w-80" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-8 bg-muted rounded w-16 mb-2" />
              <div className="h-3 bg-muted rounded w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="h-4 bg-muted rounded w-48" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="h-[280px] bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR");
}
