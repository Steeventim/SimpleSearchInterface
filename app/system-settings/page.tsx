"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Users,
  Shield,
  Database,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Key,
  Activity,
  Server,
} from "lucide-react";

export default function SystemSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    // Vérifier les permissions (Admin uniquement)
    const userLevel = session.user?.roleLevel || 1;
    if (userLevel < 4) {
      router.push("/unauthorized");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Chargement...
      </div>
    );
  }

  if (!session || (session.user?.roleLevel || 1) < 4) {
    return null;
  }

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
                  Administration Système
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">
                  Gestion des paramètres et configuration du système
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200"
              >
                ADMIN
              </Badge>
            </div>
          </div>

          {/* Navigation des sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Gestion Utilisateurs
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Gérer les comptes et permissions
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Database className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Base de Données
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Configuration Elasticsearch
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Sécurité
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Contrôles d'accès et audit
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Server className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Système
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  Paramètres et maintenance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gestion des utilisateurs */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Utilisateurs Actifs
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter utilisateur
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    name: "Jean Dupont",
                    role: "EMPLOYEE",
                    email: "employee@example.com",
                    status: "Actif",
                  },
                  {
                    name: "Marie Martin",
                    role: "MANAGER",
                    email: "manager@example.com",
                    status: "Actif",
                  },
                  {
                    name: "Pierre Durand",
                    role: "DIRECTOR",
                    email: "director@example.com",
                    status: "Actif",
                  },
                  {
                    name: "Sophie Admin",
                    role: "ADMIN",
                    email: "admin@example.com",
                    status: "Actif",
                  },
                ].map((user, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge
                        variant="secondary"
                        className="text-green-700 bg-green-100"
                      >
                        {user.status}
                      </Badge>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={user.role === "ADMIN"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Configuration système */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>Indexation automatique</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Activée
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>Logs détaillés</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Activés
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>Sauvegarde quotidienne</span>
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700"
                  >
                    Activée
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span>Authentification 2FA</span>
                  <Badge variant="outline">Bientôt disponible</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Activité Récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      action: "Connexion utilisateur",
                      user: "Marie Martin",
                      time: "Il y a 5 min",
                    },
                    {
                      action: "Recherche effectuée",
                      user: "Jean Dupont",
                      time: "Il y a 12 min",
                    },
                    {
                      action: "Document indexé",
                      user: "Système",
                      time: "Il y a 1h",
                    },
                    {
                      action: "Sauvegarde complétée",
                      user: "Système",
                      time: "Il y a 3h",
                    },
                    {
                      action: "Maintenance système",
                      user: "Sophie Admin",
                      time: "Il y a 6h",
                    },
                  ].map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {activity.action}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          {activity.user}
                        </p>
                      </div>
                      <span className="text-slate-500 text-xs">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <div className="mt-8 flex justify-end space-x-4">
            <Button variant="outline">
              <Key className="h-4 w-4 mr-2" />
              Régénérer clés API
            </Button>
            <Button variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Réindexer documents
            </Button>
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              Voir tous les logs
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
