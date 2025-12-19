import { NextResponse, NextRequest } from "next/server";
import { getUserDocuments, deleteUserDocument } from "@/lib/elasticsearch";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { headers, cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    console.log("📁 API User Documents - Début de la requête");

    // Récupérer les headers et cookies
    const headersList = await headers();
    const cookieStore = await cookies();

    // Obtenir la session utilisateur
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log("❌ Pas de session utilisateur");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("✅ Utilisateur authentifié:", {
      id: session.user.id,
      email: session.user.email,
    });

    // Récupérer les paramètres de pagination
    const searchParams = request.nextUrl.searchParams;
    const size = Number.parseInt(searchParams.get("size") || "50");
    const from = Number.parseInt(searchParams.get("from") || "0");

    // Récupérer les documents de l'utilisateur
    const result = await getUserDocuments(session.user.id, size, from);

    console.log("✅ Documents récupérés:", {
      total: result.total,
      results: result.documents.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("❌ Erreur récupération documents utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("🗑️ API Delete Document - Début de la requête");

    // Obtenir la session utilisateur
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log("❌ Pas de session utilisateur");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'ID du document à supprimer
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
        { error: "ID du document requis" },
        { status: 400 }
      );
    }

    console.log("🗑️ Suppression document:", {
      documentId,
      userId: session.user.id,
    });

    // Supprimer le document
    const success = await deleteUserDocument(documentId, session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: "Impossible de supprimer le document" },
        { status: 403 }
      );
    }

    console.log("✅ Document supprimé avec succès");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Erreur suppression document:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du document" },
      { status: 500 }
    );
  }
}
