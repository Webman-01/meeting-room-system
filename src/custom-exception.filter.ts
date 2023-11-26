import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response.statusCode = exception.getStatus();

    const res = exception.getResponse() as { message: string[] };

    response
      .json({
        code: exception.getStatus(),
        message: 'fail',
        //如果有 response.message 就优先用那个，否则就取 exception.message
        data: res?.message?.join ? res?.message?.join(',') : exception.message,
      })
      .end();
  }
}
