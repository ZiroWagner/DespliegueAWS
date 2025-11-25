"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";

const formSchema = z.object({
    email: z.string().email({
        message: "Por favor ingresa un correo válido.",
    }),
    password: z.string().min(1, {
        message: "La contraseña es requerida.",
    }),
});

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            const response = await api.post("/auth/login", values);
            login(response.data.access_token, response.data.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Credenciales inválidas o error en el servidor.");
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Iniciar Sesión</CardTitle>
                    <CardDescription>Ingresa tus credenciales para acceder.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="tu@email.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contraseña</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="******" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full">
                                Entrar
                            </Button>
                        </form>
                    </Form>
                    <div className="mt-4 text-center text-sm">
                        ¿No tienes cuenta?{" "}
                        <Link href="/register" className="underline">
                            Regístrate
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
