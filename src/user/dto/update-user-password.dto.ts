import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class UpdateUserPasswordDto {
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
  @IsNotEmpty({
    message: '验证码不能为空',
  })
  captcha: string;
}
