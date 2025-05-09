"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Search, Download, RefreshCw } from "lucide-react";
import { DirectorySelector } from "@/components/directory-selector";
import { FilePreview } from "@/components/file-preview";
// import { removeFileFromIndex } from "@/lib/file-indexer"

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: string;
}

export function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [directory, setDirectory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Charger les fichiers
  const loadFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/files?directory=${encodeURIComponent(directory)}`
      );
      if (!response.ok)
        throw new Error("Erreur lors du chargement des fichiers");
      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les fichiers au chargement et quand le répertoire change
  useEffect(() => {
    loadFiles();
  }, [directory]);

  // Filtrer les fichiers selon le terme de recherche
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Supprimer un fichier
  const deleteFile = async (filePath: string, fileName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${fileName} ?`)) return;

    try {
      const response = await fetch(
        `/api/files?path=${encodeURIComponent(filePath)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok)
        throw new Error("Erreur lors de la suppression du fichier");

      // Supprimer également de l'index Elasticsearch
      // await removeFileFromIndex(fileName)

      // Recharger la liste des fichiers
      loadFiles();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression du fichier");
    }
  };

  // Prévisualiser un fichier
  const previewFile = async (filePath: string) => {
    try {
      const response = await fetch(
        `/api/files/content?path=${encodeURIComponent(filePath)}`
      );
      if (!response.ok) throw new Error("Erreur lors du chargement du fichier");

      const blob = await response.blob();
      const file = new File([blob], filePath.split("/").pop() || "file", {
        type: blob.type,
      });

      setSelectedFile(file);
      setIsPreviewOpen(true);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors du chargement du fichier pour prévisualisation");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestionnaire de fichiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <DirectorySelector value={directory} onChange={setDirectory} />
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher des fichiers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={loadFiles} disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Actualiser
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {files.length === 0
                ? "Aucun fichier trouvé dans ce répertoire"
                : "Aucun fichier ne correspond à votre recherche"}
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Date de modification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.path}>
                      <TableCell className="font-medium">{file.name}</TableCell>
                      <TableCell>{file.type || "Inconnu"}</TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {new Date(file.lastModified).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => previewFile(file.path)}
                            title="Prévisualiser"
                          >
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            asChild
                            title="Télécharger"
                          >
                            <a
                              href={`/api/files/content?path=${encodeURIComponent(
                                file.path
                              )}`}
                              download={file.name}
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => deleteFile(file.path, file.name)}
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FilePreview
        file={selectedFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}
