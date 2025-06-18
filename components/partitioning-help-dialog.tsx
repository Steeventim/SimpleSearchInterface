"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  HelpCircle,
  Layers,
  Search,
  BookOpen,
  FileText,
  Zap,
  Target,
  Clock,
} from "lucide-react";

export function PartitioningHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle className="h-4 w-4 mr-2" />
          Aide Partitionnement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Layers className="h-5 w-5" />
            <span>Partitionnement Intelligent des PDF</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Target className="h-5 w-5 text-blue-600" />
                <span>Qu'est-ce que le partitionnement intelligent ?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Le partitionnement intelligent analyse automatiquement vos
                documents PDF pour identifier et afficher uniquement les pages
                les plus pertinentes par rapport à votre recherche.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">Première page</div>
                    <div className="text-xs text-muted-foreground">
                      Contexte du document
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-sm">Contenu trouvé</div>
                    <div className="text-xs text-muted-foreground">
                      Page la plus pertinente
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium text-sm">Dernière page</div>
                    <div className="text-xs text-muted-foreground">
                      Conclusion/résumé
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comment ça marche */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>Comment ça fonctionne ?</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      Analyse du contenu
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Extraction et analyse du texte de toutes les pages du PDF
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-xs font-medium text-green-600 dark:text-green-400 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      Score de pertinence
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Calcul d'un score basé sur le nombre et la qualité des
                      correspondances
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-400 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      Sélection intelligente
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Choix des pages les plus représentatives (première,
                      contenu, dernière)
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center text-xs font-medium text-orange-600 dark:text-orange-400 mt-0.5">
                    4
                  </div>
                  <div>
                    <div className="font-medium text-sm">
                      Optimisation des doublons
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Évite d'afficher la même page plusieurs fois
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scénarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <FileText className="h-5 w-5 text-green-600" />
                <span>Scénarios de partitionnement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">Document 1 page</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Affichage de l'unique page du document
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">Document 2 pages</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Page 1 (première) + Page 2 (contenu ou dernière selon la
                    pertinence)
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline">Document 3+ pages</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Logique complète avec maximum 3 sections :
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>• Page 1 (première) - toujours incluse</div>
                    <div>
                      • Page X (meilleur contenu) - si différente de la première
                      et dernière
                    </div>
                    <div>• Page N (dernière) - si différente des autres</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Avantages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Avantages du partitionnement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Gain de temps</div>
                      <div className="text-xs text-muted-foreground">
                        Focus immédiat sur le contenu pertinent
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">
                        Contexte préservé
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Première et dernière page pour la compréhension globale
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Précision</div>
                      <div className="text-xs text-muted-foreground">
                        Identification automatique du contenu le plus pertinent
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">Efficacité</div>
                      <div className="text-xs text-muted-foreground">
                        Évite de parcourir manuellement tout le document
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">
                        Intelligence adaptative
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Adaptation automatique selon la taille et le contenu
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                    <div>
                      <div className="font-medium text-sm">
                        Navigation intuitive
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Interface claire avec indicateurs visuels
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions d'utilisation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg">
                <HelpCircle className="h-5 w-5 text-indigo-600" />
                <span>Guide d'utilisation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">
                    🔍 Recherche et activation
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      1. Effectuez une recherche avec des termes spécifiques
                    </div>
                    <div>
                      2. Repérez les résultats PDF avec le bouton
                      "Partitionnement intelligent"
                    </div>
                    <div>3. Cliquez sur le bouton pour lancer l'analyse</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">
                    📖 Navigation dans les sections
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      • Utilisez les flèches ← → pour naviguer entre les
                      sections
                    </div>
                    <div>
                      • Cliquez sur les points en bas pour un accès direct
                    </div>
                    <div>
                      • Observez les badges pour comprendre le type de chaque
                      section
                    </div>
                    <div>• Consultez le nombre de correspondances trouvées</div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">
                    📊 Analyse des résultats
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      • Vérifiez le panneau d'analyse pour les détails complets
                    </div>
                    <div>• Nombre total de pages avec contenu trouvé</div>
                    <div>• Page identifiée comme ayant le meilleur score</div>
                    <div>
                      • Type de chaque section (première, contenu, dernière)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
