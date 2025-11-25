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
    ParseIntPipe,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new project' })
    create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
        return this.projectsService.create(req.user.userId, createProjectDto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all user projects' })
    findAll(@Request() req) {
        return this.projectsService.findAll(req.user.userId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a project by ID' })
    findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.projectsService.findOne(id, req.user.userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update a project' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Request() req,
        @Body() updateProjectDto: UpdateProjectDto,
    ) {
        return this.projectsService.update(id, req.user.userId, updateProjectDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a project' })
    remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
        return this.projectsService.remove(id, req.user.userId);
    }
}
