import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  HttpStatus,
} from '@nestjs/common';
import BaseExceptionFilter from './base-exception.filter';
import { BAD_REQUEST } from '@constants/errors.constants';

@Catch(BadRequestException)
export class BadRequestExceptionFilter extends BaseExceptionFilter {
  constructor() {
    super(BAD_REQUEST, HttpStatus.BAD_REQUEST);
  }

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const error =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, any>).message ||
          exceptionResponse;

    response.status(status).json({
      success: false,
      error: {
        code: 400000,
        message: 'Bad request',
        details: error,
      },
    });
  }
}
