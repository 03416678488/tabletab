import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { QrCode } from './entities/qr-code.entity';
import { QrCodeValidatorService } from './services/qr-code-validator.service';
import { QrCodeHelperService } from './services/qr-code.helper.service';
import { CreateQrCodeDto, UpdateQrCodeDto, GetQrCodeQueryDto } from './dto';

/** Main QR-code flow only — validation + normalization live in the sibling services. */
@Injectable()
export class QrCodeService extends AbstractService<QrCode> {
  constructor(
    @InjectRepository(QrCode)
    protected readonly repository: Repository<QrCode>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: QrCodeValidatorService,
    private readonly _helper: QrCodeHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetQrCodeQueryDto): Promise<Paginated<QrCode>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [
      'table',
      'table.area',
      'table.branch',
    ]);
  }

  getById(id: string): Promise<QrCode> {
    return this._validator.ensureExists(id);
  }

  async createQrCode(dto: CreateQrCodeDto): Promise<QrCode> {
    await this._validator.validateCreate(dto);
    const saved = await this.create(this._helper.resolveCreatePayload(dto));
    return this.getById(saved.id);
  }

  async updateQrCode(id: string, dto: UpdateQrCodeDto): Promise<QrCode> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteQrCode(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
