import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Tax } from './entities/tax.entity';
import { TaxGroup } from './entities/tax-group.entity';
import { CreateTaxGroupDto, UpdateTaxGroupDto } from './dto/tax-group.dto';

@Injectable()
export class TaxGroupService {
  constructor(
    @InjectRepository(TaxGroup)
    private readonly _repo: Repository<TaxGroup>,
    @InjectRepository(Tax)
    private readonly _taxRepo: Repository<Tax>,
  ) {}

  getAll(branchId?: string): Promise<TaxGroup[]> {
    return this._repo.find({
      where: branchId ? { branchId } : {},
      order: { id: 'ASC' },
    });
  }

  async getById(id: number): Promise<TaxGroup> {
    const found = await this._repo.findOne({ where: { id } });
    if (!found) throw new NotFoundException('Tax group not found');
    return found;
  }

  private taxesFor(ids: number[]): Promise<Tax[]> {
    return ids.length
      ? this._taxRepo.find({ where: { id: In(ids) } })
      : Promise.resolve([]);
  }

  async create(dto: CreateTaxGroupDto): Promise<TaxGroup> {
    const group = this._repo.create({
      name: dto.name,
      code: dto.code ?? null,
      isActive: dto.isActive ?? true,
      branchId: dto.branchId ?? null,
      taxes: await this.taxesFor(dto.taxIds),
    });
    return this._repo.save(group);
  }

  async update(id: number, dto: UpdateTaxGroupDto): Promise<TaxGroup> {
    const group = await this.getById(id);
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.code !== undefined) group.code = dto.code;
    if (dto.isActive !== undefined) group.isActive = dto.isActive;
    if (dto.taxIds !== undefined) group.taxes = await this.taxesFor(dto.taxIds);
    return this._repo.save(group);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Tax group deleted' };
  }
}
