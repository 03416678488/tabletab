import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorMessage = isHttpException
      ? (exception.getResponse() as any).message || exception.message
      : 'Internal server error';

    const errorResponse: any = {
      _metaData: {
        statusCode: status,
        message: isHttpException ? exception.name : 'InternalError',
      },
      errors: errorMessage,
    };

    response.status(status).json(errorResponse);
  }
}
