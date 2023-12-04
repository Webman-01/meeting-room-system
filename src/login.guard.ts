import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Permission } from './user/entities/permission.entity';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { UnLoginException } from './unlogin.filter';

//扩展express上的类型
//此类型为jwt解码完数据类型
interface JwtUserData {
  userId: number;
  username: string;
  roles: string[];
  email: string;
  permissions: Permission[];
}
declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}
@Injectable()
export class LoginGuard implements CanActivate {
  //同于获取metadata元数据
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    //获取请求信息
    const request: Request = context.switchToHttp().getRequest();

    //用 reflector 从给目标添加的setMetaData 上拿到 require-login 的 metadata。
    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);
    //如果没有 metadata，就是不需要登录，返回 true 放行
    if (!requireLogin) return true;

    //从响应头上拿到authorization
    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnLoginException();
    }
    try {
      //authorization 的 header 取出 jwt 来，把用户信息设置到 request，然后放行。
      const token = authorization.split(' ')[1]; //取以空格分开的后一个项(就是bearer后面那个)
      const data = this.jwtService.verify<JwtUserData>(token); //解码

      request.user = {
        userId: data.userId,
        username: data.username,
        roles: data.roles,
        email: data.email,
        permissions: data.permissions,
      };
      return true;
    } catch (error) {
      throw new UnauthorizedException('token失效,请重新登录');
    }
  }
}
