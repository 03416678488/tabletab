import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { TimeSlot } from './entities/time-slot.entity';
import { CreateTimeSlotDto, UpdateTimeSlotDto } from './dto/time-slot.dto';

@Injectable()
export class TimeSlotService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly _repo: Repository<TimeSlot>,
  ) {}

  getAll(): Promise<TimeSlot[]> {
    return this._repo.find({ order: { startTime: 'ASC' } });
  }

  async getById(id: number): Promise<TimeSlot> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Time slot not found');
    return found;
  }

  create(dto: CreateTimeSlotDto): Promise<TimeSlot> {
    return this._repo.save(this._repo.create(dto));
  }

  async update(id: number, dto: UpdateTimeSlotDto): Promise<TimeSlot> {
    await this.getById(id);
    await this._repo.update(id, dto);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Time slot deleted' };
  }
}
