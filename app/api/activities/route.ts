import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Retrieve activities (with optional filters)
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Only directors can view all activities
        const isDirector = session.user.role === "CENADI_DIRECTOR" || session.user.role === "DIVISION_DIRECTOR";

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const offset = parseInt(searchParams.get("offset") || "0");
        const type = searchParams.get("type");
        const userId = searchParams.get("userId");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build where clause
        const where: any = {};

        // Non-directors can only see their own activities
        if (!isDirector) {
            where.userId = session.user.id;
        } else if (userId) {
            where.userId = userId;
        }

        if (type) {
            where.type = type;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [activities, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            division: true,
                            role: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            prisma.activityLog.count({ where }),
        ]);

        return NextResponse.json({
            activities,
            total,
            limit,
            offset,
            hasMore: offset + activities.length < total,
        });
    } catch (error) {
        console.error("Error fetching activities:", error);
        return NextResponse.json(
            { error: "Erreur lors de la récupération des activités" },
            { status: 500 }
        );
    }
}

// POST - Log a new activity
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const body = await request.json();
        const { type, description, metadata } = body;

        if (!type || !description) {
            return NextResponse.json(
                { error: "Type et description requis" },
                { status: 400 }
            );
        }

        // Get IP and User-Agent from headers
        const forwarded = request.headers.get("x-forwarded-for");
        const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";

        const activity = await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                type,
                description,
                metadata,
                ipAddress,
                userAgent,
            },
        });

        return NextResponse.json({ activity });
    } catch (error) {
        console.error("Error logging activity:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'enregistrement de l'activité" },
            { status: 500 }
        );
    }
}
