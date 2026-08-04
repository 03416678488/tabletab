import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { ErrorPayloadBuilderServices } from './services/error-payload-builder.services';
import { ErrorInterface } from '@modules/common/error/types/error.types';

@Injectable({ scope: Scope.REQUEST })
export class ErrorProvider extends ErrorPayloadBuilderServices {
  private readonly errors: ErrorInterface[] = [];

  add(property: string, message: string): void {
    const exists = this.errors.some((err) => err.property === property && err.message === message);
    if (!exists) this.errors.push({ property, message });
  }

  addMultiple(errors: ErrorInterface[]): void {
    errors.forEach((e) => this.add(e.property, e.message));
  }

  addAndThrowBadRequestError(property: string, message: string) {
    this.add(property, message);
    this.badRequest(this.getErrors());
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): ErrorInterface[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors.length = 0;
  }

  throwBadRequestErrorIfExists() {
    if (this.hasErrors()) {
      this.badRequest(this.getErrors());
    }
  }

  throwNotFoundErrorIfExists() {
    if (this.hasErrors()) {
      this.notFound(this.getErrors());
    }
  }

  throwUnauthorizedErrorIfExists() {
    if (this.hasErrors()) {
      this.unauthorized(this.getErrors());
    }
  }

  throwConflictErrorIfExists() {
    if (this.hasErrors()) {
      this.conflict(this.getErrors());
    }
  }

  badRequest(error: object | any[]): never {
    throw new BadRequestException(error);
  }

  conflict(error: object | any[]): ConflictException {
    throw new ConflictException(error);
  }

  notFound(error: object | any[]): NotFoundException {
    throw new NotFoundException(error);
  }

  unauthorized(error: object | any[]): UnauthorizedException {
    throw new UnauthorizedException(error);
  }

  forbidden(error: object | any[]): ForbiddenException {
    throw new ForbiddenException(error);
  }
}
