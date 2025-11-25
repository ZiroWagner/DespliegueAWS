import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class GenerateTaskDto {
    @ApiProperty({ example: 'Quiero organizar una fiesta de cumpleaños' })
    @IsNotEmpty()
    @IsString()
    prompt: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('generate')
    @ApiOperation({ summary: 'Generar tarea con IA' })
    generateTask(@Body() generateTaskDto: GenerateTaskDto) {
        return this.aiService.generateTask(generateTaskDto.prompt);
    }

    @Post('plan')
    @ApiOperation({ summary: 'Generar plan de proyecto con IA' })
    generatePlan(@Body() generateTaskDto: GenerateTaskDto) {
        return this.aiService.generatePlan(generateTaskDto.prompt);
    }
}
