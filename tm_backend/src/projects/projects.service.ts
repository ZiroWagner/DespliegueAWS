import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        private uploadsService: UploadsService,
    ) { }

    async create(userId: number, createProjectDto: CreateProjectDto) {
        return this.prisma.project.create({
            data: {
                ...createProjectDto,
                userId,
            },
        });
    }

    async findAll(userId: number) {
        return this.prisma.project.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: number, userId: number) {
        const project = await this.prisma.project.findFirst({
            where: { id, userId },
        });

        if (!project) {
            throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return project;
    }

    async update(id: number, userId: number, updateProjectDto: UpdateProjectDto) {
        await this.findOne(id, userId); // Verify existence and ownership

        return this.prisma.project.update({
            where: { id },
            data: updateProjectDto,
        });
    }

    async remove(id: number, userId: number) {
        const project = await this.findOne(id, userId); // Verify existence and ownership

        // Delete project folder: attachments/{userId}/{projectName}
        await this.uploadsService.deleteFolder([
            userId.toString(),
            project.name
        ]);

        return this.prisma.project.delete({
            where: { id },
        });
    }
}
