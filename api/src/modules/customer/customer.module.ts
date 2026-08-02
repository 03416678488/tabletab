import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Customer } from './entities/customer.entity';

import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { CustomerValidatorService } from './services/customer-validator.service';
import { CustomerHelperService } from './services/customer.helper.service';

import { PaginationModule } from '@modules/common/pagination/pagination.module';
import { ErrorModule } from '@modules/common/error/error.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer]),
    PaginationModule,
    ErrorModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService, CustomerValidatorService, CustomerHelperService],
  exports: [CustomerService, TypeOrmModule],
})
export class CustomerModule {}
