import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import type { Response } from 'express';
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const details = exception instanceof HttpException ? exception.getResponse() : null;
    if (!(exception instanceof HttpException)) this.logger.error('Unhandled request failure', exception instanceof Error ? exception.stack : undefined);
    const payload = typeof details === 'object' && details !== null ? details : {};
    const message = 'message' in payload ? payload.message : 'Internal server error';
    response.status(status).json({
      code: 'code' in payload ? payload.code : status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED',
      message, statusCode: status,
      ...('dependencies' in payload ? {dependencies:payload.dependencies} : {}),
      ...('fieldErrors' in payload ? {fieldErrors:payload.fieldErrors} : {}),
    });
  }
}
