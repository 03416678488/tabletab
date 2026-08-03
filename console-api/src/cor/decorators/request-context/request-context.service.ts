import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage();

  run(callback: (...args: any[]) => void, data: any) {
    this.asyncLocalStorage.run(data, callback);
  }

  get<T = any>(): T | undefined {
    return this.asyncLocalStorage.getStore() as T;
  }
}
