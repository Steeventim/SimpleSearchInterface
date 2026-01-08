"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  ArrowLeft, 
  Calendar,
  FileText,
  Upload,
  Search
} from "lucide-react";
import { DivisionNames, UserRole } from "@/lib/user-roles";
import Link from "next/link";

interface UserStats {
  documentsUploaded: number;
  searchesPerformed: number;
  documentsViewed: number;
  lastActivity: string | null;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/user/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchStats();
    }
  }, [session]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user as any;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const getRoleBadge = (role: string) => {
    switch (role) {
      case UserRole.CENADI_DIRECTOR:
        return { label: "Directeur Général", variant: "default" as const };
      case UserRole.DIVISION_DIRECTOR:
        return { label: "Directeur de Division", variant: "secondary" as const };
      case UserRole.DIVISION_SECRETARY:
        return { label: "Secrétaire de Division", variant: "outline" as const };
      case "ADMIN":
        return { label: "Administrateur", variant: "destructive" as const };
      case "DIVISION_HEAD":
        return { label: "Chef de Division", variant: "secondary" as const };
      case "USER":
        return { label: "Utilisateur", variant: "outline" as const };
      default:
        return { label: role, variant: "outline" as const };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos informations et consultez vos statistiques
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 border-4 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-xl font-semibold">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <Badge className="mt-3" variant={roleInfo.variant}>
                  {roleInfo.label}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Vos informations de compte
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    Nom complet
                  </div>
                  <p className="font-medium">{user.name || "Non renseigné"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </div>
                  <p className="font-medium">{user.email}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Shield className="mr-2 h-4 w-4" />
                    Rôle
                  </div>
                  <p className="font-medium">{roleInfo.label}</p>
                </div>

                {user.division && (
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="mr-2 h-4 w-4" />
                      Division
                    </div>
                    <p className="font-medium">
                      {DivisionNames[user.division as keyof typeof DivisionNames] || user.division}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Mes statistiques</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Upload className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "-" : stats?.documentsUploaded || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Documents uploadés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Search className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "-" : stats?.searchesPerformed || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Recherches effectuées</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {loading ? "-" : stats?.documentsViewed || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Documents consultés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {loading ? "-" : stats?.lastActivity 
                        ? new Date(stats.lastActivity).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : "Aucune"
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Dernière activité</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Permissions Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissions
            </CardTitle>
            <CardDescription>
              Vos droits d'accès dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(user.role === "ADMIN" || user.role === UserRole.CENADI_DIRECTOR) && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Accès à tous les documents de toutes les divisions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Accès au panneau d'administration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Gestion des utilisateurs</span>
                  </div>
                </>
              )}
              {user.role === "DIVISION_HEAD" && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Accès aux documents de votre division ({user.division})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Upload de documents dans votre division</span>
                  </div>
                </>
              )}
              {user.role === "USER" && (
                <>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Accès aux documents de votre division ({user.division})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-500">✓</Badge>
                    <span>Recherche dans les documents de votre division</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
