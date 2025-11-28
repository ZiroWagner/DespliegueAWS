"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import Link from "next/link";
import AnimatedBackground from "@/components/ui/animated-background";

const formSchema = z.object({
    name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Por favor ingresa un correo válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
});

export default function RegisterPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.post("/auth/register", values);
            login(response.data.access_token, response.data.user);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Error al registrarse. El email podría estar en uso.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center overflow-hidden relative selection:bg-gray-700 selection:text-white bg-black text-white font-sans">

            {/* Sophisticated Background */}
            <AnimatedBackground />

            {/* Main Card */}
            <div className="glass w-full max-w-md p-10 rounded-3xl animate-fade-in-up relative z-10 mx-4">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white text-black mb-6 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-7 h-7">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 19.5a6.9 6.9 0 0014.16 0" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Crear Cuenta</h1>
                    <p className="text-gray-400 mt-2 text-sm font-light">Regístrate para comenzar a gestionar tus tareas</p>
                </div>

                {/* Form */}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    {/* Name Input */}
                    <div className="space-y-2 input-group transition-all duration-300">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-widest ml-1 transition-colors duration-300">Nombre</label>
                        <div className="relative group">
                            <input
                                {...form.register("name")}
                                type="text"
                                placeholder="Juan Perez"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-gray-100 placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-600 group-focus-within:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                </svg>
                            </div>
                        </div>
                        {form.formState.errors.name && (
                            <p className="text-xs text-red-400 ml-1">{form.formState.errors.name.message}</p>
                        )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2 input-group transition-all duration-300">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-widest ml-1 transition-colors duration-300">Email</label>
                        <div className="relative group">
                            <input
                                {...form.register("email")}
                                type="email"
                                placeholder="nombre@ejemplo.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-gray-100 placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-600 group-focus-within:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                        </div>
                        {form.formState.errors.email && (
                            <p className="text-xs text-red-400 ml-1">{form.formState.errors.email.message}</p>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2 input-group transition-all duration-300">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest transition-colors duration-300">Contraseña</label>
                        </div>
                        <div className="relative group">
                            <input
                                {...form.register("password")}
                                type="password"
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-gray-100 placeholder-gray-600 focus:outline-none transition-all duration-300 hover:border-white/20"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-600 group-focus-within:text-white transition-colors duration-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                        </div>
                        {form.formState.errors.password && (
                            <p className="text-xs text-red-400 ml-1">{form.formState.errors.password.message}</p>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-400 text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center group hover:bg-gray-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="animate-pulse">Registrando...</span>
                        ) : (
                            <>
                                <span>Registrarse</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </>
                        )}
                    </button>

                </form>

                {/* Footer */}
                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm">
                        ¿Ya tienes cuenta?
                        <Link href="/login" className="text-white font-medium hover:text-gray-300 transition-colors relative inline-block group ml-1">
                            Inicia Sesión
                            <span className="absolute bottom-0 left-0 w-0 h-px bg-white transition-all duration-300 group-hover:w-full"></span>
                        </Link>
                    </p>
                </div>
            </div>

            {/* Simple Footer Credit */}
            <div className="absolute bottom-6 text-gray-800 text-xs animate-fade-in font-medium tracking-wide">
                &copy; 2024 Task Manager App
            </div>

        </div>
    );
}