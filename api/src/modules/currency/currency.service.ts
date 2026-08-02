import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto, UpdateCurrencyDto } from './dto/currency.dto';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private readonly _repo: Repository<Currency>,
  ) {}

  getAll(): Promise<Currency[]> {
    return this._repo.find({ order: { name: 'ASC' } });
  }

  async getById(id: number): Promise<Currency> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Currency not found');
    return found;
  }

  create(dto: CreateCurrencyDto): Promise<Currency> {
    return this._repo.save(this._repo.create(dto));
  }

  async update(id: number, dto: UpdateCurrencyDto): Promise<Currency> {
    await this.getById(id);
    await this._repo.update(id, dto);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Currency deleted' };
  }
}
