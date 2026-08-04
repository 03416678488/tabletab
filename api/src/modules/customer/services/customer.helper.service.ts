import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, ILike } from 'typeorm';

import { trimSpaces } from '@cor/helpers';

import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto, UpdateCustomerDto, GetCustomerQueryDto } from '../dto';

/** Pure resolver helpers — normalization, defaults and query building. */
@Injectable()
export class CustomerHelperService {
  resolveCreatePayload(dto: CreateCustomerDto): Partial<Customer> {
    return {
      name: trimSpaces(dto.name),
      phone: dto.phone ? trimSpaces(dto.phone) : null,
      email: dto.email ? trimSpaces(dto.email) : null,
      address: dto.address ? trimSpaces(dto.address) : null,
      isActive: dto.isActive ?? true,
    };
  }

  resolveUpdatePayload(dto: UpdateCustomerDto): Partial<Customer> {
    const payload: Partial<Customer> = { ...dto };
    if (typeof payload.name === 'string') payload.name = trimSpaces(payload.name);
    if (typeof payload.phone === 'string') payload.phone = trimSpaces(payload.phone);
    if (typeof payload.email === 'string') payload.email = trimSpaces(payload.email);
    if (typeof payload.address === 'string')
      payload.address = trimSpaces(payload.address);
    return payload;
  }

  resolveListFilters(query: GetCustomerQueryDto): FindOptionsWhere<Customer> {
    const where: FindOptionsWhere<Customer> = {};
    if (query.search) where.name = ILike(`%${trimSpaces(query.search)}%`);
    return where;
  }
}
