import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { FoodType } from '../entities/food-type.entity';
import { CreateFoodTypeDto, UpdateFoodTypeDto } from '../dto';

@Injectable()
export class FoodTypeValidatorService extends AbstractService<FoodType> {
  constructor(
    @InjectRepository(FoodType)
    protected readonly repository: Repository<FoodType>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateFoodTypeDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: string, dto: UpdateFoodTypeDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, id);
  }

  async ensureExists(id: string): Promise<FoodType> {
    const foodType = await this.repository.findOne({ where: { id } });
    if (!foodType) {
      this._errors.add('foodType', 'Food type not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return foodType;
  }

  private async checkNameExists(name: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: { name, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (exists) {
      this._errors.add('name', 'A food type with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
