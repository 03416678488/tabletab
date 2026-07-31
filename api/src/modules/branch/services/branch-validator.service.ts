import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Branch } from '../entities/branch.entity';
import { CreateBranchDto, UpdateBranchDto } from '../dto';

@Injectable()
export class BranchValidatorService extends AbstractService<Branch> {
  constructor(
    @InjectRepository(Branch)
    protected readonly repository: Repository<Branch>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateBranchDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: string, dto: UpdateBranchDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, id);
  }

  /** Fetch a branch or raise a 404. Reused by get/update/delete flows. */
  async ensureExists(id: string): Promise<Branch> {
    const branch = await this.repository.findOne({ where: { id } });
    if (!branch) {
      this._errors.add('branch', 'Branch not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return branch;
  }

  private async checkNameExists(name: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: {
        name,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });

    if (exists) {
      this._errors.add('name', 'A branch with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
