import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { EventType } from '../entities/event-type.entity';
import { CreateEventTypeDto, UpdateEventTypeDto } from '../dto';

@Injectable()
export class EventTypeValidatorService extends AbstractService<EventType> {
  constructor(
    @InjectRepository(EventType)
    protected readonly repository: Repository<EventType>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateEventTypeDto): Promise<void> {
    await this.checkNameExists(dto.name, dto.branchId ?? null);
  }

  async validateUpdate(id: string, dto: UpdateEventTypeDto): Promise<void> {
    const existing = await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, existing.branchId, id);
  }

  async ensureExists(id: string): Promise<EventType> {
    const eventType = await this.repository.findOne({ where: { id } });
    if (!eventType) {
      this._errors.add('eventType', 'Event type not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return eventType;
  }

  private async checkNameExists(
    name: string,
    branchId: string | null,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.findOne({
      where: {
        name,
        branchId: branchId ?? null,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (exists) {
      this._errors.add('name', 'An event type with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
