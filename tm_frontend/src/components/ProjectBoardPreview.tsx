import { Task, TaskStatus } from "@/store/tasks";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectBoardPreviewProps {
    title: string;
    tasks: Task[];
    onClick: () => void;
}

export default function ProjectBoardPreview({ title, tasks, onClick }: ProjectBoardPreviewProps) {
    const columns = [
        { id: TaskStatus.TODO, title: "Por Hacer", color: "bg-slate-100" },
        { id: TaskStatus.IN_PROGRESS, title: "En Progreso", color: "bg-blue-50" },
        { id: TaskStatus.DONE, title: "Completado", color: "bg-green-50" },
    ];

    return (
        <Card
            className="min-w-[300px] w-[300px] h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary/20"
            onClick={onClick}
        >
            <div className="p-3 border-b font-semibold bg-muted/30 flex justify-between items-center">
                <span className="truncate">{title}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <div className="flex-1 p-2 grid grid-cols-3 gap-1 overflow-hidden">
                {columns.map((col) => {
                    const colTasks = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className={`rounded-md ${col.color} p-1 flex flex-col gap-1`}>
                            <div className="text-[10px] font-medium text-muted-foreground text-center mb-1">
                                {colTasks.length}
                            </div>
                            <div className="space-y-1 overflow-hidden">
                                {colTasks.slice(0, 3).map(task => (
                                    <div key={task.id} className="bg-white p-1 rounded border shadow-sm text-[10px] truncate text-muted-foreground">
                                        {task.title}
                                    </div>
                                ))}
                                {colTasks.length > 3 && (
                                    <div className="text-[9px] text-center text-muted-foreground">
                                        +{colTasks.length - 3} más
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
