import { Inject, Injectable } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import {
  FindManyOptions,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { FindOptionsOrder } from 'typeorm/find-options/FindOptionsOrder';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Paginated } from './interface/pagination.interface';

@Injectable()
export class PaginationProvider {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  public async paginationQuery<T extends ObjectLiteral>(
    paginationQueryDto: PaginationQueryDto,
    repository: Repository<T>,
    where?: FindOptionsWhere<T>,
    relations?: string[],
    select?: FindOptionsSelect<T>,
    order?: FindOptionsOrder<T>,
  ): Promise<Paginated<T>> {
    const { perPage, page } = paginationQueryDto;
    const defaultOrder: FindOptionsOrder<any> = { id: 'DESC' };
    const findOptions: FindManyOptions<T> = {
      take: perPage,
      select: select ?? {},
      where: where ?? {},
      relations: relations ?? [],
      skip: (page - 1) * perPage,
      order: order ?? defaultOrder,
    };

    const [result, totalItems] = await repository.findAndCount(findOptions);
    const totalPages =
      totalItems % perPage === 0 ? totalItems / perPage : Math.floor(totalItems / perPage) + 1;
    const currentPage = page;
    const nextPage = currentPage === totalPages ? page : page + 1;
    const prePage = currentPage === 1 ? page : page - 1;
    const baseUrl = this.request.protocol + '://' + this.request.headers.host + '/';
    const newURL = new URL(this.request.url, baseUrl);

    return {
      items: result,
      meta: {
        itemsPerPage: perPage,
        totalItems: totalItems,
        currentPage: currentPage,
        totalPages: totalPages,
      },
      links: {
        first: `${newURL.origin}${newURL.pathname}?perPage=${perPage}&page=${page}`,
        last: `${newURL.origin}${newURL.pathname}?perPage=${perPage}&page=${totalPages}`,
        current: `${newURL.origin}${newURL.pathname}?perPage=${perPage}&page=${currentPage}`,
        next: `${newURL.origin}${newURL.pathname}?perPage=${perPage}&page=${nextPage}`,
        prev: `${newURL.origin}${newURL.pathname}?perPage=${perPage}&page=${prePage}`,
      },
    };
  }
}
