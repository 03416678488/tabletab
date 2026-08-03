import {
  registerDecorator,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@ValidatorConstraint({ async: true })
@Injectable()
export class IsEntityExistDecorator implements ValidatorConstraintInterface {
  constructor(private readonly dataSource: DataSource) {}

  async validate(value: any, args: ValidationArguments): Promise<boolean> {
    const [repoName, columnName] = args.constraints;

    // Dynamically fetch the repository
    const repository: Repository<any> = this.dataSource.getRepository(repoName);

    if (!repository) {
      throw new Error(`Repository ${repoName} not found.`);
    }

    // Check if the record exists
    const record = await repository.findOne({ where: { [columnName]: value } });

    // Return `true` if the entity exists, otherwise `false`
    return !!record;
  }

  defaultMessage(args: ValidationArguments): string {
    const [repoName] = args.constraints;
    return `${repoName} not exit`;
  }
}

export function IsEntityExist(repoName: string, columnName: string) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: {
        message: `${repoName} not exit`,
      },
      constraints: [repoName, columnName],
      validator: IsEntityExistDecorator,
    });
  };
}
