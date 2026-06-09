import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroDepartamentos } from '../common/utils/permissoes.util';
import {
  CriarDepartamentoDto,
  AtualizarDepartamentoDto,
  FiltrarDepartamentoDto,
} from './dto/departamento.dto';

const INCLUDE_DEPARTAMENTO = {
  filial: { include: { franqueadora: true } },
};

@Injectable()
export class DepartamentosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.departamento.findMany({
      where: filtroDepartamentos(solicitante),
      include: INCLUDE_DEPARTAMENTO,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const departamento = await this.prisma.departamento.findFirst({
      where: { AND: [{ id_departamento: id, deletado_em: null }, filtroDepartamentos(solicitante)] },
      include: INCLUDE_DEPARTAMENTO,
    });
    if (!departamento) throw new NotFoundException('Departamento não encontrado');
    return departamento;
  }

  async criar(dto: CriarDepartamentoDto) {
    return this.prisma.departamento.create({
      data: { nome: dto.nome, id_filial: dto.id_filial },
      include: INCLUDE_DEPARTAMENTO,
    });
  }

  async atualizar(id: string, dto: AtualizarDepartamentoDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);
    return this.prisma.departamento.update({
      where: { id_departamento: id },
      data: { ...dto, data_atualizacao: new Date() },
      include: INCLUDE_DEPARTAMENTO,
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    const copasAtivas = await this.prisma.copa.findMany({
      where: { id_departamento: id, deletado_em: null },
      select: { id_copa: true, nome: true },
    });

    if (copasAtivas.length > 0) {
      const nomes = copasAtivas.map((c) => c.nome).join(', ');
      throw new BadRequestException(
        `Não é possível remover este departamento pois ele possui ${copasAtivas.length} copa(s) ativa(s): ${nomes}. Remova as copas antes de excluir o departamento.`,
      );
    }

    await this.prisma.departamento.update({
      where: { id_departamento: id },
      data: { deletado_em: new Date() },
    });

    return { mensagem: 'Departamento removido com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarDepartamentoDto) {
    const where: any = { ...filtroDepartamentos(solicitante) };

    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.id_filial) where.id_filial = dto.id_filial;
    if (dto.id_franqueadora) where.filial = { id_franqueadora: dto.id_franqueadora };
    if (dto.com_copa) where.copas = { some: { deletado_em: null } };

    return this.prisma.departamento.findMany({
      where,
      include: INCLUDE_DEPARTAMENTO,
      orderBy: { nome: 'asc' },
    });
  }

  async comCopa(solicitante: UsuarioAutenticado) {
    const where: any = {
      ...filtroDepartamentos(solicitante),
      copas: { some: { deletado_em: null } },
    };

    return this.prisma.departamento.findMany({
      where,
      include: { ...INCLUDE_DEPARTAMENTO, copas: { where: { deletado_em: null } } },
      orderBy: { nome: 'asc' },
    });
  }

  async listarFiliais() {
    return this.prisma.filial.findMany({
      where: { deletado_em: null },
      include: { franqueadora: true },
      orderBy: { nome: 'asc' },
    });
  }
}
