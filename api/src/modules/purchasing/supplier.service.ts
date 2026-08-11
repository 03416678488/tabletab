import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';
import { escapeLikePattern } from '@cor/helpers/query.helper';

import { Supplier } from './entities/supplier.entity';
import {
  CreateSupplierDto,
  GetSupplierQueryDto,
  UpdateSupplierDto,
} from './dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectRepository(Supplier)
    private readonly _suppliers: Repository<Supplier>,
    private readonly _pagination: PaginationProvider,
  ) {}

  getAll(query: GetSupplierQueryDto): Promise<Paginated<Supplier>> {
    const where: Record<string, unknown> = {};
    if (query.search)
      where.name = ILike(`%${escapeLikePattern(query.search)}%`);
    if (query.isActive !== undefined)
      where.isActive = query.isActive === 'true';
    return this._pagination.paginationQuery(
      query,
      this._suppliers,
      where,
      [],
      undefined,
      {
        name: 'ASC',
      },
    );
  }

  getById(id: string): Promise<Supplier> {
    return this.ensureExists(id);
  }

  create(dto: CreateSupplierDto): Promise<Supplier> {
    return this._suppliers.save(this._suppliers.create(dto));
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.ensureExists(id);
    await this._suppliers.update(id, dto);
    return this.ensureExists(id);
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.ensureExists(id);
    // Purchase orders keep their history (supplierId → null via FK SET NULL).
    await this._suppliers.delete(id);
    return { message: 'Supplier deleted successfully.' };
  }

  private async ensureExists(id: string): Promise<Supplier> {
    const supplier = await this._suppliers.findOne({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found.');
    return supplier;
  }
}
