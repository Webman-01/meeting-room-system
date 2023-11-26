import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import * as crypto from 'crypto';
//加密密码的md5方法
export function md5(str) {
  const hash = crypto.createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}
//用户列表友善的提示
export function generateParseIntPipe(name) {
  return new ParseIntPipe({
    exceptionFactory() {
      throw new BadRequestException(name + '应传数字');
    },
  });
}
