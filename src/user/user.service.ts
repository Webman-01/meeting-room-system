import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Like, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register-user.dto';
import { RedisService } from 'src/redis/redis.service';
import { md5 } from 'src/utils';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginUserVo } from './vo/login-user.vo';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
import { UserListVo } from './vo/user-list.vo';

@Injectable()
export class UserService {
  // 创建 logger 对象
  private logger = new Logger();

  // 注入 Repository<User>
  //A:这里注入 Repository 需要在 UserModule 里引入下 TypeOrm.forFeature
  @InjectRepository(User)
  private userRepository: Repository<User>;
  @InjectRepository(Role)
  private roleRepository: Repository<Role>;
  @InjectRepository(Permission)
  private permissionRepository: Repository<Permission>;

  //注入redisService
  @Inject(RedisService)
  private redisService: RedisService;

  //注册
  async register(user: RegisterUserDto) {
    //1.按照email查询redis中的验证码
    const captcha = await this.redisService.get(`captcha_${user.email}`);
    //判断
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (user.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }

    //2.按照username查询用户表
    const foundUser = await this.userRepository.findOneBy({
      username: user.username,
    });
    if (foundUser) {
      throw new HttpException('该用户已存在', HttpStatus.BAD_REQUEST);
    }
    //3.保存新的user到数据库
    const newUser = new User();
    newUser.username = user.username;
    newUser.password = md5(user.password);
    newUser.email = user.email;
    newUser.nickName = user.nickName;
    //向数据库中存储数据
    try {
      await this.userRepository.save(newUser);
      return '注册成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '注册失败';
    }
  }

