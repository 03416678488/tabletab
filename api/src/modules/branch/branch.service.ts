import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { TenantRequest } from '@modules/tenancy/tenancy.types';
import { RealtimeService } from '@modules/realtime/realtime.service';
import { branchesChannel } from '@modules/realtime/channels';

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
    private readonly _realtime: RealtimeService,
    @Inject(REQUEST) private readonly _req: TenantRequest,
  ) {
    super(repository, pagination);
  }

  /** Nudge the storefront to reconcile branches (open/online/delivery/pickup). */
  private emitBranchesChanged(id: string): void {
    this._realtime.publish(branchesChannel(this._req.tenant?.id), 'branch.changed', { id });
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
    const branch = await this.create(this._helper.resolveCreatePayload(dto));
    this.emitBranchesChanged(branch.id);
    return branch;
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<Branch> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    const branch = await this.getById(id);
    this.emitBranchesChanged(branch.id);
    return branch;
  }

  async deleteBranch(id: string) {
    await this._validator.ensureExists(id);
    const result = await this.delete(id);
    this.emitBranchesChanged(id);
    return result;
  }
}
