import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userDivision = (session.user as any).division || "general";
        const uploadDir = process.env.UPLOAD_DIRECTORY || "./uploads";

        // Target specific division folder
        const divisionPath = path.join(uploadDir, userDivision);

        if (!fs.existsSync(divisionPath)) {
            // Return empty list if division folder doesn't exist yet
            return NextResponse.json({
                directories: [],
                root: userDivision
            });
        }

        const items = fs.readdirSync(divisionPath, { withFileTypes: true });

        // Filter only directories
        const directories = items
            .filter(item => item.isDirectory())
            .map(item => item.name);

        return NextResponse.json({
            directories,
            root: userDivision
        });

    } catch (error) {
        console.error("Directory API Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch directories" },
            { status: 500 }
        );
    }
}
