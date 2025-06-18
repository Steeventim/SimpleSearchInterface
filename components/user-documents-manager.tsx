"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  FileText,
  Trash2,
  Download,
  Eye,
  Calendar,
  HardDrive,
  RefreshCw,
  FolderOpen,
} from "lucide-react";

interface UserDocument {
  id: string;
  title: string;
  fileName?: string;
  fileSize?: number;
  type: string;
  date: string;
  filePath?: string;
  url?: string;
}

export function UserDocumentsManager() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Charger les documents de l'utilisateur
  const loadUserDocuments = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user-documents");

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }

      const data = await response.json();
      setDocuments(data.results || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Erreur chargement documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un document
  const deleteDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await fetch(`/api/user-documents?id=${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Document supprimé",
        description: `${fileName} a été supprimé avec succès`,
      });

      // Recharger la liste
      loadUserDocuments();
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le document",
        variant: "destructive",
      });
    }
  };

  // Formater la taille de fichier
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Taille inconnue";
    const sizes = ["octets", "Ko", "Mo", "Go"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Date inconnue";
    }
  };

  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (type: string, fileName?: string) => {
    const extension = fileName?.split(".").pop()?.toLowerCase();

    if (
      type === "document" ||
      ["pdf", "doc", "docx", "rtf", "odt"].includes(extension || "")
    ) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }

    return <FileText className="h-8 w-8 text-blue-600" />;
  };

  useEffect(() => {
    loadUserDocuments();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-slate-600">
          Chargement de vos documents...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mes Documents
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {total} document{total > 1 ? "s" : ""} uploadé{total > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={loadUserDocuments} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Liste des documents */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Aucun document
            </h3>
            <p className="text-slate-600 dark:text-slate-400 text-center">
              Vous n'avez pas encore uploadé de documents.
              <br />
              Utilisez l'onglet "Ajouter des documents" pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  {getFileIcon(doc.type, doc.fileName)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {doc.fileName || doc.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {doc.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {formatFileSize(doc.fileSize)}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(doc.date)}
                  </div>
                </div>

                <div className="flex items-center space-x-2 mt-4">
                  {doc.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Voir
                    </Button>
                  )}

                  {doc.filePath && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Créer un lien de téléchargement
                        const link = document.createElement("a");
                        link.href = doc.url || doc.filePath;
                        link.download = doc.fileName || "document";
                        link.click();
                      }}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Télécharger
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer le document
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer "
                          {doc.fileName || doc.title}" ? Cette action est
                          irréversible.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteDocument(doc.id, doc.fileName || doc.title)
                          }
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
