import type React from "react";
import type { Metadata } from "next";
// Supprimer l'import Google Fonts pour éviter les timeouts
// import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { initUploadDirectory } from "@/lib/init-upload-dir";

// Initialiser le répertoire d'upload au démarrage du serveur
if (typeof window === "undefined") {
  initUploadDirectory();
}

// Supprimer l'utilisation d'Inter
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Moteur de Recherche Intelligent",
  description:
    "Interface utilisateur moderne et responsive pour un moteur de recherche intelligent",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
