import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

//封装register方法body里的请求参数
export class RegisterUserDto {
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  username: string;

  @IsNotEmpty({
    message: '昵称不能为空',
  })
  nickName: string;

  @IsNotEmpty({
    message: '密码不能为空',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,12}$/, {
    message: '密码要同时包含字母和数字且在6-12位之间',
  })
  password: string;

  @IsNotEmpty({
    message: '邮箱不能为空',
  })
  @IsEmail(
    {},
    {
      message: '不是合法的邮箱格式',
    },
  )
  email: string;

  //验证码
  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
