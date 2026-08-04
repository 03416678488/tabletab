import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Table } from '@modules/table/entities/table.entity';
import { Branch } from '@modules/branch/entities/branch.entity';

import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../dto';

@Injectable()
export class OrderValidatorService extends AbstractService<Order> {
  constructor(
    @InjectRepository(Order)
    protected readonly repository: Repository<Order>,
    @InjectRepository(Table)
    private readonly _tableRepository: Repository<Table>,
    @InjectRepository(Branch)
    private readonly _branchRepository: Repository<Branch>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateOrderDto): Promise<void> {
    if (dto.orderType === 'table' && !dto.tableId) {
      this._errors.add('tableId', 'A table is required for table orders');
      this._errors.throwBadRequestErrorIfExists();
    }
    if (dto.tableId) await this.ensureTableExists(dto.tableId);
    if (dto.branchId) await this.ensureBranchExists(dto.branchId);
  }

  /** Fetch an order (+ table, branch, items) or raise a 404. */
  async ensureExists(id: string): Promise<Order> {
    const order = await this.repository.findOne({
      where: { id },
      relations: ['table', 'table.area', 'branch', 'customer', 'items'],
    });
    if (!order) {
      this._errors.add('order', 'Order not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return order;
  }

  private async ensureTableExists(tableId: string): Promise<void> {
    const table = await this._tableRepository.findOne({ where: { id: tableId } });
    if (!table) {
      this._errors.add('tableId', 'Table not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this._branchRepository.findOne({ where: { id: branchId } });
    if (!branch) {
      this._errors.add('branchId', 'Branch not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }
}
