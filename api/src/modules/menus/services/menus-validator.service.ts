import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { AbstractService } from '@cor/abstract/service/abstract-service.service';
import { ErrorProvider } from '@modules/common/error/error.provider';

import { Menu } from '../entities/menu.entity';
import { CreateMenuDto, UpdateMenuDto } from '../dto';

@Injectable()
export class MenusValidatorService extends AbstractService<Menu> {
  constructor(
    @InjectRepository(Menu)
    protected readonly repository: Repository<Menu>,
    private readonly _errors: ErrorProvider,
  ) {
    super(repository);
  }

  async validateCreate(dto: CreateMenuDto): Promise<void> {
    await this.checkNameExists(dto.name);
  }

  async validateUpdate(id: string, dto: UpdateMenuDto): Promise<void> {
    await this.ensureExists(id);
    if (dto.name) await this.checkNameExists(dto.name, id);
  }

  async ensureExists(id: string): Promise<Menu> {
    const menu = await this.repository.findOne({ where: { id } });
    if (!menu) {
      this._errors.add('menu', 'Menu not found');
      this._errors.throwNotFoundErrorIfExists();
    }
    return menu;
  }

  private async checkNameExists(name: string, excludeId?: string): Promise<void> {
    const exists = await this.repository.findOne({
      where: { name, ...(excludeId ? { id: Not(excludeId) } : {}) },
    });
    if (exists) {
      this._errors.add('name', 'A menu with this name already exists');
      this._errors.throwConflictErrorIfExists();
    }
  }
}
