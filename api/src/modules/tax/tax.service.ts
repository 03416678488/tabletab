import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Tax } from './entities/tax.entity';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(Tax)
    private readonly _repo: Repository<Tax>,
  ) {}

  getAll(): Promise<Tax[]> {
    return this._repo.find({ order: { id: 'ASC' } });
  }

  async getById(id: number): Promise<Tax> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Tax not found');
    return found;
  }

  create(dto: CreateTaxDto): Promise<Tax> {
    return this._repo.save(this._repo.create(dto));
  }

  async update(id: number, dto: UpdateTaxDto): Promise<Tax> {
    await this.getById(id);
    await this._repo.update(id, dto);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Tax deleted' };
  }
}
