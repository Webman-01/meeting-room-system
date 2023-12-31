//对于userService中的findUserInfoById方法只需要一部份的user信息

import { ApiProperty } from '@nestjs/swagger';

//此user用于封装返回的结果
export class UserInfoVo {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  nickName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  isFrozen: boolean;

  @ApiProperty()
  createTime: Date;
}
