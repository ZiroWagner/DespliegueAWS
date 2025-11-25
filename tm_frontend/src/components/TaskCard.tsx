import { useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task, TaskStatus, useTaskStore } from "@/store/tasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import TaskDetailDialog from "./TaskDetailDialog";

interface TaskCardProps {
    task: Task;
    index: number;
}

const getStatusColor = (status: TaskStatus) => {
    switch (status) {
        case TaskStatus.TODO:
            return "bg-slate-500 hover:bg-slate-600";
        case TaskStatus.IN_PROGRESS:
            return "bg-blue-500 hover:bg-blue-600";
        case TaskStatus.DONE:
            return "bg-green-500 hover:bg-green-600";
        default:
            return "bg-gray-500";
    }
};

export default function TaskCard({ task, index }: TaskCardProps) {
    const { deleteTask, updateTask } = useTaskStore();
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const { register, handleSubmit } = useForm<{ title: string; description: string }>({
        defaultValues: {
            title: task.title,
            description: task.description || "",
        },
    });

    const onEditSubmit = async (data: { title: string; description: string }) => {
        await updateTask(task.id, data);
        setIsEditOpen(false);
    };

    return (
        <>
            <Draggable draggableId={task.id.toString()} index={index}>
                {(provided) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="mb-3"
                    >
                        <Card
                            onClick={() => setIsDetailOpen(true)}
                            className="cursor-pointer hover:shadow-md transition-all group relative"
                        >
                            {/* CABECERA + DESCRIPCIÓN TRUNCADA + ESTADO (SIEMPRE VISIBLES) */}
                            <CardHeader className="p-4 pb-2">
                                <div className="flex justify-between items-start">
                                    <CardTitle className="text-sm font-medium leading-none pr-6">
                                        {task.title}
                                    </CardTitle>

                                    {/* Menú (evitar propagación) */}
                                    <div
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                                                    <Pencil className="mr-2 h-4 w-4" /> Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => deleteTask(task.id)}
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>

                                {/* DESCRIPCIÓN TRUNCADA SI COMPACTO */}
                                {task.description && (
                                    <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap line-clamp-2">
                                        {task.description}
                                    </p>
                                )}

                                {/* ESTADO — SIEMPRE ABAJO Y VISIBLE */}
                                <div className="mt-3 flex items-center gap-2">
                                    <Badge className={`${getStatusColor(task.status)} text-white border-none`}>
                                        {task.status === TaskStatus.TODO && "Por Hacer"}
                                        {task.status === TaskStatus.IN_PROGRESS && "En Progreso"}
                                        {task.status === TaskStatus.DONE && "Completado"}
                                    </Badge>
                                    {task.project && (
                                        <Badge variant="outline" className="text-xs">
                                            {task.project.name}
                                        </Badge>
                                    )}
                                    {task.attachments && task.attachments.length > 0 && (
                                        <Badge variant="secondary" className="text-xs">
                                            📎 {task.attachments.length}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                        </Card>

                    </div>
                )}
            </Draggable>

            <TaskDetailDialog
                task={task}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
            />

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Tarea</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-title">Título</Label>
                            <Input id="edit-title" {...register("title", { required: true })} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Descripción</Label>
                            <Input id="edit-description" {...register("description")} />
                        </div>
                        <DialogFooter>
                            <Button type="submit">Guardar Cambios</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
