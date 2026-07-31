import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Staff } from './entities/staff.entity';
import { StaffValidatorService } from './services/staff-validator.service';
import { StaffHelperService } from './services/staff.helper.service';
import { CreateStaffDto, UpdateStaffDto, GetStaffQueryDto } from './dto';

/**
 * Main staff flow only — validation lives in StaffValidatorService and
 * normalization/query building in StaffHelperService.
 */
@Injectable()
export class StaffService extends AbstractService<Staff> {
  constructor(
    @InjectRepository(Staff)
    protected readonly repository: Repository<Staff>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: StaffValidatorService,
    private readonly _helper: StaffHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetStaffQueryDto): Promise<Paginated<Staff>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, ['branch']);
  }

  getById(id: string): Promise<Staff> {
    return this._validator.ensureExists(id);
  }

  async createStaff(dto: CreateStaffDto): Promise<Staff> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateStaff(id: string, dto: UpdateStaffDto): Promise<Staff> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteStaff(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
