// Fonction pour supprimer un fichier de l'index (Version Client)
export async function removeFileFromIndex(fileName: string) {
    try {
        // Appeler l'API pour supprimer le fichier de l'index
        const response = await fetch("/api/remove-file-index", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileName }),
        });

        if (!response.ok) {
            throw new Error(
                `Erreur lors de la suppression du fichier de l'index: ${await response.text()}`
            );
        }

        const result = await response.json();
        return result.success;
    } catch (error) {
        console.error(
            `Erreur lors de la suppression du fichier de l'index: ${error}`
        );
        throw error;
    }
}
