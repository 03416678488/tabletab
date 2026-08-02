import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Area } from '../entities/area.entity';
import { CreateAreaDto, UpdateAreaDto } from '../dto';

@Injectable()
export class AreaValidatorService extends AbstractService<Area> {
  constructor(
    @InjectRepository(Area)
    protected readonly repository: Repository<Area>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateAreaDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: string, dto: UpdateAreaDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, id);
  }

  async ensureExists(id: string): Promise<Area> {
    const area = await this.repository.findOne({ where: { id } });
    if (!area) {
      this._errors.add('area', 'Area not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return area;
  }

  private async checkNameExists(name: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: { name, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (exists) {
      this._errors.add('name', 'An area with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
