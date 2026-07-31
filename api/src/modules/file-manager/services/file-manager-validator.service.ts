import { BadRequestException, Injectable } from '@nestjs/common';
import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File } from '@modules/file-manager/entities/file.entity';
import { FileMetadata } from '@modules/file-manager/entities/file-metadata.entity';

@Injectable()
export class FileManagerValidatorService extends AbstractService<File> {
  constructor(
    @InjectRepository(File)
    protected readonly fileManagerRepo: Repository<File>,
    @InjectRepository(FileMetadata)
    protected readonly fileMetadataRepo: Repository<FileMetadata>,
  ) {
    super(fileManagerRepo);
  }

  async validateSingleCsvFile(file: Express.Multer.File) {
    await this.validateCsvFile(file);
  }

  validateFileType(file: Express.Multer.File, allowedTypes: string[]) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileMime = file.mimetype;
    const isValid = allowedTypes.some((type) => fileMime.includes(type));

    if (!isValid) {
      throw new BadRequestException(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  private async validateCsvFile(file: Express.Multer.File): Promise<string[]> {
    const errors: string[] = [];

    try {
      const content = file.buffer.toString('utf-8');

      // Check if file is empty
      if (!content.trim()) {
        errors.push('CSV file is empty');
        return errors;
      }

      // Basic CSV structure validation
      const lines = content.split('\n').filter((line) => line.trim());
      if (lines.length < 2) {
        errors.push('CSV must have at least a header and one data row');
      }

      // Check for consistent column count
      const headerCols = lines[0].split(',').length;
      for (let i = 1; i < Math.min(lines.length, 10); i++) {
        // Check first 10 rows
        const cols = lines[i].split(',').length;
        if (cols !== headerCols) {
          errors.push(`Inconsistent column count at row ${i + 1}`);
          break;
        }
      }
    } catch (error) {
      console.log(error);
      errors.push('Failed to parse CSV file');
    }

    return errors;
  }

  private async validateExcelFile(file: Express.Multer.File): Promise<string[]> {
    const errors: string[] = [];

    // Check file signature for Excel files
    const signature = file.buffer.slice(0, 4);
    const xlsxSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // ZIP signature (XLSX)
    const xlsSignature = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]); // OLE signature (XLS)

    if (!signature.equals(xlsxSignature) && !signature.equals(xlsSignature)) {
      errors.push('Invalid Excel file signature');
    }

    return errors;
  }

  private async validateJsonFile(file: Express.Multer.File): Promise<string[]> {
    const errors: string[] = [];

    try {
      const content = file.buffer.toString('utf-8');
      JSON.parse(content);
    } catch (error) {
      console.log(error);
      errors.push('Invalid JSON format');
    }

    return errors;
  }

  private async validateImageFile(file: Express.Multer.File): Promise<string[]> {
    const errors: string[] = [];

    // Check image file signatures
    const signatures = {
      jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
      png: [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
      gif: [Buffer.from([0x47, 0x49, 0x46])],
      webp: [Buffer.from([0x52, 0x49, 0x46, 0x46])],
    };

    const fileStart = file.buffer.slice(0, 4);
    let validSignature = false;

    for (const [format, sigs] of Object.entries(signatures)) {
      console.log(format);
      for (const sig of sigs) {
        if (fileStart.slice(0, sig.length).equals(sig)) {
          validSignature = true;
          break;
        }
      }
      if (validSignature) break;
    }

    if (!validSignature && file.mimetype.startsWith('image/')) {
      errors.push('Invalid image file signature');
    }

    return errors;
  }

  private async extractCsvMetadata(file: Express.Multer.File): Promise<any> {
    try {
      const content = file.buffer.toString('utf-8');
      const lines = content.split('\n').filter((line) => line.trim());
      const headers = lines[0]?.split(',').map((h) => h.trim()) || [];

      return {
        rowCount: lines.length - 1, // Excluding header
        columnCount: headers.length,
        headers,
        encoding: 'utf-8',
      };
    } catch {
      return { error: 'Failed to extract CSV metadata' };
    }
  }

  private async extractImageMetadata(file: Express.Multer.File): Promise<any> {
    // Basic image metadata - you might want to use a library like 'sharp' for more details
    return {
      format: file.mimetype.split('/')[1],
      sizeBytes: file.size,
    };
  }
}
