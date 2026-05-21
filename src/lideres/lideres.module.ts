import { Module } from '@nestjs/common';
import { LideresController } from './lideres.controller';
import { LideresService } from './lideres.service';

@Module({
  controllers: [LideresController],
  providers: [LideresService],
  exports: [LideresService],
})
export class LideresModule {}
