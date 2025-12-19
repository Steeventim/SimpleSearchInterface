"use client";

import { UserDocumentsManager } from "@/components/user-documents-manager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DocumentsPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold">Ma Bibliothèque (Division)</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </div>

            <main className="container mx-auto px-4 py-8">
                <UserDocumentsManager />
            </main>
        </div>
    );
}
