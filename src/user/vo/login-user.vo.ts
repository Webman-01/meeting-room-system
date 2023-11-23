//dto：接收参数的类型
//vo:封装返回数据
//entity:数据库表对应的
interface UserInfo {
  id: number;

  username: string;

  nickName: string;

  email: string;

  avatar: string;

  phoneNumber: string;

  isFrozen: boolean;

  isAdmin: boolean;

  createTime: number;

  roles: string[];

  permissions: string[];
}
export class LoginUserVo {
  userInfo: UserInfo;

  accessToken: string;

  refreshToken: string;
}
