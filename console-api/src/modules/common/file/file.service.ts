import { extension } from 'mime-types';
import { Injectable, Scope } from '@nestjs/common';
import { CSVService } from '@modules/common/file/services/csv.service';
import path from 'path';
import fs from 'fs/promises';

@Injectable({ scope: Scope.REQUEST })
export class FileService {
  constructor(private readonly csvServices: CSVService) {}

  get csv() {
    return this.csvServices;
  }

  async deleteFile(filePath: string) {
    await fs.unlink(filePath);
  }

  getFileExtension(file: Express.Multer.File): string {
    return extension(file.mimetype);
  }

  async createDirAsync(dirPath: string) {
    const fullPath = path.resolve(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
  }
}
