import { create } from 'zustand';
import api from '@/lib/api';

export interface Project {
    id: number;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

interface ProjectState {
    projects: Project[];
    selectedProjectId: number | null;
    isLoading: boolean;
    fetchProjects: () => Promise<void>;
    createProject: (name: string, description?: string) => Promise<void>;
    updateProject: (id: number, name: string, description?: string) => Promise<void>;
    selectProject: (id: number | null) => void;
    deleteProject: (id: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    selectedProjectId: null,
    isLoading: false,

    fetchProjects: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/projects');
            set({ projects: response.data });
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    createProject: async (name: string, description?: string) => {
        try {
            const response = await api.post('/projects', { name, description });
            set((state) => ({ projects: [response.data, ...state.projects] }));
        } catch (error) {
            console.error('Error creating project:', error);
        }
    },

    updateProject: async (id: number, name: string, description?: string) => {
        try {
            const response = await api.patch(`/projects/${id}`, { name, description });
            set((state) => ({
                projects: state.projects.map((p) => (p.id === id ? response.data : p)),
            }));
        } catch (error) {
            console.error('Error updating project:', error);
        }
    },

    selectProject: (id: number | null) => {
        set({ selectedProjectId: id });
    },

    deleteProject: async (id: number) => {
        try {
            await api.delete(`/projects/${id}`);
            set((state) => ({
                projects: state.projects.filter((p) => p.id !== id),
                selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
            }));
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    },
}));
