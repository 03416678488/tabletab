import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Branch } from './entities/branch.entity';
import { BranchValidatorService } from './services/branch-validator.service';
import { BranchHelperService } from './services/branch.helper.service';
import { CreateBranchDto, UpdateBranchDto, GetBranchQueryDto } from './dto';

/**
 * Main branch flow only — validation lives in BranchValidatorService and
 * normalization/query building in BranchHelperService.
 */
@Injectable()
export class BranchService extends AbstractService<Branch> {
  constructor(
    @InjectRepository(Branch)
    protected readonly repository: Repository<Branch>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: BranchValidatorService,
    private readonly _helper: BranchHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetBranchQueryDto): Promise<Paginated<Branch>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where);
  }

  getById(id: string): Promise<Branch> {
    return this._validator.ensureExists(id);
  }

  async createBranch(dto: CreateBranchDto): Promise<Branch> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteBranch(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
