import { IsNull, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FileService } from '@modules/common/file/file.service';
import { File } from '@modules/file-manager/entities/file.entity';
import { MediaFolder } from '@modules/file-manager/entities/media-folder.entity';
import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { TransactionService } from 'src/services/transaction.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
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
    @InjectRepository(MediaFolder)
    protected readonly mediaFolderRepo: Repository<MediaFolder>,
    protected readonly transactionService: TransactionService,
    protected readonly fileManagerValidatorService: FileManagerValidatorService,
    protected readonly fileService: FileService,
  ) {
    super(fileRepo);
  }

  async saveFile(
    file: Express.Multer.File,
    userId: string,
    folderId: string | null = null,
  ): Promise<File> {
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
          folderId,
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

  /** Upload an image (validates mimetype) into an optional folder. */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    folderId?: string | null,
  ): Promise<File> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!file.mimetype?.startsWith('image/')) {
      await this.fileService.deleteFile(file.path).catch(() => undefined);
      throw new BadRequestException('Only image files are allowed');
    }
    const resolvedFolderId = folderId ? await this.assertOwnedFolder(folderId, userId) : null;
    return this.saveFile(file, userId, resolvedFolderId);
  }

  /**
   * List a user's uploaded images, newest first. When `folderId` is given, only
   * that folder's images; otherwise the root (uncategorised) images.
   */
  async listImages(userId: string, folderId?: string): Promise<File[]> {
    return this.fileRepo.find({
      where: {
        mimetype: Like('image/%'),
        folderId: folderId ? folderId : IsNull(),
        metadata: { userId, isDeleted: false },
      },
      relations: { metadata: true },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Folders ──────────────────────────────────────────────────────────────

  private async assertOwnedFolder(folderId: string, userId: string): Promise<string> {
    const folder = await this.mediaFolderRepo.findOne({ where: { id: folderId, userId } });
    if (!folder) throw new NotFoundException('Folder not found');
    return folder.id;
  }

  /** A user's folders (flat, with parentId) + image counts, newest first. */
  async listFolders(userId: string): Promise<
    { id: string; name: string; parentId: string | null; imageCount: number; createdAt: Date }[]
  > {
    const folders = await this.mediaFolderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      folders.map(async (f) => ({
        id: f.id,
        name: f.name,
        parentId: f.parentId ?? null,
        createdAt: f.createdAt,
        imageCount: await this.fileRepo.count({
          where: { folderId: f.id, mimetype: Like('image/%'), metadata: { isDeleted: false } },
        }),
      })),
    );
  }

  async createFolder(
    name: string,
    userId: string,
    parentId?: string | null,
  ): Promise<MediaFolder> {
    const trimmed = (name ?? '').trim();
    if (!trimmed) throw new BadRequestException('Folder name is required');
    const resolvedParentId = parentId ? await this.assertOwnedFolder(parentId, userId) : null;
    const exists = await this.mediaFolderRepo.findOne({
      where: { name: trimmed, userId, parentId: resolvedParentId ?? IsNull() },
    });
    if (exists) throw new ConflictException('A folder with this name already exists here');
    return this.mediaFolderRepo.save(
      this.mediaFolderRepo.create({ name: trimmed, userId, parentId: resolvedParentId }),
    );
  }

  /**
   * Delete a folder and all its subfolders (self-FK ON DELETE CASCADE). Images in
   * any deleted folder move back to the root (files.folderId FK ON DELETE SET NULL).
   */
  async deleteFolder(id: string, userId: string): Promise<{ message: string }> {
    await this.assertOwnedFolder(id, userId);
    await this.mediaFolderRepo.delete(id);
    return { message: 'Folder deleted' };
  }

  /** Disk path → public path served by useStaticAssets, e.g. /uploads/<id>/png/x.png */
  toPublicPath(file: File): string {
    const normalized = (file.path ?? '').replace(/\\/g, '/');
    const idx = normalized.indexOf('public/');
    const rel = idx >= 0 ? normalized.slice(idx + 'public'.length) : `/${normalized}`;
    return rel.startsWith('/') ? rel : `/${rel}`;
  }

  /** Client-friendly shape with an absolute, ready-to-use image URL. */
  toFileResponse(file: File, baseUrl: string) {
    return {
      id: file.id,
      fileName: file.fileName,
      originalFileName: file.originalFileName,
      mimetype: file.mimetype,
      size: file.size,
      folderId: file.folderId ?? null,
      url: `${baseUrl}${this.toPublicPath(file)}`,
    };
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
