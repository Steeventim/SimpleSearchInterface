"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Division, DivisionNames } from "@/lib/user-roles";

export default function SignupPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [division, setDivision] = useState<string>("");
    const [role, setRole] = useState<string>("DIVISION_SECRETARY");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, role, division }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Une erreur est survenue");
            }

            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 dark:from-slate-900 dark:to-green-950 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
                <CardHeader className="space-y-1 flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white mb-4 shadow-md">
                        <Search className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Création de compte</CardTitle>
                    <CardDescription className="text-center">
                        Rejoignez le Système de Recherche CENADI
                    </CardDescription>
                </CardHeader>
                {isSuccess ? (
                    <CardContent className="space-y-4 py-8 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <Search className="w-6 h-6" />
                            </div>
                        </div>
                        <h3 className="text-lg font-medium">Inscription réussie !</h3>
                        <p className="text-sm text-muted-foreground">
                            Votre compte a été créé. Redirection vers la page de connexion...
                        </p>
                    </CardContent>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="py-2 px-3">
                                    <AlertDescription className="text-sm">{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom complet</Label>
                                <Input
                                    id="name"
                                    placeholder="Jean Dupont"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="focus-visible:ring-primary"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email professionnel</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="jean.dupont@cenadi.cm"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="focus-visible:ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="division">Division</Label>
                                    <Select onValueChange={setDivision} required>
                                        <SelectTrigger className="focus:ring-primary">
                                            <SelectValue placeholder="Sélectionner" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.values(Division).map((div) => (
                                                <SelectItem key={div} value={div}>
                                                    {div}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Fonction</Label>
                                    <Select onValueChange={setRole} defaultValue="DIVISION_SECRETARY">
                                        <SelectTrigger className="focus:ring-primary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DIVISION_DIRECTOR">Directeur</SelectItem>
                                            <SelectItem value="DIVISION_SECRETARY">Secrétaire</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="focus-visible:ring-primary"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4">
                            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Création en cours...
                                    </>
                                ) : (
                                    "S'inscrire"
                                )}
                            </Button>
                            <div className="text-center text-sm">
                                <Link href="/login" className="flex items-center justify-center text-primary hover:underline">
                                    <ArrowLeft className="mr-2 w-4 h-4" />
                                    Retour à la connexion
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                )}
            </Card>
        </div>
    );
}
