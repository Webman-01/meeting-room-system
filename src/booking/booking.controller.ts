import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  DefaultValuePipe,
  HttpStatus,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { generateParseIntPipe } from 'src/utils';
import { RequireLogin, UserInfo } from 'src/custom.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingListVo } from './vo/booking-list.vo';

@ApiTags('会议室预订模块')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  //获取预订列表
  @ApiBearerAuth()
  @ApiQuery({
    name: 'pageNo',
    description: '第几页',
    type: Number,
  })
  @ApiQuery({
    name: 'pageSize',
    description: '每页几条',
    type: Number,
  })
  @ApiQuery({
    name: 'username',
    description: '用户名',
    type: String,
  })
  @ApiQuery({
    name: 'meetingRoomName',
    description: '会议室名称',
    type: String,
  })
  @ApiQuery({
    name: 'meetingRoomPosition',
    description: '会议室位置',
    type: String,
  })
  @ApiQuery({
    name: 'bookingTimeRangeStar',
    description: '预订开始时间',
    type: Number,
  })
  @ApiQuery({
    name: 'bookingTimeRangeEnd',
    description: '预订结束时间',
    type: Number,
  })
  @ApiResponse({
    description: '预订列表',
    type: BookingListVo,
  })
  @Get('list')
  async list(
    @Query('pageNo', new DefaultValuePipe(1), generateParseIntPipe('pageNo'))
    pageNo: number,
    @Query(
      'pageSize',
      new DefaultValuePipe(10),
      generateParseIntPipe('pageSize'),
    )
    pageSize: number,
    @Query('username') username: string,
    @Query('meetingRoomName') meetingRoomName: string,
    @Query('meetingRoomPosition') meetingRoomPosition: string,
    @Query('bookingTimeRangeStart') bookingTimeRangeStart: number,
    @Query('bookingTimeRangeEnd') bookingTimeRangeEnd: number,
  ) {
    return this.bookingService.find(
      pageNo,
      pageSize,
      username,
      meetingRoomName,
      meetingRoomPosition,
      bookingTimeRangeStart,
      bookingTimeRangeEnd,
    );
  }
  //预订会议室
  @ApiBearerAuth()
  @ApiBody({
    type: CreateBookingDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '预订失败/时间冲突',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '预订成功',
  })
  @Post('add')
  @RequireLogin()
  async add(
    @Body() booking: CreateBookingDto,
    @UserInfo('userId') userId: number,
  ) {
    await this.bookingService.add(booking, userId);
  }

  //通过申请
  @Get('apply/:id')
  async apply(@Param('id') id: number) {
    return this.bookingService.apply(id);
  }
  //拒绝申请
  @Get('reject/:id')
  async reject(@Param('id') id: number) {
    return this.bookingService.reject(id);
  }
  //解除
  @Get('unbind/:id')
  async unbind(@Param('id') id: number) {
    return this.bookingService.unbind(id);
  }
  //催办
  @Get('urge/:id')
  async urge(@Param('id') id: number) {
    return this.bookingService.urge(id);
  }
  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingService.create(createBookingDto);
  }

  @Get()
  findAll() {
    return this.bookingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBookingDto: UpdateBookingDto) {
    return this.bookingService.update(+id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bookingService.remove(+id);
  }
}
