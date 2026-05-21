import { Module } from '@nestjs/common';
import { PrevidenciasController } from './previdencias.controller';
import { PrevidenciasService } from './previdencias.service';

@Module({
  controllers: [PrevidenciasController],
  providers: [PrevidenciasService],
  exports: [PrevidenciasService],
})
export class PrevidenciasModule {}
