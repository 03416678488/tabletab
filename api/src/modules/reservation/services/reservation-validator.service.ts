import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Branch } from '@modules/branch/entities/branch.entity';
import { Table } from '@modules/table/entities/table.entity';

import { Reservation } from '../entities/reservation.entity';
import { CreateReservationDto } from '../dto';

@Injectable()
export class ReservationValidatorService extends AbstractService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    protected readonly repository: Repository<Reservation>,
    @InjectRepository(Branch)
    private readonly _branchRepository: Repository<Branch>,
    @InjectRepository(Table)
    private readonly _tableRepository: Repository<Table>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateReservationDto): Promise<void> {
    await this.ensureBranchExists(dto.branchId);
    if (dto.tableId) await this.ensureTableExists(dto.tableId);
  }

  /** Fetch a reservation (+ branch, table) or raise a 404. */
  async ensureExists(id: string): Promise<Reservation> {
    const reservation = await this.repository.findOne({
      where: { id },
      relations: ['branch', 'table'],
    });
    if (!reservation) {
      this._errors.add('reservation', 'Reservation not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return reservation;
  }

  private async ensureBranchExists(branchId: string): Promise<void> {
    const branch = await this._branchRepository.findOne({ where: { id: branchId } });
    if (!branch) {
      this._errors.add('branchId', 'Branch not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async ensureTableExists(tableId: string): Promise<void> {
    const table = await this._tableRepository.findOne({ where: { id: tableId } });
    if (!table) {
      this._errors.add('tableId', 'Table not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }
}
