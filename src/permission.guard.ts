import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable } from 'rxjs';

@Injectable()
export class PermissionGuard implements CanActivate {
  @Inject(Reflector)
  private reflector: Reflector;

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    //用 reflector 取出 handler 或者 controller 上的 require-permission 的 metadata。如果没有，就是不需要权限，直接放行，返回 true。
    if (!request.user) {
      return true;
    }
    //对于需要的每个权限，检查下用户是否拥有(比较该接口标识的权限和请求到该用户拥有的权限)
    const permissions = request.user.permissions;
    const requirePermissions = this.reflector.getAllAndOverride<string[]>(
      'require-permission',
      [context.getClass(), context.getHandler()],
    );
    // console.log(permissions, '@');
    // console.log(requirePermissions, '#');

    //不需要权限验证直接放行
    if (!requirePermissions) {
      return true;
    }
    for (let i = 0; i < requirePermissions.length; i++) {
      const curPermission = requirePermissions[i];
      //查看获取到的permissions中的code(自己定义的相当于权限名称)  是否是当前要的权限
      const found = permissions.find((item) => item.code == curPermission);
      if (!found) {
        throw new UnauthorizedException('没有访问该接口的权限');
      }
    }
    return true;
  }
}
