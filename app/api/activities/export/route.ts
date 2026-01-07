import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Export activities as CSV
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Only directors can export activities
        const isDirector = session.user.role === "CENADI_DIRECTOR" || session.user.role === "DIVISION_DIRECTOR";
        if (!isDirector) {
            return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const format = searchParams.get("format") || "csv";
        const type = searchParams.get("type");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build where clause
        const where: any = {};

        if (type) {
            where.type = type;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const activities = await prisma.activityLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        division: true,
                        role: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (format === "csv") {
            // Generate CSV
            const headers = ["Date", "Utilisateur", "Email", "Division", "Rôle", "Type", "Description", "IP", "User Agent"];
            const rows = activities.map((activity) => [
                activity.createdAt.toISOString(),
                activity.user.name || "N/A",
                activity.user.email,
                activity.user.division || "N/A",
                activity.user.role,
                activity.type,
                `"${activity.description.replace(/"/g, '""')}"`,
                activity.ipAddress || "N/A",
                `"${(activity.userAgent || "N/A").replace(/"/g, '""')}"`,
            ]);

            const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="activities-${new Date().toISOString().split("T")[0]}.csv"`,
                },
            });
        } else if (format === "json") {
            return new NextResponse(JSON.stringify(activities, null, 2), {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Content-Disposition": `attachment; filename="activities-${new Date().toISOString().split("T")[0]}.json"`,
                },
            });
        }

        return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
    } catch (error) {
        console.error("Error exporting activities:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'export des activités" },
            { status: 500 }
        );
    }
}
