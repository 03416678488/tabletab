import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsSelect,
  FindOptionsWhere,
  ILike,
  Not,
  Repository,
} from 'typeorm';
import { defer, Observable } from 'rxjs';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { escapeLikePattern } from '@cor/helpers/query.helper';
import { FindOptionsOrder } from 'typeorm/find-options/FindOptionsOrder';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';

export abstract class AbstractService<T> {
  protected constructor(
    protected readonly repository: Repository<T>,
    protected readonly pagination?: PaginationProvider,
  ) {}

  async paginate(
    paginationQueryDto: PaginationQueryDto,
    where?: FindOptionsWhere<T>,
    relations?: string[],
    select?: FindOptionsSelect<T>,
    order?: FindOptionsOrder<T>,
  ) {
    if (!this.pagination) {
      throw new Error('PaginationProvider is not available.');
    }

    return await this.pagination.paginationQuery(
      paginationQueryDto,
      this.repository,
      where,
      relations,
      select,
      order,
    );
  }

  async create(data: DeepPartial<T>): Promise<T> {
    return this.repository.save(data);
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    await this.repository.update(id, data as any);
    return this.repository.findOne({ where: { id } as any });
  }

  async delete(id: number | string) {
    const deleted = await this.repository.delete(id);
    return this.isDeletedSuccessfully(deleted.affected);
  }

  async upsert(conditions: QueryDeepPartialEntity<T>[], columns: string[]) {
    return await this.repository.upsert(conditions, columns);
  }

  async findAll(): Promise<T[]> {
    return await this.repository.find();
  }

  async findOneBy(where: FindOptionsWhere<T>): Promise<T> {
    return await this.repository.findOneBy(where);
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return await this.repository.findOne(options);
  }

  async findWithOption(options: FindManyOptions): Promise<T[]> {
    return await this.repository.find(options);
  }

  async count(where: FindOptionsWhere<T>): Promise<number> {
    return await this.repository.count(where);
  }

  increment(entity: FindOptionsWhere<T>, field: string, incremental: number = 1): Observable<any> {
    return defer(() => this.repository.increment(entity, field, incremental));
  }

  async isRecordExistForCurrentUser(
    field: keyof T,
    value: string | unknown,
    currentId?: number,
  ): Promise<boolean> {
    const where: any = {
      // Escaped so this stays a case-insensitive *equality* check even when
      // the value contains LIKE wildcards (e.g. a name like "50% off").
      [field]: typeof value === 'string' ? ILike(escapeLikePattern(value)) : value,
      ...(currentId && { id: Not(currentId) }),
    };

    const found = await this.repository.findOne({ where });
    return Boolean(found);
  }

  isDeletedSuccessfully(isDeleted: number) {
    if (isDeleted) {
      return {
        message: `${this.repository.metadata.name} deleted successfully.`,
      };
    }
  }

  async validateUniqueFields(
    fields: { value: string; key: string; message: string }[],
    userId?: string,
    currentId?: number | string,
  ): Promise<{ property: string; message: string }[]> {
    const checks = fields.map(async ({ value, key, message }) => {
      if (!value) return null;

      const where: any = { [key]: value };

      if ('userId' in this.repository.metadata.propertiesMap && userId) {
        where.userId = userId;
      }

      const existing = await this.findOneBy(where);

      const entityId = existing?.['id'];
      if (existing && entityId !== currentId) {
        return { property: key, message };
      }

      return null;
    });

    const results = await Promise.all(checks);
    return results.filter(Boolean);
  }

  async exists(where: FindOptionsWhere<T>): Promise<boolean> {
    const existing = await this.repository.findOne({
      where,
    });

    return !!existing;
  }

  success(payload: any) {
    return payload;
  }
}
