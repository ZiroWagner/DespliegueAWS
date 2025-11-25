import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private uploadsService: UploadsService,
    ) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async create(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async updateAvatar(userId: number, avatarUrl: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user && user.avatarUrl) {
            await this.uploadsService.deleteFile(user.avatarUrl);
        }

        return this.prisma.user.update({
            where: { id: userId },
            data: { avatarUrl },
        });
    }

    async updateProfile(userId: number, name: string) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { name },
        });
    }
}
