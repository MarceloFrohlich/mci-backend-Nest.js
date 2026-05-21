import { Module } from '@nestjs/common';
import { FranqueadorasController } from './franqueadoras.controller';
import { FranqueadorasService } from './franqueadoras.service';

@Module({
  controllers: [FranqueadorasController],
  providers: [FranqueadorasService],
  exports: [FranqueadorasService],
})
export class FranqueadorasModule {}
