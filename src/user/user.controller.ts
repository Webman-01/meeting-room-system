import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Inject,
  Query,
  UnauthorizedException,
  ParseIntPipe,
  BadRequestException,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import { UserInfoVo } from './vo/user-info.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { generateParseIntPipe } from 'src/utils';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Inject(EmailService)
  private emailService: EmailService;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(JwtService)
  private jwtService: JwtService;

  @Inject(ConfigService)
  private configService: ConfigService;

  //注册
  @Post('register')
  async register(@Body() registerUser: RegisterUserDto) {
    return await this.userService.register(registerUser);
  }

  //用户端登陆
  @Post('login')
  async login(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, false);

    //access_token
    //jwtService.sign添加认证
    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        //过期时间
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    //refresh_token
    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );
    return vo;
  }
  //后台管理登陆
  @Post('admin/login')
  async adminLogin(@Body() loginUser: LoginUserDto) {
    const vo = await this.userService.login(loginUser, true);
    vo.accessToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
        username: vo.userInfo.username,
        roles: vo.userInfo.roles,
        permissions: vo.userInfo.permissions,
      },
      {
        //过期时间
        expiresIn:
          this.configService.get('jwt_access_token_expires_time') || '30m',
      },
    );

    //refresh_token
    vo.refreshToken = this.jwtService.sign(
      {
        userId: vo.userInfo.id,
      },
      {
        expiresIn:
          this.configService.get('jwt_refresh_token_expires_time') || '7d',
      },
    );
    return vo;
  }

  //刷新token
  @Get('refresh')
  async refresh(@Query('refreshToken') refreshToken: string) {
    try {
      //解码
      const data = this.jwtService.verify(refreshToken);

      const user = await this.userService.findUserById(data.userId, false);

      //重新生成accessToken和refreshToken
      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );
      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expires_time') || '7d',
        },
      );
      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('token已失效,请重新登录');
    }
  }
  //后台管理的刷新token
  @Get('admin/refresh')
  async adminRefresh(@Query('refreshToken') refreshToken: string) {
    try {
      const data = this.jwtService.verify(refreshToken);
      const user = await this.userService.findUserById(data.userId, true);
      const access_token = this.jwtService.sign(
        {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          permissions: user.permissions,
        },
        {
          expiresIn:
            this.configService.get('jwt_access_token_expires_time') || '30m',
        },
      );
      const refresh_token = this.jwtService.sign(
        {
          userId: user.id,
        },
        {
          expiresIn:
            this.configService.get('jwt_refresh_token_expires_time') || '7d',
        },
      );
      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      throw new UnauthorizedException('token已失效,请重新登录');
    }
  }

  //发送验证码
  @Get('register-captcha')
  async captcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(`captcha_${address}`, code, 5 * 60);

    await this.emailService.sendMail({
      to: address,
      subject: '注册验证码',
      html: `<p>你的注册验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //查询用户信息
  @Get('info')
  @RequireLogin()
  //@UserInfo从request.user 取 userId 注入 handler
  async info(@UserInfo('userId') userId: number) {
    const user = await this.userService.findUserInfoById(userId);
    //返回值封装成vo
    const vo = new UserInfoVo();
    vo.email = user.email;
    vo.username = user.username;
    vo.avatar = user.avatar;
    vo.phoneNumber = user.phoneNumber;
    vo.nickName = user.nickName;
    vo.createTime = user.createTime;
    vo.isFrozen = user.isFrozen;

    return vo;
  }

  //修改密码接口(管理员和普通用户修改密码的页面是一样的，所以只用写一个接口)
  @Post(['update_password', 'admin/update_password'])
  @RequireLogin()
  //用 @UserInfo 从 request.user 取 userId，其余的通过 dto 传
  async updatePassword(
    @UserInfo('userId') userId: number,
    @Body() passwordDto: UpdateUserPasswordDto,
  ) {
    return await this.userService.updatePassword(userId, passwordDto);
  }
  ////修改密码时发送验证码
  @Get('update_password/captcha')
  async updatePasswordCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_password_captcha_${address}`,
      code,
      10 * 60,
    );
    await this.emailService.sendMail({
      to: address,
      subject: '更改密码的验证码',
      html: `<p>你的更改密码验证码${code}</p>`,
    });
    return '发送验证码成功';
  }

  //修改用户信息接口
  @Post(['update_userInfo', 'admin/update_userInfo'])
  @RequireLogin()
  async updateUserInfo(
    @UserInfo('userId') userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUserInfo(userId, updateUserDto);
  }
  //修改信息发送验证码
  @Get('updateUserInfo/captcha')
  async updateCaptcha(@Query('address') address: string) {
    const code = Math.random().toString().slice(2, 8);

    await this.redisService.set(
      `update_user_captcha_${address}`,
      code,
      10 * 60,
    );

    await this.emailService.sendMail({
      to: address,
      subject: '更改用户信息验证码',
      html: `<p>你的验证码是 ${code}</p>`,
    });
    return '发送成功';
  }

  //冻结用户接口
  @Get('freeze')
  //从query取id
  async freeze(@Query('id') userId: number) {
    await this.userService.freezeUserById(userId);
    return 'ok';
  }

  //用户列表(接口支持分页查询，传入 pageNo、pageSize，返回对应页的数据)
  //new DefaultValuePipe用于设置没传参数时的默认值
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(2),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('nickName') nickName: string,
    @Query('email') email: string,
  ) {
    return await this.userService.findUserByPage(
      username,
      nickName,
      email,
      pageNo,
      pageSize,
    );
  }

  @Get('init-data')
  async initData() {
    await this.userService.initData();
    return 'done';
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
