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
    async getFile(@Param('key') key: string, @Res() res: Response) {
        // The key might contain slashes, so we need to capture the full path.
        // NestJS wildcard param captures it but we might need to reconstruct if it's split.
        // Actually, @Param('key') with *key in route should capture the rest.
        // However, let's verify if 'key' comes as a string or array.
        // In Express/NestJS, *key typically maps to params[0].
        // Let's rely on @Param('key') being the wildcard content.

        // Note: key comes from URL, so it might be URL encoded?
        // Usually framework decodes it.

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
