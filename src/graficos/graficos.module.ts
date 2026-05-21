import { Module } from '@nestjs/common';
import { GraficosController } from './graficos.controller';
import { GraficosService } from './graficos.service';

@Module({
  controllers: [GraficosController],
  providers: [GraficosService],
})
export class GraficosModule {}
