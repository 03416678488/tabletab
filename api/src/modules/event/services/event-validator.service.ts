import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Event } from '../entities/event.entity';
import { EventType } from '../entities/event-type.entity';
import { CreateEventDto } from '../dto';

@Injectable()
export class EventValidatorService extends AbstractService<Event> {
  constructor(
    @InjectRepository(Event)
    protected readonly repository: Repository<Event>,
    @InjectRepository(EventType)
    private readonly _eventTypeRepository: Repository<EventType>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateEventDto): Promise<void> {
    if (dto.eventTypeId) await this.ensureEventTypeExists(dto.eventTypeId);
  }

  async ensureExists(id: string): Promise<Event> {
    const event = await this.repository.findOne({
      where: { id },
      relations: ['branch', 'eventType'],
    });
    if (!event) {
      this._errors.add('event', 'Event not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return event;
  }

  private async ensureEventTypeExists(id: string): Promise<void> {
    const exists = await this._eventTypeRepository.findOne({ where: { id } });
    if (!exists) {
      this._errors.add('eventTypeId', 'Selected event type does not exist');
      this._errors.throwNotFoundErrorIfExists();
    }
  }
}
