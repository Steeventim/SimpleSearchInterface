import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const name = payload.name ?? null;
        const email = payload.email ? String(payload.email).toLowerCase().trim() : null;
        const password = payload.password ? String(payload.password) : null;
        const role = payload.role ?? undefined;
        const division = payload.division ?? undefined;

        if (!email || !password) {
            return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
            return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Only include optional enum fields if provided and valid strings
        const createData: any = {
            name,
            email,
            password: hashedPassword,
        };
        if (typeof role === "string" && role.length > 0) createData.role = role;
        if (typeof division === "string" && division.length > 0) createData.division = division;

        await prisma.user.create({ data: createData });

        return NextResponse.json({ message: "Utilisateur créé avec succès" });
    } catch (error) {
        // Log detailed Prisma error meta if available
        console.error("Erreur d'inscription:", error, (error as any)?.meta ?? null);
        return NextResponse.json({ error: "Erreur lors de l'inscription" }, { status: 500 });
    }
}
