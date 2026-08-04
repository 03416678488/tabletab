import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Language } from './entities/language.entity';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly _repo: Repository<Language>,
  ) {}

  getAll(): Promise<Language[]> {
    return this._repo.find({ order: { id: 'ASC' } });
  }

  async getById(id: number): Promise<Language> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Language not found');
    return found;
  }

  async create(dto: CreateLanguageDto): Promise<Language> {
    const saved = await this._repo.save(this._repo.create(dto));
    if (dto.isDefault) await this.makeSoleDefault(saved.id);
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateLanguageDto): Promise<Language> {
    await this.getById(id);
    await this._repo.update(id, dto);
    if (dto.isDefault) await this.makeSoleDefault(id);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Language deleted' };
  }

  /** Only one language may be the default. */
  private async makeSoleDefault(id: number): Promise<void> {
    await this._repo.update({ id: Not(id) }, { isDefault: false });
  }
}
