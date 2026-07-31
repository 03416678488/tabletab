import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileService } from '@modules/common/file/file.service';
import { File } from '@modules/file-manager/entities/file.entity';
import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { TransactionService } from 'src/services/transaction.service';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FileMetadata } from '@modules/file-manager/entities/file-metadata.entity';
import { FileManagerValidatorService } from '@modules/file-manager/services/file-manager-validator.service';

@Injectable()
export class FileManagerService extends AbstractService<File> {
  private readonly logger = new Logger(FileManagerService.name);

  constructor(
    @InjectRepository(File)
    protected readonly fileRepo: Repository<File>,
    @InjectRepository(FileMetadata)
    protected readonly fileMetadataRepo: Repository<FileMetadata>,
    protected readonly transactionService: TransactionService,
    protected readonly fileManagerValidatorService: FileManagerValidatorService,
    protected readonly fileService: FileService,
  ) {
    super(fileRepo);
  }

  async saveFile(file: Express.Multer.File, userId: string): Promise<File> {
    const { filename, originalname, mimetype, size, path: diskPath } = file;

    try {
      return await this.transactionService.execute(async (queryRunner) => {
        const fileRepo = queryRunner.manager.getRepository(File);
        const metadataRepo = queryRunner.manager.getRepository(FileMetadata);

        const fileUploaded = await fileRepo.save({
          fileName: filename,
          originalFileName: originalname,
          mimetype,
          path: diskPath,
          size,
        });

        await metadataRepo.save({
          userId,
          description: null,
          isDeleted: false,
          file: fileUploaded,
        });

        return fileUploaded;
      });
    } catch (error) {
      await this.fileService
        .deleteFile(diskPath)
        .catch((e) => this.logger.error(`Failed to clean up orphaned file ${diskPath}`, e));
      throw error;
    }
  }

  async listFiles(userId: string): Promise<File[]> {
    return this.fileRepo.find({
      where: { metadata: { userId, isDeleted: false } },
      relations: { metadata: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getFile(id: string): Promise<File> {
    const file = await this.fileRepo.findOne({ where: { id }, relations: { metadata: true } });
    if (!file) throw new NotFoundException('File not found');
    return file;
  }

  async deleteFile(id: string): Promise<{ message: string }> {
    const file = await this.getFile(id);

    if (file.path) {
      await this.fileService
        .deleteFile(file.path)
        .catch((e) => this.logger.warn(`Disk file already missing for ${id}: ${e?.message}`));
    }

    await this.fileRepo.delete(id);
    return { message: 'File deleted successfully' };
  }

  async uploadSingleCsvFile(file: Express.Multer.File, userId: string) {
    const savedFile = await this.saveFile(file, userId);

    const [fileHeaders, first15Rows] = await Promise.all([
      this.fileService.csv.getFileHeaders(file.path),
      this.fileService.csv.parseFirst15Rows(file.path),
    ]);

    return {
      message: 'File uploaded successfully',
      uploadedFileId: savedFile.id,
      fileHeader: fileHeaders,
      fileContent: first15Rows,
    };
  }
}
