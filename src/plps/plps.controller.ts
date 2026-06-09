import { Controller, Get, Post, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlpsService } from './plps.service';
import { CriarPlpDto } from './dto/plp.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('PLPs')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('plps')
export class PlpsController {
  constructor(private readonly plpsService: PlpsService) {}

  @ApiOperation({ summary: 'Lista PLPs de uma previdência' })
  @Get('por-previdencia/:id')
  listarPorPrevidencia(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.plpsService.listarPorPrevidencia(id, usuario);
  }

  @ApiOperation({ summary: 'Cria PLP — calcula NPS e recalcula automaticamente a média da previdência' })
  @Post()
  criar(@Body() dto: CriarPlpDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.plpsService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Remove PLP e recalcula média da previdência' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.plpsService.remover(id, usuario);
  }
}
