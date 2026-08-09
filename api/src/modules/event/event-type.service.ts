import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

import { EventType } from './entities/event-type.entity';
import { EventTypeValidatorService } from './services/event-type-validator.service';
import { EventTypeHelperService } from './services/event-type.helper.service';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  GetEventTypeQueryDto,
} from './dto';

/** Admin-configurable event-type catalogue — CRUD only. */
@Injectable()
export class EventTypeService extends AbstractService<EventType> {
  constructor(
    @InjectRepository(EventType)
    protected readonly repository: Repository<EventType>,
    protected readonly pagination: PaginationProvider,
    private readonly _validator: EventTypeValidatorService,
    private readonly _helper: EventTypeHelperService,
  ) {
    super(repository, pagination);
  }

  getAll(query: GetEventTypeQueryDto): Promise<Paginated<EventType>> {
    const where = this._helper.resolveListFilters(query);
    return this.pagination.paginationQuery(
      query,
      this.repository,
      where,
      [],
      undefined,
      {
        sortOrder: 'ASC',
      },
    );
  }

  getById(id: string): Promise<EventType> {
    return this._validator.ensureExists(id);
  }

  async createEventType(dto: CreateEventTypeDto): Promise<EventType> {
    await this._validator.validateCreate(dto);
    return this.create(this._helper.resolveCreatePayload(dto));
  }

  async updateEventType(
    id: string,
    dto: UpdateEventTypeDto,
  ): Promise<EventType> {
    await this._validator.validateUpdate(id, dto);
    await this.repository.update(id, this._helper.resolveUpdatePayload(dto));
    return this.getById(id);
  }

  async deleteEventType(id: string) {
    await this._validator.ensureExists(id);
    return this.delete(id);
  }
}
