import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class ResponseExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      _metaData: {
        statusCode: status,
        message:
          exception instanceof HttpException
            ? (exception.getResponse() as any).message || exception.message
            : 'Internal server error',
      },
      error: exception instanceof HttpException ? exception.name : 'InternalError',
      developmentError: null,
    };

    // Only include developmentError for internal server errors (500)
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      errorResponse.developmentError = {
        errorDetails: exception,
      };
    }

    response.status(status).json(errorResponse);
  }
}
