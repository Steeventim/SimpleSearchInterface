"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileManager } from "@/components/admin/file-manager";
import { SearchStats } from "@/components/admin/search-stats";
import { ElasticsearchManager } from "@/components/admin/elasticsearch-manager";
import { SearchLibrary } from "@/components/admin/search-library";
import { SystemOverview } from "@/components/admin/system-overview";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { Button } from "@/components/ui/button";
import { UserInfo } from "@/components/user-info";
import { ThemeToggle } from "@/components/theme-toggle";
import { FileText, BarChart3, Activity, Database, Search, FolderOpen, BookOpen, Home } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("analytics");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Administration CENADI</h1>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Recherche
            </Button>
          </Link>
          <UserInfo />
          <ThemeToggle />
        </div>
      </div>
      <Tabs defaultValue="analytics" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList className="grid grid-cols-4 sm:grid-cols-7 w-full sm:w-auto">
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="gap-1.5">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Système</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Fichiers</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Stats recherche</span>
            </TabsTrigger>
            <TabsTrigger value="library" className="gap-1.5">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Bibliothèque</span>
            </TabsTrigger>
            <TabsTrigger value="elasticsearch" className="gap-1.5">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Elasticsearch</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5" asChild>
              <Link href="/admin/logs">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Logs</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="overview" className="mt-0">
          <SystemOverview />
        </TabsContent>

        <TabsContent value="files" className="mt-0">
          <FileManager />
        </TabsContent>

        <TabsContent value="search" className="mt-0">
          <SearchStats />
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          <SearchLibrary />
        </TabsContent>

        <TabsContent value="elasticsearch" className="mt-0">
          <ElasticsearchManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
