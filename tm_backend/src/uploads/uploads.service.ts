import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class UploadsService {
    private readonly uploadsDir = path.join(__dirname, '..', '..', '..', 'uploads');
    private s3Client: S3Client | null = null;
    private bucketName: string | null = null;

    constructor(private configService: ConfigService) {
        const region = this.configService.get<string>('AWS_REGION');
        const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
        const sessionToken = this.configService.get<string>('AWS_SESSION_TOKEN');
        this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME') || null;

        if (region && accessKeyId && secretAccessKey && sessionToken && this.bucketName) {
            this.s3Client = new S3Client({
                region,
                credentials: {
                    accessKeyId,
                    secretAccessKey,
                    sessionToken,
                },
            });
        }

        if (!this.s3Client) {
            this.ensureDirectoryExists(path.join(this.uploadsDir, 'avatars'));
            this.ensureDirectoryExists(path.join(this.uploadsDir, 'attachments'));
        }
    }

    private ensureDirectoryExists(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    private sanitizeName(name: string): string {
        return name.replace(/[^a-z0-9\-_]/gi, '_').toLowerCase();
    }

    async saveAvatar(file: Express.Multer.File): Promise<string> {
        const filename = `avatar-${uuidv4()}.webp`;
        const buffer = await sharp(file.buffer)
            .resize(256, 256, { fit: 'cover' })
            .toFormat('webp')
            .toBuffer();

        if (this.s3Client && this.bucketName) {
            const key = `avatars/${filename}`;
            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: 'image/webp',
                // ACL: 'public-read', // Optional, depends on bucket settings
            }));
            // Return proxy URL
            return `/uploads/file/${key}`;
        } else {
            const filepath = path.join(this.uploadsDir, 'avatars', filename);
            fs.writeFileSync(filepath, buffer);
            return `/uploads/avatars/${filename}`;
        }
    }

    async saveAttachment(file: Express.Multer.File, pathSegments: string[] = []): Promise<{ url: string; type: string; filename: string }> {
        const isImage = file.mimetype.startsWith('image/');
        const filename = `${uuidv4()}-${file.originalname}`;
        const sanitizedSegments = pathSegments.map(s => this.sanitizeName(s));

        if (this.s3Client && this.bucketName) {
            const key = `attachments/${sanitizedSegments.join('/')}/${filename}`;

            // Optimize if image
            let buffer = file.buffer;
            // if (isImage) { buffer = await sharp(buffer)... } // Optional optimization

            await this.s3Client.send(new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: file.mimetype,
            }));

            return {
                url: `/uploads/file/${key}`,
                type: isImage ? 'IMAGE' : 'FILE',
                filename: file.originalname,
            };
        } else {
            const relativeDir = path.join('attachments', ...sanitizedSegments);
            const absoluteDir = path.join(this.uploadsDir, relativeDir);
            this.ensureDirectoryExists(absoluteDir);
            const filepath = path.join(absoluteDir, filename);
            fs.writeFileSync(filepath, file.buffer);

            const urlPath = ['uploads', 'attachments', ...sanitizedSegments, filename].join('/');
            return {
                url: `/${urlPath}`,
                type: isImage ? 'IMAGE' : 'FILE',
                filename: file.originalname,
            };
        }
    }

    async deleteFile(fileUrl: string) {
        if (this.s3Client && this.bucketName && fileUrl.startsWith('/uploads/file/')) {
            try {
                // Extract key from proxy URL
                // URL: /uploads/file/key
                const key = fileUrl.replace('/uploads/file/', '');

                await this.s3Client.send(new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }));
            } catch (error) {
                console.error(`Error deleting S3 file ${fileUrl}:`, error);
            }
        } else if (this.s3Client && this.bucketName && fileUrl.startsWith('http')) {
            // Fallback for old full URLs if any
            try {
                const url = new URL(fileUrl);
                const key = url.pathname.substring(1);
                await this.s3Client.send(new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                }));
            } catch (error) {
                console.error(`Error deleting S3 file ${fileUrl}:`, error);
            }
        } else {
            try {
                const relativePath = fileUrl.replace(/^\/uploads\//, '');
                const fullPath = path.join(this.uploadsDir, relativePath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath);
                }
            } catch (error) {
                console.error(`Error deleting local file ${fileUrl}:`, error);
            }
        }
    }

    async deleteFolder(pathSegments: string[]) {
        const sanitizedSegments = pathSegments.map(s => this.sanitizeName(s));

        if (this.s3Client && this.bucketName) {
            try {
                const prefix = `attachments/${sanitizedSegments.join('/')}/`;

                // List objects to delete
                const listCommand = new ListObjectsV2Command({
                    Bucket: this.bucketName,
                    Prefix: prefix,
                });
                const listResponse = await this.s3Client.send(listCommand);

                if (listResponse.Contents && listResponse.Contents.length > 0) {
                    const objects = listResponse.Contents.map(obj => ({ Key: obj.Key }));
                    await this.s3Client.send(new DeleteObjectsCommand({
                        Bucket: this.bucketName,
                        Delete: { Objects: objects },
                    }));
                }
            } catch (error) {
                console.error(`Error deleting S3 folder ${pathSegments.join('/')}:`, error);
            }
        } else {
            try {
                const relativeDir = path.join('attachments', ...sanitizedSegments);
                const fullPath = path.join(this.uploadsDir, relativeDir);
                if (fs.existsSync(fullPath)) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                }
            } catch (error) {
                console.error(`Error deleting local folder ${pathSegments.join('/')}:`, error);
            }
        }
    }

    async getFileStream(key: string): Promise<{ stream: Readable; contentType: string }> {
        if (this.s3Client && this.bucketName) {
            try {
                const command = new GetObjectCommand({
                    Bucket: this.bucketName,
                    Key: key,
                });
                const response = await this.s3Client.send(command);
                return {
                    stream: response.Body as Readable,
                    contentType: response.ContentType || 'application/octet-stream',
                };
            } catch (error) {
                console.error(`Error getting file stream from S3 for key ${key}:`, error);
                throw error;
            }
        } else {
            // Local fallback
            const filePath = path.join(this.uploadsDir, key);
            if (fs.existsSync(filePath)) {
                return {
                    stream: fs.createReadStream(filePath),
                    contentType: 'application/octet-stream', // Could detect mime type if needed
                };
            }
            throw new Error('File not found');
        }
    }
}