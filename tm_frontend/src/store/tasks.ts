import { create } from 'zustand';
import api from '@/lib/api';

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export interface Attachment {
    id: number;
    url: string;
    filename: string;
    type: string;
}

export interface Task {
    id: number;
    title: string;
    description?: string;
    status: TaskStatus;
    order: number;
    userId: number;
    project?: {
        id: number;
        name: string;
    };
    attachments?: Attachment[];
}

interface TaskState {
    tasks: Task[];
    isLoading: boolean;
    fetchTasks: (projectId?: number | null) => Promise<void>;
    createTask: (title: string, description?: string, status?: TaskStatus, projectId?: number) => Promise<void>;
    updateTask: (id: number, data: Partial<Task>) => Promise<void>;
    deleteTask: (id: number) => Promise<void>;
    setTasks: (tasks: Task[]) => void;
    uploadAttachment: (taskId: number, file: File) => Promise<void>;
    deleteAttachment: (taskId: number, attachmentId: number) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,
    fetchTasks: async (projectId?: number | null) => {
        set({ isLoading: true });
        try {
            const params = projectId ? { projectId } : {};
            const response = await api.get('/tasks', { params });
            set({ tasks: response.data });
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            set({ isLoading: false });
        }
    },
    createTask: async (title, description, status, projectId) => {
        try {
            const response = await api.post('/tasks', { title, description, status, projectId });
            set((state) => ({ tasks: [...state.tasks, response.data] }));
        } catch (error) {
            console.error('Error creating task:', error);
        }
    },
    updateTask: async (id, data) => {
        // Optimistic update
        set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
        try {
            await api.patch(`/tasks/${id}`, data);
        } catch (error) {
            console.error('Error updating task:', error);
            // Revert on error (could be improved)
            get().fetchTasks();
        }
    },
    deleteTask: async (id) => {
        set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
        }));
        try {
            await api.delete(`/tasks/${id}`);
        } catch (error) {
            console.error('Error deleting task:', error);
            get().fetchTasks();
        }
    },
    setTasks: (tasks) => set({ tasks }),
    uploadAttachment: async (taskId: number, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Update task with new attachment
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === taskId
                        ? { ...t, attachments: [...(t.attachments || []), response.data] }
                        : t
                ),
            }));
        } catch (error) {
            console.error('Error uploading attachment:', error);
            throw error;
        }
    },
    deleteAttachment: async (taskId: number, attachmentId: number) => {
        try {
            await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
            set((state) => ({
                tasks: state.tasks.map((t) =>
                    t.id === taskId
                        ? { ...t, attachments: t.attachments?.filter((a) => a.id !== attachmentId) }
                        : t
                ),
            }));
        } catch (error) {
            console.error('Error deleting attachment:', error);
            throw error;
        }
    },
}));
