import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';

import { TransactionService } from '@services/transaction.service';
import { Language } from './entities/language.entity';
import { CreateLanguageDto, UpdateLanguageDto } from './dto/language.dto';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language)
    private readonly _repo: Repository<Language>,
    private readonly _transactionService: TransactionService,
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
    // Atomic: saving the language and clearing any previous default must happen
    // together, or two languages could end up flagged as default.
    const saved = await this._transactionService.execute(
      async (queryRunner) => {
        const row = await queryRunner.manager.save(
          Language,
          this._repo.create(dto),
        );
        if (dto.isDefault)
          await this.makeSoleDefault(row.id, queryRunner.manager);
        return row;
      },
    );
    return this.getById(saved.id);
  }

  async update(id: number, dto: UpdateLanguageDto): Promise<Language> {
    await this.getById(id);
    await this._transactionService.execute(async (queryRunner) => {
      await queryRunner.manager.update(Language, id, dto);
      if (dto.isDefault) await this.makeSoleDefault(id, queryRunner.manager);
    });
    return this.getById(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.getById(id);
    await this._repo.delete(id);
    return { message: 'Language deleted' };
  }

  /** Only one language may be the default. Runs on the caller's transaction. */
  private async makeSoleDefault(
    id: number,
    manager: EntityManager,
  ): Promise<void> {
    await manager.update(Language, { id: Not(id) }, { isDefault: false });
  }
}
