"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2 } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Email ou mot de passe incorrect");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError("Une erreur est survenue lors de la connexion");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 dark:from-slate-950 dark:via-slate-900 dark:to-green-950 p-4 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-green-200/50 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-lime-200/50 rounded-full blur-3xl mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
            </div>

            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-10 transition-all duration-300">
                <CardHeader className="space-y-1 flex flex-col items-center pb-2">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-600/20 transform hover:scale-105 transition-transform duration-300">
                        <Search className="w-10 h-10" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-center tracking-tight text-slate-800 dark:text-slate-100">
                        Bienvenue
                    </CardTitle>
                    <CardDescription className="text-center text-base font-medium text-slate-600 dark:text-slate-400">
                        Connectez-vous au portail CENADI
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6 pt-4">
                        {error && (
                            <Alert variant="destructive" className="py-2 px-3 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900/50">
                                <AlertDescription className="text-sm font-medium flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                                    {error}
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Email professionnel</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="jean.dupont@cenadi.cm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 dark:bg-slate-950/50 dark:border-slate-800"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Mot de passe</Label>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all duration-200 dark:bg-slate-950/50 dark:border-slate-800"
                                        suppressHydrationWarning
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-2">
                        <Button type="submit" className="w-full h-11 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-600/20 transition-all duration-300 transform hover:-translate-y-0.5" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connexion...
                                </>
                            ) : (
                                <span className="flex items-center gap-2 font-semibold">
                                    Se connecter <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>

                        <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-2 text-slate-500">
                                    Ou
                                </span>
                            </div>
                        </div>

                        <div className="text-center text-sm w-full">
                            <span className="text-slate-600 dark:text-slate-400">Pas encore de compte ? </span>
                            <Link href="/signup" className="font-semibold text-green-600 hover:text-green-700 dark:text-green-500 hover:underline transition-colors inline-flex items-center gap-1">
                                Créer un compte
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
