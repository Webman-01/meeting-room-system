import { ApiProperty } from '@nestjs/swagger';
import { MeetingRoomVo } from './meeting-room.vo';

//在meetingRoomVo的基础上加个totalCount
export class MeetingRoomListVo {
  @ApiProperty({
    type: [MeetingRoomVo],
  })
  meetingRooms: Array<MeetingRoomVo>;

  @ApiProperty()
  totalCount: number;
}
