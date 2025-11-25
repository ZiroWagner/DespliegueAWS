import { PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
    @ApiProperty({ example: 1, required: false })
    @IsOptional()
    @IsNumber()
    order?: number;
}
