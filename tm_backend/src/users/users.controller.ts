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
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from '../uploads/uploads.service';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly uploadsService: UploadsService,
    ) { }

    @Get('profile')
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Request() req) {
        return this.usersService.findOne(req.user.email);
    }

    @Post('avatar')
    @ApiOperation({ summary: 'Upload user avatar' })
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
    async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
        const avatarUrl = await this.uploadsService.saveAvatar(file);
        return this.usersService.updateAvatar(req.user.userId, avatarUrl);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Update user profile' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
            },
        },
    })
    async updateProfile(@Request() req, @Body() body: { name: string }) {
        return this.usersService.updateProfile(req.user.userId, body.name);
    }
}
