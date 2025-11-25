import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Request,
    Query,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '../uploads/uploads.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tasks')
export class TasksController {
    constructor(
        private readonly tasksService: TasksService,
        private readonly uploadsService: UploadsService,
    ) { }

    @Post(':id/attachments')
    @ApiOperation({ summary: 'Upload attachment to task' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadAttachment(
        @Request() req,
        @Param('id') id: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.tasksService.addAttachmentWithFile(+id, req.user.userId, file);
    }

    @Delete(':id/attachments/:attachmentId')
    @ApiOperation({ summary: 'Eliminar un archivo adjunto' })
    async removeAttachment(
        @Request() req,
        @Param('id') id: string,
        @Param('attachmentId') attachmentId: string,
    ) {
        return this.tasksService.removeAttachment(+id, +attachmentId, req.user.userId);
    }

    @Post()
    @ApiOperation({ summary: 'Crear una nueva tarea' })
    create(@Request() req, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(req.user.userId, createTaskDto);
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todas las tareas del usuario' })
    @ApiQuery({ name: 'projectId', required: false, type: Number })
    findAll(@Request() req, @Query('projectId') projectId?: string) {
        return this.tasksService.findAll(
            req.user.userId,
            projectId ? +projectId : undefined,
        );
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener una tarea por ID' })
    findOne(@Request() req, @Param('id') id: string) {
        return this.tasksService.findOne(+id, req.user.userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una tarea' })
    update(
        @Request() req,
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.tasksService.update(+id, req.user.userId, updateTaskDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar una tarea' })
    remove(@Request() req, @Param('id') id: string) {
        return this.tasksService.remove(+id, req.user.userId);
    }
}
