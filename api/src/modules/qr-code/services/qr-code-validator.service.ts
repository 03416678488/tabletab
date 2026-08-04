import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';
import { Table } from '@modules/table/entities/table.entity';

import { QrCode } from '../entities/qr-code.entity';
import { CreateQrCodeDto, UpdateQrCodeDto } from '../dto';

@Injectable()
export class QrCodeValidatorService extends AbstractService<QrCode> {
  constructor(
    @InjectRepository(QrCode)
    protected readonly repository: Repository<QrCode>,
    @InjectRepository(Table)
    private readonly _tableRepository: Repository<Table>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateQrCodeDto): Promise<void> {
    await this.ensureTableExists(dto.tableId);
    await this.checkTableHasNoQr(dto.tableId);
  }

  async validateUpdate(id: string, dto: UpdateQrCodeDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.tableId !== undefined) {
      await this.ensureTableExists(dto.tableId);
      await this.checkTableHasNoQr(dto.tableId, id);
    }
  }

  /** Fetch a QR code (+ table, area, branch) or raise a 404. */
  async ensureExists(id: string): Promise<QrCode> {
    const qrCode = await this.repository.findOne({
      where: { id },
      relations: ['table', 'table.area', 'table.branch'],
    });
    if (!qrCode) {
      this._errors.add('qrCode', 'QR code not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return qrCode;
  }

  private async ensureTableExists(tableId: string): Promise<void> {
    const table = await this._tableRepository.findOne({ where: { id: tableId } });
    if (!table) {
      this._errors.add('tableId', 'Table not found');
      this._errors.throwNotFoundErrorIfExists();
    }
  }

  private async checkTableHasNoQr(
    tableId: string,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.findOne({
      where: {
        tableId,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (exists) {
      this._errors.add('tableId', 'This table already has a QR code');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
