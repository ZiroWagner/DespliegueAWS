import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projects";
import { useTaskStore } from "@/store/tasks";
import ProjectBoardPreview from "./ProjectBoardPreview";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AllProjectsView() {
    const { projects, selectProject, createProject } = useProjectStore();
    const { tasks, fetchTasks } = useTaskStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        await createProject(newProjectName);
        setNewProjectName("");
        setIsCreateOpen(false);
    };

    // Agrupar tareas por proyecto
    const tasksByProject = tasks.reduce((acc, task) => {
        const projectId = task.project?.id || -1; // -1 para tareas sin proyecto
        if (!acc[projectId]) {
            acc[projectId] = [];
        }
        acc[projectId].push(task);
        return acc;
    }, {} as Record<number, typeof tasks>);

    if (projects.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-muted/10">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <FolderPlus className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No hay proyectos creados</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                    Organiza tus tareas creando tu primer proyecto. Los proyectos te ayudan a mantener tu trabajo estructurado.
                </p>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg">
                            <Plus className="mr-2 h-5 w-5" /> Crear mi primer proyecto
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre del Proyecto</Label>
                                <Input
                                    id="name"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    placeholder="Ej: Marketing, Desarrollo..."
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={!newProjectName.trim()}>
                                Crear
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-4">Vista General de Proyectos</h2>
            <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-md border">
                <div className="flex w-max space-x-4 p-4 h-full">
                    {/* Tareas sin proyecto */}
                    {tasksByProject[-1] && tasksByProject[-1].length > 0 && (
                        <ProjectBoardPreview
                            title="Sin Proyecto"
                            tasks={tasksByProject[-1]}
                            onClick={() => {
                                // Quizás filtrar por "null" en el futuro
                            }}
                        />
                    )}

                    {/* Proyectos */}
                    {projects.map((project) => (
                        <ProjectBoardPreview
                            key={project.id}
                            title={project.name}
                            tasks={tasksByProject[project.id] || []}
                            onClick={() => selectProject(project.id)}
                        />
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
}
