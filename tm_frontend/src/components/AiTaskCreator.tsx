import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ListTodo } from "lucide-react";
import api from "@/lib/api";
import { useTaskStore } from "@/store/tasks";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { useProjectStore } from "@/store/projects";

export default function AiTaskCreator() {
    const [isOpen, setIsOpen] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isPlanMode, setIsPlanMode] = useState(false);
    const { createTask } = useTaskStore();
    const { selectedProjectId } = useProjectStore();

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        try {
            if (isPlanMode) {
                const response = await api.post("/ai/plan", { prompt });
                const tasks = response.data;
                // Crear tareas secuencialmente para mantener orden (o Promise.all si el orden lo maneja el backend)
                for (const task of tasks) {
                    await createTask(task.title, task.description, undefined, selectedProjectId || undefined);
                }
            } else {
                const response = await api.post("/ai/generate", { prompt });
                const { title, description } = response.data;
                await createTask(title, description, undefined, selectedProjectId || undefined);
            }

            setIsOpen(false);
            setPrompt("");
        } catch (error) {
            console.error("Error generating task/plan:", error);
            // Aquí podrías mostrar un toast de error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" className="gap-2 cursor-pointer">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Asistente IA
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Asistente de Tareas IA</DialogTitle>
                    <DialogDescription>
                        {isPlanMode
                            ? "Describe tu proyecto y crearé un plan de tareas completo."
                            : "Describe lo que quieres hacer y crearé la tarea por ti."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center space-x-2 py-2">
                    <Switch id="plan-mode" checked={isPlanMode} onCheckedChange={setIsPlanMode} />
                    <Label htmlFor="plan-mode" className="flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        Modo Plan de Proyecto
                    </Label>
                </div>

                <div className="py-2">
                    <Textarea
                        placeholder={isPlanMode
                            ? "Ej: Quiero lanzar una nueva campaña de marketing para verano..."
                            : "Ej: Necesito preparar una presentación para el cliente..."}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="min-h-[100px]"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={isLoading || !prompt.trim()}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isPlanMode ? "Generando Plan..." : "Generando Tarea..."}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                {isPlanMode ? "Generar Plan" : "Generar Tarea"}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
