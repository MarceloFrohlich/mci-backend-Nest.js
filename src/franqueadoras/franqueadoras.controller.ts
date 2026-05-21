import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FranqueadorasService } from './franqueadoras.service';
import { CriarFranqueadoraDto, AtualizarFranqueadoraDto, FiltrarFranqueadoraDto } from './dto/franqueadora.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Franqueadoras')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('franqueadoras')
export class FranqueadorasController {
  constructor(private readonly franqueadorasService: FranqueadorasService) {}

  @ApiOperation({ summary: 'Lista franqueadoras conforme permissões do solicitante' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.franqueadorasService.listar(usuario);
  }

  @ApiOperation({ summary: 'Busca franqueadora por ID' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.franqueadorasService.buscarPorId(id);
  }

  @ApiOperation({ summary: 'Cria nova franqueadora' })
  @Post()
  criar(@Body() dto: CriarFranqueadoraDto) {
    return this.franqueadorasService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza franqueadora' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarFranqueadoraDto) {
    return this.franqueadorasService.atualizar(id, dto);
  }

  @ApiOperation({ summary: 'Remove franqueadora em cascata (filiais e departamentos)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string) {
    return this.franqueadorasService.remover(id);
  }

  @ApiOperation({ summary: 'Filtra franqueadoras por nome' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarFranqueadoraDto) {
    return this.franqueadorasService.filtrar(usuario, dto);
  }
}
