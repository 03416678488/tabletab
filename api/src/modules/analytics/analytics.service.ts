import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Analytics } from './entities/analytics.entity';
import { CreateAnalyticsDto, UpdateAnalyticsDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Analytics)
    private readonly _repo: Repository<Analytics>,
  ) {}

  getAll(): Promise<Analytics[]> {
    return this._repo.find({ order: { id: 'DESC' } });
  }

  async getById(id: number): Promise<Analytics> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Analytics not found');
    return found;
  }

  create(dto: CreateAnalyticsDto): Promise<Analytics> {
    return this._repo.save(this._repo.create(dto));
  }

  async update(id: number, dto: UpdateAnalyticsDto): Promise<Analytics> {
    await this.getById(id);
    await this._repo.update(id, dto);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Analytics deleted' };
  }
}
