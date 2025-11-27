import { useEffect, useState } from "react";
import { useProjectStore, Project } from "@/store/projects";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Folder, FolderOpen, MoreVertical, Pencil, Trash } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import UserProfileDialog from "@/components/UserProfileDialog";
import { useAuthStore } from "@/store/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import api from "@/lib/api";

export default function Sidebar() {
    const { projects, fetchProjects, createProject, updateProject, deleteProject, selectProject, selectedProjectId } = useProjectStore();
    const { user } = useAuthStore();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Estados para Edición
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
    const [editProjectName, setEditProjectName] = useState("");

    // Estados para Eliminación
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleCreate = async () => {
        if (!newProjectName.trim()) return;
        await createProject(newProjectName);
        setNewProjectName("");
        setIsCreateOpen(false);
    };

    const openEditDialog = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setProjectToEdit(project);
        setEditProjectName(project.name);
        setIsEditOpen(true);
    };

    const handleEdit = async () => {
        if (!projectToEdit || !editProjectName.trim()) return;
        await updateProject(projectToEdit.id, editProjectName);
        setIsEditOpen(false);
        setProjectToEdit(null);
    };

    const openDeleteDialog = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        setProjectToDelete(project);
        setIsDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!projectToDelete) return;
        await deleteProject(projectToDelete.id);
        setIsDeleteOpen(false);
        setProjectToDelete(null);
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const storageUrl = api.defaults.baseURL || "";
    const avatarSrc = user?.avatarUrl ? `${storageUrl}${user.avatarUrl}` : undefined;

    return (
        <div className="fixed left-0 top-0 h-screen w-64 border-r flex flex-col bg-muted/10">
            <div className="p-4 border-b flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setIsProfileOpen(true)}>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback>
                        {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                    </AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium truncate">{user?.name || "Usuario"}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
            </div>

            <UserProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />

            <div className="p-4 border-b">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Proyectos
                </h2>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    <Button
                        variant={selectedProjectId === null ? "secondary" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => selectProject(null)}
                    >
                        <Folder className="mr-2 h-4 w-4" />
                        Todos
                    </Button>

                    {projects.map((project) => (
                        <div key={project.id} className="group relative flex items-center">
                            <Button
                                variant={selectedProjectId === project.id ? "secondary" : "ghost"}
                                className="w-full justify-start pr-8"
                                onClick={() => selectProject(project.id)}
                            >
                                <Folder className="mr-2 h-4 w-4" />
                                <span className="truncate">{project.name}</span>
                            </Button>

                            <div className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6">
                                            <MoreVertical className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => openEditDialog(e, project)}>
                                            <Pencil className="mr-2 h-4 w-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onClick={(e) => openDeleteDialog(e, project)}
                                        >
                                            <Trash className="mr-2 h-4 w-4" /> Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Tema</span>
                    <ModeToggle />
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full" variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
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

            {/* Dialogo de Edición */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Proyecto</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nombre del Proyecto</Label>
                            <Input
                                id="edit-name"
                                value={editProjectName}
                                onChange={(e) => setEditProjectName(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEdit} disabled={!editProjectName.trim()}>
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialogo de Confirmación de Eliminación */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar Proyecto?</DialogTitle>
                        <DialogDescription>
                            Esta acción no se puede deshacer. Se eliminarán todas las tareas asociadas al proyecto
                            <strong> "{projectToDelete?.name}"</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
