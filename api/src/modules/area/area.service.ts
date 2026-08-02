import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { Area } from './entities/area.entity';
import { AreaValidatorService } from './services/area-validator.service';
import { AreaHelperService } from './services/area.helper.service';
import { CreateAreaDto, UpdateAreaDto, GetAreaQueryDto } from './dto';

/** Main area flow only — validation + normalization live in the sibling services. */
@Injectable()
export class AreaService extends AbstractService<Area> {
  constructor(
    @InjectRepository(Area)
    protected readonly repository: Repository<Area>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: AreaValidatorService,
    private readonly _helper: AreaHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetAreaQueryDto): Promise<Paginated<Area>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(query, this.repository, where, [], undefined, {
      name: 'ASC',
    });
  }

  getById(id: string): Promise<Area> {
    return this._validator.ensureExists(id);
  }

  async createArea(dto: CreateAreaDto): Promise<Area> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateArea(id: string, dto: UpdateAreaDto): Promise<Area> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteArea(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
