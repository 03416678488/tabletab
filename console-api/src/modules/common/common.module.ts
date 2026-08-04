import { Global, Module } from '@nestjs/common';
import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { FileModule } from '@modules/common/file/file.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Global()
@Module({
  imports: [PaginationModule, FileModule, ErrorModule],
  exports: [PaginationModule, FileModule, ErrorModule],
})
export class GlobalAppModules {}
