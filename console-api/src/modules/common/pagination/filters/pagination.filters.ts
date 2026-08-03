import { Between, FindOptionsWhere, In } from 'typeorm';
import { isStringNotNull } from '@cor/helpers/string.helpers';
import { toLikeOperator } from '@cor/helpers/query.helper';
import { notEmpty } from '@cor/helpers/object.helpers';
import { User } from '@modules/user/entities/users.entity';
import { QueryParamConditions } from '../interface/pagination.interface';

export class PaginationFilters<T> {
  private where: FindOptionsWhere<T> = {} as FindOptionsWhere<T>;

  constructor(
    private _filters: QueryParamConditions,
    private user?: User,
  ) {}

  public applyId(): this {
    const { id } = this._filters;

    if (isStringNotNull(id) || id !== null) {
      this.where = {
        ...this.where,
        id: id,
      };
    }
    return this;
  }

  public applyName(): this {
    const { name } = this._filters;

    if (isStringNotNull(name)) {
      this.where = {
        ...this.where,
        name: toLikeOperator(name),
      };
    }
    return this;
  }

  public applyEmail(): this {
    const { email } = this._filters;

    if (isStringNotNull(email)) {
      this.where = {
        ...this.where,
        email: toLikeOperator(email),
      };
    }
    return this;
  }

  public applyCreatedAt(): this {
    const { createdAt } = this._filters;

    if (createdAt) {
      const { from, to } = createdAt;

      if (from && to) {
        this.where = {
          ...this.where,
          createdAt: Between(from, to),
        };
      }

      if (from) {
        // this.where = {};
      }
    }
    return this;
  }

  public applyGroups(): this {
    const { groups } = this._filters;

    if (notEmpty(groups)) {
      this.where = {
        ...this.where,
        groups: {
          name: In(groups),
          user: {
            id: this.user.id,
          },
        },
      };
    }
    return this;
  }

  public build(): FindOptionsWhere<T> {
    return this.where;
  }
}
