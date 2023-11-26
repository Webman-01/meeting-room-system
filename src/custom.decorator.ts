import {
  ExecutionContext,
  SetMetadata,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';

//自定义一些装饰器
//守卫装饰器
//是否需要登陆
export const RequireLogin = () => SetMetadata('require-login', true);
//该角色是否有需要的权限(接收用户传递的需要的permission)
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata('require-permission', permissions);

//参数装饰器
// UserInfo 装饰器是用来取 user 信息传入 handler 的。
// 传入属性名的时候，返回对应的属性值，否则返回全部的 user 信息。
export const UserInfo = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (!request.user) {
      return null;
    }
    return data ? request.user[data] : request.user;
  },
);
