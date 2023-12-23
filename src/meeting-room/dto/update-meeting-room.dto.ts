import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMeetingRoomDto } from './create-meeting-room.dto';
import { IsNotEmpty } from 'class-validator';

// 这里的 UpdateMeetingRoomDto 和 CreateMeetingRoomDto 基本一样，只是多了个 id。
// 所以直接用 PartialType 继承，然后添加一个 id 即可
export class UpdateMeetingRoomDto extends PartialType(CreateMeetingRoomDto) {
  @ApiProperty()
  @IsNotEmpty({
    message: 'id不能为空',
  })
  id: number;
}
