//对于userService中的findUserInfoById方法只需要一部份的user信息
//此user用于封装返回的结果
export class UserInfoVo {
  id: number;
  username: string;
  nickName: string;
  email: string;
  avatar: string;
  phoneNumber: string;
  isFrozen: boolean;
  createTime: Date;
}
