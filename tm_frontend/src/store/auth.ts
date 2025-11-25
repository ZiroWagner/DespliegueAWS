import { create } from 'zustand';
import api from '@/lib/api';

interface User {
    id: number;
    email: string;
    name?: string;
    avatarUrl?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    login: (token: string, user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    updateAvatar: (file: File) => Promise<void>;
    updateProfile: (name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
    login: (token, user) => {
        localStorage.setItem('token', token);
        set({ token, user });
    },
    logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
    },
    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/auth/profile');
                set({ user: response.data, token });
            } catch (error) {
                localStorage.removeItem('token');
                set({ token: null, user: null });
            }
        }
    },
    updateAvatar: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await api.post('/users/avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            set((state) => ({
                user: state.user ? { ...state.user, avatarUrl: response.data.avatarUrl } : null
            }));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        }
    },
    updateProfile: async (name: string) => {
        try {
            const response = await api.patch('/users/profile', { name });
            set((state) => ({
                user: state.user ? { ...state.user, name: response.data.name } : null
            }));
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        }
    },
}));
