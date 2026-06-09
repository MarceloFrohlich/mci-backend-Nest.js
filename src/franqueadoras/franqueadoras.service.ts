import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroFranqueadoras } from '../common/utils/permissoes.util';
import {
  CriarFranqueadoraDto,
  AtualizarFranqueadoraDto,
  FiltrarFranqueadoraDto,
} from './dto/franqueadora.dto';

@Injectable()
export class FranqueadorasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.franqueadora.findMany({
      where: filtroFranqueadoras(solicitante),
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const franqueadora = await this.prisma.franqueadora.findFirst({
      where: { AND: [{ id_franqueadora: id, deletado_em: null }, filtroFranqueadoras(solicitante)] },
    });
    if (!franqueadora) throw new NotFoundException('Franqueadora não encontrada');
    return franqueadora;
  }

  async criar(dto: CriarFranqueadoraDto) {
    return this.prisma.franqueadora.create({ data: { nome: dto.nome } });
  }

  async atualizar(id: string, dto: AtualizarFranqueadoraDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    return this.prisma.franqueadora.update({
      where: { id_franqueadora: id },
      data: { ...dto, data_atualizacao: new Date() },
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    const filiaisAtivas = await this.prisma.filial.findMany({
      where: { id_franqueadora: id, deletado_em: null },
      select: { id_filial: true, nome: true },
    });

    if (filiaisAtivas.length > 0) {
      const nomes = filiaisAtivas.map((f) => f.nome).join(', ');
      throw new BadRequestException(
        `Não é possível remover esta franqueadora pois ela possui ${filiaisAtivas.length} filial(is) ativa(s): ${nomes}. Remova as filiais antes de excluir a franqueadora.`,
      );
    }

    await this.prisma.franqueadora.update({
      where: { id_franqueadora: id },
      data: { deletado_em: new Date() },
    });

    return { mensagem: 'Franqueadora removida com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarFranqueadoraDto) {
    const where: any = { ...filtroFranqueadoras(solicitante) };
    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };

    return this.prisma.franqueadora.findMany({ where, orderBy: { nome: 'asc' } });
  }
}
