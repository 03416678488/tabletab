import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Branch } from '@modules/branch/entities/branch.entity';

import { Staff } from '../entities/staff.entity';
import { CreateStaffDto, UpdateStaffDto } from '../dto';

@Injectable()
export class StaffValidatorService extends AbstractService<Staff> {
  constructor(
    @InjectRepository(Staff)
    protected readonly repository: Repository<Staff>,
    @InjectRepository(Branch)
    private readonly _branchRepository: Repository<Branch>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateStaffDto): Promise<void> {
    await this.checkEmailExists(this.normalize(dto.email));
    if (dto.branchId) await this.ensureBranchExists(dto.branchId);
  }

  async validateUpdate(id: string, dto: UpdateStaffDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.email) await this.checkEmailExists(this.normalize(dto.email), id);
    if (dto.branchId) await this.ensureBranchExists(dto.branchId);
  }

  /** Fetch a staff member (+ branch) or raise a 404. */
  async ensureExists(id: string): Promise<Staff> {
    const staff = await this.repository.findOne({
      where: { id },
      relations: ['branch'],
    });
    if (!staff) {
      this._errors.add('staff', 'Staff member not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return staff;
  }

  private async checkEmailExists(email: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: { email, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (exists) {
      this._errors.add('email', 'A staff member with this email already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this._branchRepository.findOne({ where: { id: branchId } });
    if (!branch) {
      this._errors.add('branchId', 'Branch not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }
}
