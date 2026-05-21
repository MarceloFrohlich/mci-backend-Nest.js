import { Module } from '@nestjs/common';
import { PlpsController } from './plps.controller';
import { PlpsService } from './plps.service';

@Module({
  controllers: [PlpsController],
  providers: [PlpsService],
})
export class PlpsModule {}
