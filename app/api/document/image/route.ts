// import { NextResponse } from "next/server";
// import { readFile } from "fs/promises";
// import path from "path";

// // Répertoire temporaire pour stocker les images de pages
// const TEMP_DIR = path.join(process.cwd(), "tmp");

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const imageName = searchParams.get("name");

//     if (!imageName) {
//       return NextResponse.json(
//         { error: "Nom d'image non spécifié" },
//         { status: 400 }
//       );
//     }

//     // Vérifier que le nom de fichier est sécurisé (pas de traversée de répertoire)
//     if (
//       imageName.includes("..") ||
//       imageName.includes("/") ||
//       imageName.includes("\\")
//     ) {
//       return NextResponse.json(
//         { error: "Nom de fichier non valide" },
//         { status: 400 }
//       );
//     }

//     // Construire le chemin de l'image
//     const imagePath = path.join(TEMP_DIR, imageName);

//     // Lire l'image
//     const imageBuffer = await readFile(imagePath);

//     // Renvoyer l'image
//     return new NextResponse(imageBuffer, {
//       headers: {
//         "Content-Type": "image/png",
//         "Cache-Control": "public, max-age=300", // Mettre en cache pendant 5 minutes
//       },
//     });
//   } catch (error) {
//     console.error("Document image API error:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération de l'image" },
//       { status: 500 }
//     );
//   }
// }
