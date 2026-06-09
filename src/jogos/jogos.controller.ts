import { Controller, Get, Post, Put, Patch, Body, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiPropertyOptional } from '@nestjs/swagger';
import { JogosService } from './jogos.service';
import { CriarJogoDto, AtualizarJogoDto, FiltrarJogoDto, ReplicarJogoDto } from './dto/jogo.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsuarioAtual } from '../common/decorators/usuario-atual.decorator';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { IsOptional, IsString } from 'class-validator';

class AtualizarStatusDto {
  @ApiPropertyOptional({ description: 'Status do jogo', example: 'ativo' })
  @IsOptional() @IsString() status?: string;
  @ApiPropertyOptional({ description: 'Valor associado ao status', example: '100' })
  @IsOptional() @IsString() valor?: string;
}

@ApiTags('Jogos')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('jogos')
export class JogosController {
  constructor(private readonly jogosService: JogosService) {}

  @ApiOperation({ summary: 'Lista jogos do ano ativo conforme permissões' })
  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.listar(usuario);
  }

  @ApiOperation({ summary: 'Lista jogos simplificados (id + nome) para select' })
  @Get('select')
  listarParaSelect(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.listarParaSelect(usuario);
  }

  @ApiOperation({ summary: 'Lista jogos de uma copa' })
  @Get('por-copa/:id')
  porCopa(@Param('id', ParseUUIDPipe) id: string) {
    return this.jogosService.porCopa(id);
  }

  @ApiOperation({ summary: 'Lista jogos de um departamento' })
  @Get('por-departamento/:id')
  porDepartamento(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.porDepartamento(id, usuario);
  }

  @ApiOperation({ summary: 'Busca jogo por ID com previdências e status' })
  @Get(':id')
  buscarPorId(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.buscarPorId(id, usuario);
  }

  @ApiOperation({ summary: 'Cria jogo em uma ou mais copas (retorna array)' })
  @Post()
  criar(@Body() dto: CriarJogoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.criar(dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza dados do jogo' })
  @Put(':id')
  atualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarJogoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.atualizar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Remove jogo em cascata (previdências, atualizações, PLPs, observações)' })
  @Post(':id/remover')
  remover(@Param('id', ParseUUIDPipe) id: string, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.remover(id, usuario);
  }

  @ApiOperation({ summary: 'Replica um jogo (com suas previdências, zeradas) para uma ou mais copas de destino' })
  @Post(':id/replicar')
  replicar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplicarJogoDto, @UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.jogosService.replicar(id, dto, usuario);
  }

  @ApiOperation({ summary: 'Atualiza ou cria status do jogo (cria se não existir)' })
  @Patch(':id/status')
  atualizarStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarStatusDto) {
    return this.jogosService.atualizarStatus(id, dto.status, dto.valor);
  }

  @ApiOperation({ summary: 'Filtra jogos por nome, copa, departamento ou líder' })
  @Post('filtrar')
  filtrar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: FiltrarJogoDto) {
    return this.jogosService.filtrar(usuario, dto);
  }
}
