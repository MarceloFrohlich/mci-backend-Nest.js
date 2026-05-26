import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroFiliais } from '../common/utils/permissoes.util';
import { CriarFilialDto, AtualizarFilialDto, FiltrarFilialDto } from './dto/filial.dto';

const INCLUDE_FILIAL = { franqueadora: true };

@Injectable()
export class FiliaisService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.filial.findMany({
      where: filtroFiliais(solicitante),
      include: INCLUDE_FILIAL,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const filial = await this.prisma.filial.findFirst({
      where: { id_filial: id, deletado_em: null },
      include: INCLUDE_FILIAL,
    });
    if (!filial) throw new NotFoundException('Filial não encontrada');
    return filial;
  }

  async criar(dto: CriarFilialDto) {
    return this.prisma.filial.create({
      data: { nome: dto.nome, id_franqueadora: dto.id_franqueadora },
      include: INCLUDE_FILIAL,
    });
  }

  async atualizar(id: string, dto: AtualizarFilialDto) {
    await this.buscarPorId(id);
    return this.prisma.filial.update({
      where: { id_filial: id },
      data: { ...dto, data_atualizacao: new Date() },
      include: INCLUDE_FILIAL,
    });
  }

  async remover(id: string) {
    await this.buscarPorId(id);

    const departamentosAtivos = await this.prisma.departamento.findMany({
      where: { id_filial: id, deletado_em: null },
      select: { id_departamento: true, nome: true },
    });

    if (departamentosAtivos.length > 0) {
      const nomes = departamentosAtivos.map((d) => d.nome).join(', ');
      throw new BadRequestException(
        `Não é possível remover esta filial pois ela possui ${departamentosAtivos.length} departamento(s) ativo(s): ${nomes}. Remova os departamentos antes de excluir a filial.`,
      );
    }

    await this.prisma.filial.update({
      where: { id_filial: id },
      data: { deletado_em: new Date() },
    });

    return { mensagem: 'Filial removida com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarFilialDto) {
    const where: any = { ...filtroFiliais(solicitante) };
    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.id_franqueadora) where.id_franqueadora = dto.id_franqueadora;

    return this.prisma.filial.findMany({ where, include: INCLUDE_FILIAL, orderBy: { nome: 'asc' } });
  }

  async listarFranqueadoras() {
    return this.prisma.franqueadora.findMany({
      where: { deletado_em: null },
      orderBy: { nome: 'asc' },
    });
  }
}
