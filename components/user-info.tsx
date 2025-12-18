"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Shield, Building2 } from "lucide-react";
import { UserRole, DivisionNames } from "@/lib/user-roles";

export function UserInfo() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    const user = session.user as any;
    const initials = user.name
        ? user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase()
        : "U";

    const getRoleBadge = (role: string) => {
        switch (role) {
            case UserRole.CENADI_DIRECTOR:
                return "Directeur Général";
            case UserRole.DIVISION_DIRECTOR:
                return "Directeur de Division";
            case UserRole.DIVISION_SECRETARY:
                return "Secrétaire de Division";
            default:
                return role;
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2 space-y-1 border-b pb-2 mb-2">
                    <div className="flex items-center text-xs text-muted-foreground">
                        <Shield className="w-3 h-3 mr-1" />
                        {getRoleBadge(user.role)}
                    </div>
                    {user.division && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <Building2 className="w-3 h-3 mr-1" />
                            {DivisionNames[user.division as keyof typeof DivisionNames]}
                        </div>
                    )}
                </div>
                <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Se déconnecter</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
