import { Controller, Get, Post, Put, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CopasService } from './copas.service';
import { CriarCopaDto, AtualizarCopaDto, FiltrarCopaDto } from './dto/copa.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';

@ApiTags('Copas')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('copas')
export class CopasController {
  constructor(private readonly copasService: CopasService) {}

  @ApiOperation({ summary: 'Lista copas do ano ativo conforme permissões' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.listar(usuario);
  }

  @ApiOperation({ summary: 'Lista copas simplificadas (id + nome) para select' })
  @Get('select')
  listarParaSelect(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.listarParaSelect(usuario);
  }

  @ApiOperation({ summary: 'Lista copas de um departamento específico' })
  @Get('por-departamento/:id')
  porDepartamento(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.porDepartamento(id, usuario);
  }

  @ApiOperation({ summary: 'Busca copa por ID com dados hierárquicos completos' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria copa — aceita múltiplos departamentos (cria uma copa por departamento)' })
  @Post()
  criar(@Body() dto: CriarCopaDto) {
    return this.copasService.criar(dto);
  }

  @ApiOperation({ summary: 'Atualiza dados da copa' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarCopaDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove copa em cascata (jogos, previdências, atualizações, PLPs, observações)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.copasService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Filtra copas por nome, departamento, filial, franqueadora ou período' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarCopaDto) {
    return this.copasService.filtrar(usuario, dto);
  }
}
