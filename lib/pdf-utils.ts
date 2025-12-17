import React from "react";

// Utilitaire pour initialiser PDF.js de manière sécurisée
let pdfModule: any = null;
let initializationPromise: Promise<any> | null = null;

export const initializePdfjs = async () => {
  if (typeof window === "undefined") {
    return null; // Ne pas initialiser côté serveur
  }

  // Si déjà initialisé, retourner le module
  if (pdfModule) {
    return pdfModule;
  }

  // Si une initialisation est en cours, attendre qu'elle se termine
  if (initializationPromise) {
    return initializationPromise;
  }

  // Démarrer l'initialisation
  initializationPromise = (async () => {
    try {
      console.log("🔄 Initialisation PDF.js...");

      const pdfjs = await import("pdfjs-dist");

      // Configuration du worker avec fallback
      const workerSrc = "/pdf.worker.mjs";

      // Vérifier si le worker local est disponible
      try {
        const response = await fetch(workerSrc, { method: "HEAD" });
        if (response.ok) {
          pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
          console.log("✅ PDF.js worker local configuré");
        } else {
          throw new Error("Worker local non disponible");
        }
      } catch (error) {
        // Fallback vers CDN
        const cdnWorkerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
        pdfjs.GlobalWorkerOptions.workerSrc = cdnWorkerSrc;
        console.log("⚠️ Fallback vers worker CDN");
      }

      pdfModule = pdfjs;
      return pdfjs;
    } catch (error) {
      console.error("❌ Erreur d'initialisation PDF.js:", error);
      initializationPromise = null; // Réinitialiser pour permettre un nouvel essai
      throw error;
    }
  })();

  return initializationPromise;
};

// Hook React pour utiliser PDF.js
export const usePdfjs = () => {
  const [pdfjs, setPdfjs] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;

      setLoading(true);
      setError(null);

      try {
        const module = await initializePdfjs();
        setPdfjs(module);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur PDF.js");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  return { pdfjs, loading, error };
};
