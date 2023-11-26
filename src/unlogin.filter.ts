import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

//给exception指定获取异常的类型
export class UnLoginException {
  message: string;
  constructor(message?) {
    this.message = message;
  }
}
@Catch(UnLoginException)
export class UnloginFilter implements ExceptionFilter {
  catch(exception: UnLoginException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    response
      .json({
        code: HttpStatus.UNAUTHORIZED,
        message: 'fail',
        data: exception.message || '用户为登录',
      })
      .end();
  }
}
