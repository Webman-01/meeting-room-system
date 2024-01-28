//dto：接收参数的类型
//vo:封装返回数据

import { ApiProperty } from '@nestjs/swagger';

//entity:数据库表对应的
class UserInfo {
  @ApiProperty()
  id: number;

  @ApiProperty({ example: 'zs' })
  username: string;

  @ApiProperty({ example: '张三' })
  nickName: string;

  // @ApiProperty({ example: 'xx@xx.com' })
  // email: string;

  @ApiProperty({ example: 'xxx.png' })
  avatar: string;

  // @ApiProperty({ example: '12222222222' })
  // phoneNumber: string;

  @ApiProperty()
  isFrozen: boolean;

  @ApiProperty()
  isAdmin: boolean;

  @ApiProperty()
  createTime: number;

  @ApiProperty({ example: ['管理员'] })
  roles: string[];

  @ApiProperty({ example: 'query_aaa' })
  permissions: string[];
}
export class LoginUserVo {
  @ApiProperty()
  userInfo: UserInfo;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
