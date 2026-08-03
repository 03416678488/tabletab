import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '@cor/decorators/auth/current-user.decorator';
import { User } from '@modules/user/entities/users.entity';
import { FileUploadInterceptor } from '@modules/file-manager/interceptors/file-upload.interceptor';
import { CsvValidationPipe } from '@modules/file-manager/pipes/csv-validation.pipe';
import { FileManagerService } from './file-manager.service';

@Controller('file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerServices: FileManagerService) {}

  @UseInterceptors(FileUploadInterceptor)
  @Post('upload-csv')
  async uploadSingleCsvFile(
    @UploadedFile(CsvValidationPipe) file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    return this.fileManagerServices.uploadSingleCsvFile(file, user.id);
  }

  @UseInterceptors(FileUploadInterceptor)
  @Post('upload-image')
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const saved = await this.fileManagerServices.uploadImage(file, user.id);
    return this.fileManagerServices.toFileResponse(saved, this.baseUrl(req));
  }

  @Get('images')
  async listImages(@CurrentUser() user: User, @Req() req: Request) {
    const files = await this.fileManagerServices.listImages(user.id);
    return files.map((f) => this.fileManagerServices.toFileResponse(f, this.baseUrl(req)));
  }

  @Get()
  async listFiles(@CurrentUser() user: User) {
    return this.fileManagerServices.listFiles(user.id);
  }

  private baseUrl(req: Request): string {
    return `${req.protocol}://${req.get('host')}`;
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileManagerServices.deleteFile(id);
  }
}
