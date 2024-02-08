import { ApiProperty } from '@nestjs/swagger';
import { MeetingRoomVo } from 'src/meeting-room/vo/meeting-room.vo';
import { UserInfoVo } from 'src/user/vo/user-info.vo';

class BookingItem {
  @ApiProperty()
  id: number;

  @ApiProperty()
  startTime: Date;

  @ApiProperty()
  endTime: Date;

  @ApiProperty()
  status: String;

  @ApiProperty()
  note: String;

  @ApiProperty()
  createTime: Date;

  @ApiProperty()
  updateTime: Date;

  @ApiProperty()
  user: UserInfoVo;

  @ApiProperty()
  meetingRoom: MeetingRoomVo;
}
export class BookingListVo {
  @ApiProperty({
    type: [BookingItem],
  })
  bookings: BookingItem[];

  @ApiProperty()
  totalCount: Number;
}
