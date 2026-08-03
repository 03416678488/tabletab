import { Injectable } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterConfig } from '@config/multer.config';

@Injectable()
export class FileUploadInterceptor extends FileInterceptor('file', {
  storage: MulterConfig.storage,
}) {}
