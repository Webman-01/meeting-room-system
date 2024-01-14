import { ApiProperty } from '@nestjs/swagger';

export class UserBookingCount {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  bookingCount: string;
}
