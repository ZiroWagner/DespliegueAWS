import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
    @ApiProperty({ example: 'Mi Proyecto' })
    @IsNotEmpty()
    @IsString()
    name: string;

    @ApiProperty({ example: 'Descripción del proyecto', required: false })
    @IsOptional()
    @IsString()
    description?: string;
}
