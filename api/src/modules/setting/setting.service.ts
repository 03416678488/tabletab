import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Setting } from './entities/setting.entity';
import { DEFAULT_SETTINGS, PUBLIC_GROUPS } from './setting.constants';

export type GroupedSettings = Record<string, Record<string, string>>;

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly _repo: Repository<Setting>,
  ) {}

  /** All settings grouped: { group: { key: value } }. Optionally restrict groups. */
  async getGrouped(groups?: string[]): Promise<GroupedSettings> {
    const rows = groups?.length
      ? await this._repo.find({ where: { group: In(groups) } })
      : await this._repo.find();

    const out: GroupedSettings = {};
    for (const g of groups ?? Object.keys(DEFAULT_SETTINGS)) out[g] = {};
    for (const row of rows) {
      out[row.group] ??= {};
      out[row.group][row.key] = row.value ?? '';
    }
    return out;
  }

  /** Public (storefront/app) subset. */
  getPublic(): Promise<GroupedSettings> {
    return this.getGrouped(PUBLIC_GROUPS);
  }

  async getGroup(group: string): Promise<Record<string, string>> {
    return (await this.getGrouped([group]))[group] ?? {};
  }

  /** Upsert all key-value pairs for a group. */
  async saveGroup(
    group: string,
    values: Record<string, string>,
  ): Promise<Record<string, string>> {
    for (const [key, value] of Object.entries(values)) {
      const existing = await this._repo.findOne({ where: { group, key } });
      if (existing) {
        existing.value = value ?? '';
        await this._repo.save(existing);
      } else {
        await this._repo.save(this._repo.create({ group, key, value: value ?? '' }));
      }
    }
    return this.getGroup(group);
  }
}
