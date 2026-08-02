import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Area } from '@modules/area/entities/area.entity';

import { Table } from '../entities/table.entity';
import { CreateTableDto, UpdateTableDto } from '../dto';

@Injectable()
export class TableValidatorService extends AbstractService<Table> {
  constructor(
    @InjectRepository(Table)
    protected readonly repository: Repository<Table>,
    @InjectRepository(Branch)
    private readonly _branchRepository: Repository<Branch>,
    @InjectRepository(Area)
    private readonly _areaRepository: Repository<Area>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateTableDto): Promise<void> {
    if (dto.branchId) await this.ensureBranchExists(dto.branchId);
    if (dto.areaId) await this.ensureAreaExists(dto.areaId);
    await this.checkNameInBranch(dto.name, dto.branchId ?? null);
  }

  async validateUpdate(id: string, dto: UpdateTableDto): Promise<void> {
    const existing = await this.ensureExists(id);
    if (dto.branchId) await this.ensureBranchExists(dto.branchId);
    if (dto.areaId) await this.ensureAreaExists(dto.areaId);
    if (dto.name !== undefined) {
      const branchId =
        dto.branchId !== undefined ? dto.branchId : existing.branchId;
      await this.checkNameInBranch(dto.name, branchId ?? null, id);
    }
  }

  /** Fetch a table (+ branch) or raise a 404. */
  async ensureExists(id: string): Promise<Table> {
    const table = await this.repository.findOne({
      where: { id },
      relations: ['branch', 'area'],
    });
    if (!table) {
      this._errors.add('table', 'Table not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return table;
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this._branchRepository.findOne({ where: { id: branchId } });
    if (!branch) {
      this._errors.add('branchId', 'Branch not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async ensureAreaExists(areaId: string): Promise<void> {
    const area = await this._areaRepository.findOne({ where: { id: areaId } });
    if (!area) {
      this._errors.add('areaId', 'Area not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async checkNameInBranch(
    name: string,
    branchId: string | null,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.findOne({
      where: {
        name,
        branchId: branchId ?? IsNull(),
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (exists) {
      this._errors.add('name', 'A table with this name already exists in this branch');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