  //登陆
  async login(loginUser: LoginUserDto, isAdmin: boolean) {
    //根据 username 和 isAdmin 查询数据库
    const user = await this.userRepository.findOne({
      where: {
        username: loginUser.username,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    //验证用户
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    }
    //验证密码
    if (user.password != md5(loginUser.password)) {
      throw new HttpException('密码错误', HttpStatus.BAD_REQUEST);
    }
    //封装返回的数据
    const vo = new LoginUserVo();
    vo.userInfo = {
      id: user.id,
      username: user.username,
      nickName: user.nickName,
      email: user.email,
      avatar: user.avatar,
      phoneNumber: user.phoneNumber,
      isFrozen: user.isFrozen,
      isAdmin: user.isAdmin,
      createTime: user.createTime.getTime(),
      roles: user.roles.map((item) => item.name),
      //permissions 是users中所有 roles 的 permissions 的合并，要去下重
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          //arr中没有该permission就添加进去
          if (arr.indexOf(permission) == -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
    return vo;
  }

  //通过id找user(生成token需要的部份user信息)
  async findUserById(userId: number, isAdmin: boolean) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isAdmin,
      },
      relations: ['roles', 'roles.permissions'],
    });
    //返回accessToken需要的在login-vo中的类型+isAdmin的类型
    return {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      email: user.email,
      roles: user.roles.map((item) => item.name),
      permissions: user.roles.reduce((arr, item) => {
        item.permissions.forEach((permission) => {
          if (arr.indexOf(permission) == -1) {
            arr.push(permission);
          }
        });
        return arr;
      }, []),
    };
  }
  //查询用户(全部信息)
  async findUserInfoById(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });
    return user;
  }

  //修改密码方法
  async updatePassword(passwordDto: UpdateUserPasswordDto) {
    //1.检查验证码是否正确
    const captcha = await this.redisService.get(
      `update_password_captcha_${passwordDto.email}`,
    );
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    if (passwordDto.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }
    //2.找到对应的用户
    const foundUser = await this.userRepository.findOneBy({
      username: passwordDto.username,
    });
    if (foundUser.email != passwordDto.email) {
      throw new HttpException('邮箱不正确', HttpStatus.BAD_REQUEST);
    }
    //更改密码(把原有的密码改为传入的)
    foundUser.password = md5(passwordDto.password);
    try {
      //保存修改
      await this.userRepository.save(foundUser);
      return '修改密码成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '修改密码失败';
    }
  }

  //更改用户信息
  async updateUserInfo(userId: number, updateUserDto: UpdateUserDto) {
    //1.获取并验证验证码正确性
    const captcha = await this.redisService.get(
      `update_user_captcha_${updateUserDto.email}`,
    );
    if (!captcha) {
      throw new HttpException('验证码已失效', HttpStatus.BAD_REQUEST);
    }
    //输入的验证码不是redis中的存储的验证码
    if (updateUserDto.captcha != captcha) {
      throw new HttpException('验证码错误', HttpStatus.BAD_REQUEST);
    }
    //2.获取用户信息
    const foundUser = await this.userRepository.findOneBy({
      id: userId,
    });
    //3.修改信息(如果有传入头像信息就修改)
    if (updateUserDto.avatar) {
      foundUser.avatar = updateUserDto.avatar;
    }
    if (updateUserDto.nickName) {
      foundUser.nickName = updateUserDto.nickName;
    }
    //4.存储改动到数据库
    try {
      await this.userRepository.save(foundUser);
      return '用户信息修改成功';
    } catch (error) {
      this.logger.error(error, UserService);
      return '用户信息修改失败';
    }
  }

  //冻结用户
  async freezeUserById(id: number) {
    const user = await this.userRepository.findOneBy({
      id,
    });
    //把用户的是否冻结字段设为true
    user.isFrozen = true;
    //存储修改
    await this.userRepository.save(user);
  }

  //用户列表
  async findUserByPage(
    username: string,
    nickName: string,
    email: string,
    pageNo: number,
    pageSize: number,
  ) {
    //pageNo:当前的页数，pageSize:一页几个
    //分页查询只要计算出当前页码跳过多少条记录，取多少条记录
    const skipCount = (pageNo - 1) * pageSize; //跳过的个数
    const condition: Record<string, any> = {}; //Record<string, any>声明一种键值结构的对象

    //如果有传入用户名就进行模糊匹配，然后返回
    if (username) {
      condition.username = Like(`%${username}%`); //Like用于模糊匹配,%${username}% 表示要匹配的模式是：在用户名的任意位置都可以包含任意数量的字符（包括零个字符），并且模式与 username 的值进行匹配,  % 符号可以实现模糊匹配的效果
    }
    if (nickName) {
      condition.nickName = Like(`%${nickName}%`);
    }
    if (email) {
      condition.email = Like(`%${email}%`);
    }

    const [users, totalCount] = await this.userRepository.findAndCount({
      //findAndCount根据指定的条件在用户存储库中查找匹配的用户，并返回两个值：一个是满足条件的用户列表，另一个是满足条件的用户数量。
      //查询条件:
      select: [
        'id',
        'username',
        'nickName',
        'email',
        'phoneNumber',
        'isFrozen',
        'avatar',
        'createTime',
      ], //指定查询返回用户的哪些信息
      skip: skipCount, //跳过几页
      take: pageSize, //每页的记录数
      where: condition, //限制查询结果
    });
    const vo = new UserListVo();
    vo.users = users;
    vo.totalCount = totalCount;
    return vo;
  }

  async initData() {
    const user1 = new User();
    user1.username = 'zhangsan';
    user1.password = md5('111111');
    user1.email = 'xxx@xx.com';
    user1.isAdmin = true;
    user1.nickName = '张三';
    user1.phoneNumber = '13233323333';

    const user2 = new User();
    user2.username = 'lisi';
    user2.password = md5('222222');
    user2.email = 'yy@yy.com';
    user2.nickName = '李四';

    const role1 = new Role();
    role1.name = '管理员';

    const role2 = new Role();
    role2.name = '普通用户';

    const permission1 = new Permission();
    permission1.code = 'ccc';
    permission1.description = '访问 ccc 接口';

    const permission2 = new Permission();
    permission2.code = 'ddd';
    permission2.description = '访问 ddd 接口';

    user1.roles = [role1];
    user2.roles = [role2];

    role1.permissions = [permission1, permission2];
    role2.permissions = [permission1];

    await this.permissionRepository.save([permission1, permission2]);
    await this.roleRepository.save([role1, role2]);
    await this.userRepository.save([user1, user2]);
  }

  create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
