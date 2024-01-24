import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({
    message: '会议室名不能为空',
  })
  @IsNumber()
  meetingRoomId: number;

  @IsNotEmpty({
    message: '开始时间不能为空',
  })
  @IsNumber()
  startTime: number;

  @IsNotEmpty({
    message: '结束时间不能为空',
  })
  @IsNumber()
  endTime: number;

  @IsString()
  text: string;
}
