import fs from "fs";
import path from "path";

export function initUploadDirectory() {
  try {
    // Récupérer le répertoire d'upload depuis les variables d'environnement
    const uploadDir = process.env.UPLOAD_DIRECTORY || "./uploads";
    console.log(`Initialisation du répertoire d'upload: ${uploadDir}`);

    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      console.log(`Création du répertoire d'upload: ${uploadDir}`);
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Vérifier les permissions
    try {
      const testFilePath = path.join(uploadDir, ".test-write-access");
      fs.writeFileSync(testFilePath, "test");
      fs.unlinkSync(testFilePath);
      console.log(
        `Le répertoire d'upload ${uploadDir} est accessible en écriture`
      );

      /* Removing generic sub-directory creation as per user request for clean root */
    } catch (error) {
      console.error(
        `Le répertoire d'upload ${uploadDir} n'est pas accessible en écriture:`,
        error
      );
    }

    return uploadDir;
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation du répertoire d'upload:",
      error
    );
    return null;
  }
}
