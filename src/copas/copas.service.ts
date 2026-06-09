import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroCopas, filtroDepartamentos, escopoCopaPorId } from '../common/utils/permissoes.util';
import { CriarCopaDto, AtualizarCopaDto, FiltrarCopaDto } from './dto/copa.dto';

const INCLUDE_COPA = {
  departamento: { include: { filial: { include: { franqueadora: true } } } },
  lider: true,
};

@Injectable()
export class CopasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.copa.findMany({
      where: filtroCopas(solicitante, solicitante.ano_ativo),
      include: INCLUDE_COPA,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const copa = await this.prisma.copa.findFirst({
      where: { AND: [{ id_copa: id, deletado_em: null }, escopoCopaPorId(solicitante)] },
      include: INCLUDE_COPA,
    });
    if (!copa) throw new NotFoundException('Copa não encontrada');
    return copa;
  }

  async criar(dto: CriarCopaDto, solicitante: UsuarioAutenticado) {
    const departamentos = dto.ids_departamentos.filter((id) => id != null && id.length > 0);

    // Garante que todos os departamentos de destino estão no escopo do usuário
    const permitidos = await this.prisma.departamento.findMany({
      where: { AND: [{ id_departamento: { in: departamentos }, deletado_em: null }, filtroDepartamentos(solicitante)] },
      select: { id_departamento: true },
    });
    const idsPermitidos = new Set(permitidos.map((d) => d.id_departamento));
    if (departamentos.some((d) => !idsPermitidos.has(d))) {
      throw new ForbiddenException('Um ou mais departamentos de destino não existem ou estão fora do seu acesso');
    }

    const copas = await Promise.all(
      departamentos.map((idDept) =>
        this.prisma.copa.create({
          data: {
            nome: dto.nome,
            id_departamento: idDept,
            id_lider: dto.id_lider,
            inicio: new Date(dto.inicio),
            fim: new Date(dto.fim),
            objetivo: dto.objetivo ?? null,
            verbo: dto.verbo ?? null,
            medida: dto.medida ?? null,
            de: dto.de ?? null,
            ate: dto.ate ?? null,
          },
          include: INCLUDE_COPA,
        }),
      ),
    );

    return copas;
  }

  async atualizar(id: string, dto: AtualizarCopaDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    const dados: any = { data_atualizacao: new Date() };
    if (dto.nome) dados.nome = dto.nome;
    if (dto.id_lider) dados.id_lider = dto.id_lider;
    if (dto.inicio) dados.inicio = new Date(dto.inicio);
    if (dto.fim) dados.fim = new Date(dto.fim);
    if (dto.objetivo !== undefined) dados.objetivo = dto.objetivo;
    if (dto.verbo !== undefined) dados.verbo = dto.verbo;
    if (dto.medida !== undefined) dados.medida = dto.medida;
    if (dto.de !== undefined) dados.de = dto.de;
    if (dto.ate !== undefined) dados.ate = dto.ate;

    return this.prisma.copa.update({
      where: { id_copa: id },
      data: dados,
      include: INCLUDE_COPA,
    });
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    await this.prisma.$transaction(async (tx) => {
      const jogos = await tx.jogo.findMany({
        where: { id_copa: id, deletado_em: null },
        select: { id_jogo: true },
      });

      for (const jogo of jogos) {
        const previds = await tx.previdencia.findMany({
          where: { id_jogo: jogo.id_jogo, deletado_em: null },
          select: { id_previdencia: true },
        });

        for (const prev of previds) {
          await tx.atualizacaoPrevidencia.updateMany({
            where: { id_previdencia: prev.id_previdencia, deletado_em: null },
            data: { deletado_em: new Date() },
          });
          await tx.plp.updateMany({
            where: { id_previdencia: prev.id_previdencia, deletado_em: null },
            data: { deletado_em: new Date() },
          });
          await tx.observacaoPrevidencia.updateMany({
            where: { id_previdencia: prev.id_previdencia, deletado_em: null },
            data: { deletado_em: new Date() },
          });
        }

        await tx.previdencia.updateMany({
          where: { id_jogo: jogo.id_jogo, deletado_em: null },
          data: { deletado_em: new Date() },
        });

        await tx.jogoStatus.updateMany({
          where: { id_jogo: jogo.id_jogo, deletado_em: null },
          data: { deletado_em: new Date() },
        });
      }

      await tx.jogo.updateMany({
        where: { id_copa: id, deletado_em: null },
        data: { deletado_em: new Date() },
      });

      await tx.copa.update({
        where: { id_copa: id },
        data: { deletado_em: new Date() },
      });
    });

    return { mensagem: 'Copa removida com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarCopaDto) {
    const where: any = { ...filtroCopas(solicitante, solicitante.ano_ativo) };

    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.id_departamento) where.id_departamento = dto.id_departamento;
    if (dto.id_filial) where.departamento = { id_filial: dto.id_filial };
    if (dto.id_franqueadora) where.departamento = { filial: { id_franqueadora: dto.id_franqueadora } };
    if (dto.inicio) where.inicio = { gte: new Date(dto.inicio) };
    if (dto.fim) where.fim = { lte: new Date(dto.fim) };

    return this.prisma.copa.findMany({ where, include: INCLUDE_COPA, orderBy: { nome: 'asc' } });
  }

  async listarParaSelect(solicitante: UsuarioAutenticado) {
    return this.prisma.copa.findMany({
      where: filtroCopas(solicitante, solicitante.ano_ativo),
      select: { id_copa: true, nome: true },
      orderBy: { nome: 'asc' },
    });
  }

  async porDepartamento(idDepartamento: string, solicitante: UsuarioAutenticado) {
    return this.prisma.copa.findMany({
      where: {
        ...filtroCopas(solicitante, solicitante.ano_ativo),
        id_departamento: idDepartamento,
      },
      include: INCLUDE_COPA,
      orderBy: { nome: 'asc' },
    });
  }
}
