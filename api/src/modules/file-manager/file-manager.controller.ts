import {
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
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

  @Get()
  async listFiles(@CurrentUser() user: User) {
    return this.fileManagerServices.listFiles(user.id);
  }

  @Delete(':id')
  async deleteFile(@Param('id', ParseUUIDPipe) id: string) {
    return this.fileManagerServices.deleteFile(id);
  }
}
