import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class TasksService {
    constructor(
        private prisma: PrismaService,
        private uploadsService: UploadsService,
    ) { }

    async create(userId: number, createTaskDto: CreateTaskDto) {
        const status = createTaskDto.status || 'TODO';
        const projectId = createTaskDto.projectId;

        // Obtener el último orden para la columna específica y proyecto
        const lastTask = await this.prisma.task.findFirst({
            where: {
                userId,
                status: status as any,
                projectId: projectId || null,
            },
            orderBy: { order: 'desc' },
        });
        const newOrder = lastTask ? lastTask.order + 1 : 0;

        return this.prisma.task.create({
            data: {
                ...createTaskDto,
                status: status as any,
                userId,
                order: newOrder,
            },
        });
    }

    async findAll(userId: number, projectId?: number) {
        return this.prisma.task.findMany({
            where: {
                userId,
                ...(projectId !== undefined ? { projectId } : {}),
            },
            include: {
                project: true,
                attachments: true
            },
            orderBy: { order: 'asc' },
        });
    }

    async findOne(id: number, userId: number) {
        const task = await this.prisma.task.findFirst({
            where: { id, userId },
            include: { project: true },
        });
        if (!task) throw new NotFoundException('Tarea no encontrada');
        return task;
    }

    async update(id: number, userId: number, updateTaskDto: UpdateTaskDto) {
        await this.findOne(id, userId); // Verificar existencia y propiedad
        return this.prisma.task.update({
            where: { id },
            data: updateTaskDto,
        });
    }

    async remove(id: number, userId: number) {
        const task = await this.findOne(id, userId);

        // Delete task folder: attachments/{userId}/{projectName}/{taskTitle}
        if (task.project) {
            await this.uploadsService.deleteFolder([
                userId.toString(),
                task.project.name,
                task.title
            ]);
        }

        return this.prisma.task.delete({
            where: { id },
        });
    }

    async addAttachmentWithFile(taskId: number, userId: number, file: Express.Multer.File) {
        const task = await this.findOne(taskId, userId);

        // Path: {userId}/{projectName}/{taskTitle}
        // If no project, maybe just {userId}/Uncategorized/{taskTitle}? Or just {userId}/{taskTitle}?
        // Requirement says: /attachments/{id_usuario}/{nombre_del_proyecto}/{nombre_de_la_tarea}/archivo.ext
        // If no project, I'll use "General" or similar.
        const projectName = task.project ? task.project.name : 'General';

        const attachmentData = await this.uploadsService.saveAttachment(file, [
            userId.toString(),
            projectName,
            task.title
        ]);

        return this.prisma.attachment.create({
            data: {
                ...attachmentData,
                taskId,
            },
        });
    }
    async removeAttachment(taskId: number, attachmentId: number, userId: number) {
        const task = await this.findOne(taskId, userId);

        const attachment = await this.prisma.attachment.findFirst({
            where: { id: attachmentId, taskId },
        });

        if (!attachment) {
            throw new NotFoundException('Adjunto no encontrado');
        }

        // Delete file from storage
        await this.uploadsService.deleteFile(attachment.url);

        // Delete from DB
        return this.prisma.attachment.delete({
            where: { id: attachmentId },
        });
    }
}
