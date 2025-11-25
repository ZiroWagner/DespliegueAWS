"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import KanbanBoard from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus, LogOut } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useTaskStore } from "@/store/tasks";

import AiTaskCreator from "@/components/AiTaskCreator";

import Sidebar from "@/components/Sidebar";
import { useProjectStore } from "@/store/projects";

import AllProjectsView from "@/components/AllProjectsView";

export default function DashboardPage() {
    const { user, logout, checkAuth } = useAuthStore();
    const { createTask } = useTaskStore();
    const { selectedProjectId } = useProjectStore();
    const router = useRouter();
    const { register, handleSubmit, reset } = useForm<{ title: string; description: string }>();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    useEffect(() => {
        if (!user && !localStorage.getItem("token")) {
            router.push("/login");
        }
    }, [user, router]);

    const onLogout = () => {
        logout();
        router.push("/login");
    };

    const onSubmit = async (data: { title: string; description: string }) => {
        await createTask(data.title, data.description, undefined, selectedProjectId || undefined);
        reset();
        setIsDialogOpen(false);
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="flex-1 ml-[250px] p-8 overflow-auto">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    <header className="flex justify-between items-center mb-8 flex-shrink-0">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">TaskManager</h1>
                            <p className="text-muted-foreground">Bienvenido, {user.name || user.email}</p>
                        </div>
                        <div className="flex gap-4">
                            {selectedProjectId !== null && (
                                <>
                                    <AiTaskCreator />
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="cursor-pointer">
                                                <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Crear Tarea</DialogTitle>
                                                <DialogDescription>
                                                    Agrega una nueva tarea a tu tablero.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="title">Título</Label>
                                                    <Input id="title" {...register("title", { required: true })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="description">Descripción</Label>
                                                    <Input id="description" {...register("description")} />
                                                </div>
                                                <Button type="submit" className="w-full cursor-pointer">Crear</Button>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </>
                            )}
                            <Button variant="outline" onClick={onLogout} className="cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" /> Salir
                            </Button>
                        </div>
                    </header>

                    <main className="flex-1 overflow-hidden">
                        {selectedProjectId === null ? (
                            <AllProjectsView />
                        ) : (
                            <KanbanBoard />
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
