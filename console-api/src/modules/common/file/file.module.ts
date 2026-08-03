import { Module } from '@nestjs/common';
import { FileService } from '@modules/common/file/file.service';
import { CSVService } from '@modules/common/file/services/csv.service';

@Module({
  providers: [FileService, CSVService],
  exports: [FileService],
})
export class FileModule {}
