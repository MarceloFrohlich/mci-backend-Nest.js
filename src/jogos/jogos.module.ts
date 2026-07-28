import { Module } from '@nestjs/common';
import { LideresModule } from '../lideres/lideres.module';
import { JogosController } from './jogos.controller';
import { JogosService } from './jogos.service';

@Module({
  imports: [LideresModule],
  controllers: [JogosController],
  providers: [JogosService],
  exports: [JogosService],
})
export class JogosModule {}
