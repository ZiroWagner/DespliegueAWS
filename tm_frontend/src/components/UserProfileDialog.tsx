import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

interface UserProfileDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UserProfileDialog({ open, onOpenChange }: UserProfileDialogProps) {
    const { user, updateAvatar, updateProfile } = useAuthStore();
    const [isUploading, setIsUploading] = useState(false);
    const [name, setName] = useState(user?.name || "");
    const [isSaving, setIsSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update local state when user changes (e.g. on open)
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPreviewUrl(undefined);
            setSelectedFile(null);
        }
    }, [user, open]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            // 1. Upload avatar if selected
            if (selectedFile) {
                await updateAvatar(selectedFile);
            }

            // 2. Update profile name if changed
            if (name !== user?.name) {
                await updateProfile(name);
            }

            onOpenChange(false);
        } catch (error) {
            console.error("Error updating profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    const storageUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    // Use previewUrl if available, otherwise fallback to user avatar
    const avatarSrc = previewUrl || (user.avatarUrl ? (user.avatarUrl.startsWith('http') ? user.avatarUrl : `${storageUrl}${user.avatarUrl}`) : undefined);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Perfil de Usuario</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col items-center gap-6 py-4">
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={avatarSrc} />
                            <AvatarFallback className="text-2xl">
                                {getInitials(name || user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white h-8 w-8" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">Click en la imagen para cambiar avatar</p>

                    <div className="w-full space-y-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={user.email} disabled />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving || !name.trim()}>
                        {isSaving ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
