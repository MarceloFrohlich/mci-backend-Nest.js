import { Module } from '@nestjs/common';
import { CopasController } from './copas.controller';
import { CopasService } from './copas.service';

@Module({
  controllers: [CopasController],
  providers: [CopasService],
  exports: [CopasService],
})
export class CopasModule {}
