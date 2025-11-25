import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
    imports: [PrismaModule, UploadsModule],
    providers: [UsersService],
    controllers: [UsersController],
    exports: [UsersService],
})
export class UsersModule { }
