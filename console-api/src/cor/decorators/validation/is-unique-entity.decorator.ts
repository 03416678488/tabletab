import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { DataSource } from 'typeorm';
import { RequestContextService } from '../request-context/request-context.service';

@Injectable()
@ValidatorConstraint({ async: true })
export class IsUniqueEntityDecorator implements ValidatorConstraintInterface {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly contextService: RequestContextService,
  ) {}

  async validate(value: any, args: any): Promise<boolean> {
    const [repositoryName, column, idField] = args.constraints;

    // Get Repository
    const repository = this.dataSource.getRepository(repositoryName);

    // Try to get request params
    const request = this.contextService.get<Request>();
    const routeParamId = (request as any)?.params?.[idField];

    const objectWithId = args.object as any;
    const bodyId = objectWithId[idField];

    const id = routeParamId ?? bodyId;

    if (id) {
      const existingRecord = await repository
        .createQueryBuilder()
        .where(`${column} = :value`, { value })
        .andWhere(`id != :id`, { id })
        .getOne();

      return !existingRecord;
    } else {
      // Create logic (ensure no record exists with the same value)
      const existingRecord = await repository.findOne({
        where: { [column]: value },
      });
      return !existingRecord;
    }
  }

  defaultMessage(args: any) {
    return `${args.property} must be unique. A record with the same value already exists.`;
  }
}

export function IsUniqueEntity(
  repositoryName: string,
  column: string,
  idField: string = 'id',
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [repositoryName, column, idField],
      validator: IsUniqueEntityDecorator,
    });
  };
}
