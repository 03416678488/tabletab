import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseSuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const message = data?.message;

        if (message) {
          delete data.message;
        }

        return {
          _metaData: {
            statusCode: response.statusCode,
            message: message ?? 'Success',
          },
          data,
        };
      }),
    );
  }
}
