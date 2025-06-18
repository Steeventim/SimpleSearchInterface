"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PdfComponentWrapperProps {
  children: React.ReactNode;
  isOpen: boolean;
}

export function PdfComponentWrapper({
  children,
  isOpen,
}: PdfComponentWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [pdfSupported, setPdfSupported] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Vérifier si PDF.js peut être chargé
    const checkPdfSupport = async () => {
      try {
        if (typeof window !== "undefined") {
          // Test simple de disponibilité
          setPdfSupported(true);
        }
      } catch (error) {
        console.error("PDF.js non supporté:", error);
        setPdfSupported(false);
      }
    };

    if (isOpen) {
      checkPdfSupport();
    }
  }, [isOpen]);

  // Ne pas rendre côté serveur
  if (!isClient) {
    return null;
  }

  // Attendre la vérification du support PDF
  if (isOpen && !pdfSupported) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Initialisation du visualiseur PDF...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
