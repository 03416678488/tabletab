import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Customer } from './entities/customer.entity';
import { CustomerValidatorService } from './services/customer-validator.service';
import { CustomerHelperService } from './services/customer.helper.service';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomerQueryDto } from './dto';

/** Main customer flow only — validation + normalization live in the sibling services. */
@Injectable()
export class CustomerService extends AbstractService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: CustomerValidatorService,
    private readonly _helper: CustomerHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetCustomerQueryDto): Promise<Paginated<Customer>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      name: 'ASC',
    });
  }

  getById(id: string): Promise<Customer> {
    return this._validator.ensureExists(id);
  }

  createCustomer(dto: CreateCustomerDto): Promise<Customer> {
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateCustomer(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    await this._validator.ensureExists(id);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteCustomer(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
