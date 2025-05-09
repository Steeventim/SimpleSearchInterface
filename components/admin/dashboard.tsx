"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileManager } from "@/components/admin/file-manager";
import { SearchStats } from "@/components/admin/search-stats";
import { ElasticsearchManager } from "@/components/admin/elasticsearch-manager";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("files");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord d'administration</h1>

        <Button variant="outline" asChild>
          <Link href="/admin/logs">
            <FileText className="h-4 w-4 mr-2" />
            Voir les logs
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="files" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files">Gestionnaire de fichiers</TabsTrigger>
          <TabsTrigger value="search">Statistiques de recherche</TabsTrigger>
          <TabsTrigger value="elasticsearch">Elasticsearch</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="mt-6">
          <FileManager />
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <SearchStats />
        </TabsContent>

        <TabsContent value="elasticsearch" className="mt-6">
          <ElasticsearchManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
