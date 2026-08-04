import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MulterConfig } from '@config/multer.config';
import { FileManagerController } from '@modules/file-manager/file-manager.controller';
import { FileManagerService } from '@modules/file-manager/file-manager.service';
import { File } from '@modules/file-manager/entities/file.entity';
import { FileMetadata } from '@modules/file-manager/entities/file-metadata.entity';
import { FileManagerValidatorService } from '@modules/file-manager/services/file-manager-validator.service';
import { FileModule } from '@modules/common/file/file.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([File, FileMetadata]),
    MulterModule.register(MulterConfig),
    FileModule,
  ],
  controllers: [FileManagerController],
  providers: [FileManagerService, FileManagerValidatorService],
  exports: [FileManagerService, MulterModule],
})
export class FileManagerModule {}
