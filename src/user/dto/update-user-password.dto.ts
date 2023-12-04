import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Matches } from 'class-validator';

export class UpdateUserPasswordDto {
  @IsNotEmpty({
    message: '用户名不能为空',
  })
  @ApiProperty()
  username: string;

  @IsNotEmpty({
    message: '密码不能为空',
  })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).{6,12}$/, {
    message: '密码要同时包含字母和数字且在6-12位之间',
  })
  @ApiProperty()
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
  @ApiProperty()
  email: string;
  @IsNotEmpty({
    message: '验证码不能为空',
  })
  @ApiProperty()
  captcha: string;
}
