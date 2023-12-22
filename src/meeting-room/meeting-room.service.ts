import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private repository: Repository<MeetingRoom>;

  initData() {
    const room1 = new MeetingRoom();
    room1.name = '木星';
    room1.capacity = '10';
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '金星';
    room2.capacity = '5';
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '天王星';
    room3.capacity = '30';
    room3.equipment = '白板，电视';
    room3.location = '三层东';

    this.repository.save([room1, room2, room3]);
  }

  //根据传入的页面个每页的大小获取会议室信息
  async find(
    pageNo: number,
    pageSize: number,
    name: string,
    capacity: string,
    equipment: string,
  ) {
    if (pageNo < 1) {
      throw new BadRequestException('页码最小为1');
    }
    const skipCount = (pageNo - 1) * pageSize; //跳过的页码

    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }
    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }
    if (capacity) {
      condition.capacity = Like(`%${capacity}%`);
    }

    const [meetingRooms, totalCount] = await this.repository.findAndCount({
      //skip 用于指定要跳过的记录数，take 用于指定要检索的记录数。
      skip: skipCount,
      take: pageSize,
      where: condition,
    });
    return { meetingRooms, totalCount };
  }
  //新增会议室
  async create(meetingRoomDto: CreateMeetingRoomDto) {
    //校验会议室名字不能重复
    const room = await this.repository.findOneBy({
      name: meetingRoomDto.name,
    });
    if (room) {
      throw new BadRequestException('会议室名已存在');
    }
    return await this.repository.save(meetingRoomDto);
  }

  findAll() {
    return `This action returns all meetingRoom`;
  }

  findOne(id: number) {
    return `This action returns a #${id} meetingRoom`;
  }
  //通过id找会议室
  async findById(id: number) {
    return await this.repository.findOneBy({
      id,
    });
  }
  //更新会议室
  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    // 先查询一下，如果查不到就返回会议室不存在
    // 否则，更新会议室信息
    // 这里的 description 和 equipment 因为可以不传，所以要判断下，传了才更新
    const meetingRoom = await this.repository.findOneBy({
      id: meetingRoomDto.id,
    });
    if (!meetingRoom) {
      throw new BadRequestException('会议室不存在');
    }
    meetingRoom.capacity = meetingRoomDto.capacity;
    meetingRoom.location = meetingRoomDto.location;
    meetingRoom.name = meetingRoomDto.name;
    //校验更改过的会议室名不能和已有的相同
    const room = await this.repository.findOneBy({
      name: meetingRoom.name,
    });
    if (room) {
      throw new BadRequestException('会议室名已存在');
    }
    if (meetingRoomDto.description) {
      meetingRoom.description = meetingRoomDto.description;
    }
    if (meetingRoomDto.equipment) {
      meetingRoom.equipment = meetingRoomDto.equipment;
    }
    await this.repository.update(
      {
        id: meetingRoom.id,
      },
      meetingRoom,
    );

    return 'success';
  }
  //删除会议室
  async delete(id: number) {
    await this.repository.delete({ id });
    return 'success';
  }
}
