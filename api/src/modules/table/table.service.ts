import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { tablesChannel } from '@modules/realtime/channels';

import { Table } from './entities/table.entity';
import { TableValidatorService } from './services/table-validator.service';
import { TableHelperService } from './services/table.helper.service';
import { CreateTableDto, UpdateTableDto, GetTableQueryDto } from './dto';

/** Main table flow only — validation + normalization live in the sibling services. */
@Injectable()
export class TableService extends AbstractService<Table> {
  constructor(
    @InjectRepository(Table)
    protected readonly repository: Repository<Table>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: TableValidatorService,
    private readonly _helper: TableHelperService,
    private readonly _realtime: RealtimeService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Nudge the tenant's floor views to reconcile after a table change. */
  private emitTablesChanged(): void {
    this._realtime.publish(tablesChannel(this._req.tenant?.id), 'tables.changed', {});
  }

  getAll(query: GetTableQueryDto): Promise<Paginated<Table>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, ['branch', 'area']);
  }

  getById(id: string): Promise<Table> {
    return this._validator.ensureExists(id);
  }

  async createTable(dto: CreateTableDto): Promise<Table> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    const table = await this.getById(saved.id);
    this.emitTablesChanged();
    return table;
  }

  async updateTable(id: string, dto: UpdateTableDto): Promise<Table> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    const table = await this.getById(id);
    this.emitTablesChanged();
    return table;
  }

  async deleteTable(id: string) {
    await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emitTablesChanged();
    return result;
  }
}
