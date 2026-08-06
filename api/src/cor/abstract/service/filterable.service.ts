import {
  FindOptionsOrder,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { toILikeContains } from '@cor/helpers/query.helper';
import { parseFilterQuery } from '@cor/query/parse-filter-query';
import { conditionsToWhere } from '@cor/query/conditions-to-where';
import { ListQueryOptions, QueryConfig } from '@cor/query/pagination.types';
import { PaginationProvider } from '@modules/common/pagination/pagination.provider';
import { PaginationQueryDto } from '@modules/common/pagination/dto/pagination-query.dto';
import { Paginated } from '@modules/common/pagination/interface/pagination.interface';

export abstract class FilterableService<T extends ObjectLiteral> {
  protected abstract readonly queryConfig: QueryConfig<T>;

  constructor(
    protected readonly repository: Repository<T>,
    protected readonly paginationProvider: PaginationProvider,
  ) {}

  protected async list(
    rawQuery: Record<string, string>,
    listOptions: ListQueryOptions,
    scope: FindOptionsWhere<T> = {},
    relations: string[] = [],
    select: FindOptionsSelect<T> = {},
  ): Promise<Paginated<T>> {
    const where = this.buildWhere(rawQuery, listOptions.q, scope);
    const order = this.buildOrder(listOptions);

    const paginationQuery: PaginationQueryDto = {
      page: listOptions.page ?? 1,
      perPage: listOptions.perPage ?? 20,
    };

    return this.paginationProvider.paginationQuery<T>(
      paginationQuery,
      this.repository,
      where,
      relations,
      select,
      order,
    );
  }

  protected buildWhere(
    rawQuery: Record<string, string>,
    search: string | undefined,
    scope: FindOptionsWhere<T>,
  ): FindOptionsWhere<T> {
    const urlConditions = parseFilterQuery(rawQuery);
    const urlFilters = conditionsToWhere<T>(
      urlConditions,
      this.queryConfig.filterableFields as (keyof T)[],
    );

    const searchFilters = this.buildSearchFilter(search);

    return {
      ...urlFilters,
      ...searchFilters,
      ...scope,
    } as FindOptionsWhere<T>;
  }

  protected buildSearchFilter(search: string | undefined): FindOptionsWhere<T> {
    if (!search?.trim()) return {} as FindOptionsWhere<T>;
    const [first] = this.queryConfig.searchableFields;
    if (!first) return {} as FindOptionsWhere<T>;

    return { [first]: toILikeContains(search) } as FindOptionsWhere<T>;
  }

  protected buildOrder(listOptions: ListQueryOptions): FindOptionsOrder<T> {
    const { sortBy, sortOrder } = listOptions;
    const defaultSort = this.queryConfig.defaultSort;

    const field = sortBy && this.isFilterable(sortBy) ? (sortBy as keyof T) : defaultSort?.field;
    // The direction is interpolated into ORDER BY by TypeORM, so it must be
    // normalized to a literal — never pass a request string through untouched.
    const order =
      sortOrder === 'ASC' || sortOrder === 'DESC'
        ? sortOrder
        : (defaultSort?.order ?? 'DESC');

    if (!field) return {} as FindOptionsOrder<T>;
    return { [field]: order } as FindOptionsOrder<T>;
  }

  private isFilterable(field: string): boolean {
    return (this.queryConfig.filterableFields as string[]).includes(field);
  }
}
