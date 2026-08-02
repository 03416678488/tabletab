import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CustomerService } from './customer.service';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomerQueryDto } from './dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly _customerService: CustomerService) {}

  @Get()
  getAll(@Query() query: GetCustomerQueryDto) {
    return this._customerService.getAll(query);
  }

  @Get(':id')
  getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this._customerService.getById(id);
  }

  @Post()
  create(@Body() dto: CreateCustomerDto) {
    return this._customerService.createCustomer(dto);
  }

  @Put(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this._customerService.updateCustomer(id, dto);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this._customerService.deleteCustomer(id);
  }
}
