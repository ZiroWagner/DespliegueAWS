"use client";

import { useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { useTaskStore, TaskStatus } from "@/store/tasks";
import TaskCard from "./TaskCard";

const columns = [
    { id: TaskStatus.TODO, title: "Por Hacer" },
    { id: TaskStatus.IN_PROGRESS, title: "En Progreso" },
    { id: TaskStatus.DONE, title: "Completado" },
];

import { useProjectStore } from "@/store/projects";

export default function KanbanBoard() {
    const { tasks, fetchTasks, updateTask, setTasks, isLoading } = useTaskStore();
    const { selectedProjectId } = useProjectStore();

    useEffect(() => {
        fetchTasks(selectedProjectId);
    }, [fetchTasks, selectedProjectId]);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const taskId = parseInt(draggableId);
        const newStatus = destination.droppableId as TaskStatus;

        // Update local state immediately for smooth UX
        // Note: This is a simplified reorder logic. For full production reordering within columns, 
        // we'd need to recalculate all order indices. For now, we just handle status changes 
        // and simple reordering visual.

        const taskToMove = tasks.find(t => t.id === taskId);
        if (taskToMove) {
            updateTask(taskId, { status: newStatus, order: destination.index });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4">
                {columns.map((column) => (
                    <div key={column.id} className="flex-1 min-w-[300px]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">{column.title}</h3>
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                                {tasks.filter((t) => t.status === column.id).length}
                            </span>
                        </div>

                        <Droppable droppableId={column.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={`bg-muted/50 rounded-lg p-4 min-h-[430px] transition-colors ${snapshot.isDraggingOver ? "bg-muted/80" : ""
                                        }`}
                                >
                                    {tasks
                                        .filter((task) => task.status === column.id)
                                        .sort((a, b) => a.order - b.order)
                                        .map((task, index) => (
                                            <TaskCard key={task.id} task={task} index={index} />
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
