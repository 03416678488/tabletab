import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { KioskMachine } from './entities/kiosk-machine.entity';
import {
  CreateKioskMachineDto,
  UpdateKioskMachineDto,
} from './dto/kiosk-machine.dto';

@Injectable()
export class KioskMachineService {
  constructor(
    @InjectRepository(KioskMachine)
    private readonly _repo: Repository<KioskMachine>,
  ) {}

  getAll(): Promise<KioskMachine[]> {
    return this._repo.find({ relations: ['branch'], order: { id: 'DESC' } });
  }

  async getById(id: number): Promise<KioskMachine> {
    const found = await this._repo.findOne({ where: { id }, relations: ['branch'] });
    if (!found) throw new NotFoundException('Kiosk machine not found');
    return found;
  }

  async create(dto: CreateKioskMachineDto): Promise<KioskMachine> {
    const saved = await this._repo.save(this._repo.create(dto));
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateKioskMachineDto): Promise<KioskMachine> {
    await this.getById(id);
    await this._repo.update(id, dto);
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Kiosk machine deleted' };
  }
}
