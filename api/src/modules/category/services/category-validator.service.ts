import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Category } from '../entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from '../dto';

@Injectable()
export class CategoryValidatorService extends AbstractService<Category> {
  constructor(
    @InjectRepository(Category)
    protected readonly repository: Repository<Category>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateCategoryDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: string, dto: UpdateCategoryDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, id);
  }

  async ensureExists(id: string): Promise<Category> {
    const category = await this.repository.findOne({ where: { id } });
    if (!category) {
      this._errors.add('category', 'Category not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return category;
  }

  private async checkNameExists(name: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: { name, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (exists) {
      this._errors.add('name', 'A category with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
