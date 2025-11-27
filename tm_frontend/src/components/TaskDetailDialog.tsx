import { useState, useRef } from "react";
import { Task, useTaskStore, Attachment } from "@/store/tasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Paperclip, X, FileIcon, ImageIcon, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskDetailDialogProps {
    task: Task;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
    const { uploadAttachment, deleteAttachment } = useTaskStore();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadAttachment(task.id, file);
        } catch (error) {
            console.error("Error uploading attachment:", error);
        } finally {
            setIsUploading(false);
        }
    };

    const storageUrl = process.env.NEXT_PUBLIC_API_URL;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">{task.title}</DialogTitle>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{task.status}</Badge>
                        {task.project && <Badge variant="outline">{task.project.name}</Badge>}
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Descripción</Label>
                        <p className="text-sm whitespace-pre-wrap">
                            {task.description || "Sin descripción"}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-muted-foreground flex items-center gap-2">
                                <Paperclip className="h-4 w-4" /> Adjuntos
                            </Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="cursor-pointer"
                            >
                                {isUploading ? "Subiendo..." : "Añadir Archivo"}
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </div>

                        {task.attachments && task.attachments.length > 0 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {task.attachments.map((att: Attachment) => (
                                    <div key={att.id} className="border rounded-md p-2 flex flex-col gap-2 relative group">
                                        {att.type === 'IMAGE' ? (
                                            <div className="aspect-video bg-muted rounded-md overflow-hidden relative">
                                                <img
                                                    src={att.url.startsWith('http') ? att.url : `${storageUrl}${att.url}`}
                                                    alt={att.filename}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                        ) : (
                                            <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                                                <FileIcon className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="truncate max-w-[120px]" title={att.filename}>
                                                {att.filename}
                                            </span>
                                            <div className="flex items-center">
                                                <a
                                                    href={att.url.startsWith('http') ? att.url : `${storageUrl}${att.url}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 hover:bg-muted rounded"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </a>
                                                <button
                                                    onClick={() => deleteAttachment(task.id, att.id)}
                                                    className="p-1 hover:bg-red-100 text-red-600 rounded cursor-pointer"
                                                    title="Eliminar archivo"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
                                No hay archivos adjuntos
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button className="cursor-pointer" onClick={() => onOpenChange(false)}>Cerrar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
