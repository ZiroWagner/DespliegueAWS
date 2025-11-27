import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    @Get('file/*key')
    @ApiOperation({ summary: 'Get file from storage (S3 or local)' })
    async getFile(@Param('key') key: string | string[], @Res() res: Response) {
        const fileKey = Array.isArray(key) ? key.join('/') : key;
        return this.streamFile(fileKey, res);
    }

    @Get('avatars/:filename')
    @ApiOperation({ summary: 'Get avatar (legacy route)' })
    async getAvatar(@Param('filename') filename: string, @Res() res: Response) {
        return this.streamFile(`avatars/${filename}`, res);
    }

    @Get('attachments/*path')
    @ApiOperation({ summary: 'Get attachment (legacy route)' })
    async getAttachment(@Param('path') path: string | string[], @Res() res: Response) {
        const pathStr = Array.isArray(path) ? path.join('/') : path;
        return this.streamFile(`attachments/${pathStr}`, res);
    }

    private async streamFile(key: string, res: Response) {
        try {
            const { stream, contentType } = await this.uploadsService.getFileStream(key);

            res.set({
                'Content-Type': contentType,
                'Content-Disposition': 'inline',
            });

            stream.pipe(res);
        } catch (error) {
            throw new NotFoundException('File not found');
        }
    }
}
