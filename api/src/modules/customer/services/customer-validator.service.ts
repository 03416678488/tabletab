import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerValidatorService extends AbstractService<Customer> {
  constructor(
    @InjectRepository(Customer)
    protected readonly repository: Repository<Customer>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  /** Fetch a customer or raise a 404. */
  async ensureExists(id: string): Promise<Customer> {
    const customer = await this.repository.findOne({ where: { id } });
    if (!customer) {
      this._errors.add('customer', 'Customer not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return customer;
  }
}
