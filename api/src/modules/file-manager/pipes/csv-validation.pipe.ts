import { Injectable, PipeTransform } from '@nestjs/common';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { FileService } from '@modules/common/file/file.service';

@Injectable()
export class CsvValidationPipe implements PipeTransform {
  constructor(private readonly fileService: FileService) {}

  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    const errors = new ErrorProvider();

    if (!file) {
      errors.addAndThrowBadRequestError('file', 'CSV file is required.');
    }

    if (!this.fileService.csv.hasValidCsvExtension(file)) {
      errors.addAndThrowBadRequestError('file', 'Invalid file type. Allowed types: .csv');
    }

    const [hasData, hasValidContent] = await Promise.all([
      this.fileService.csv.hasCsvData(file),
      this.fileService.csv.hasValidCsvContent(file),
    ]);

    if (!hasData) {
      errors.addAndThrowBadRequestError('file', 'CSV file should contain at least one data row');
    }

    if (!hasValidContent) {
      errors.addAndThrowBadRequestError('file', `CSV must contain 'email' header`);
    }

    return file;
  }
}
