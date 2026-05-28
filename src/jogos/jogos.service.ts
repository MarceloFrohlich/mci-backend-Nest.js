import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroJogos } from '../common/utils/permissoes.util';
import { CriarJogoDto, AtualizarJogoDto, FiltrarJogoDto } from './dto/jogo.dto';

const INCLUDE_JOGO = {
  copa: {
    include: {
      departamento: { include: { filial: { include: { franqueadora: true } } } },
    },
  },
  lider: true,
  status: true,
  previdencias: { where: { deletado_em: null } },
};

@Injectable()
export class JogosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    return this.prisma.jogo.findMany({
      where: filtroJogos(solicitante, solicitante.ano_ativo),
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
  }

  async buscarPorId(id: string) {
    const jogo = await this.prisma.jogo.findFirst({
      where: { id_jogo: id, deletado_em: null },
      include: INCLUDE_JOGO,
    });
    if (!jogo) throw new NotFoundException('Jogo não encontrado');
    return jogo;
  }

  async criar(dto: CriarJogoDto) {
    return this.prisma.$transaction(async (tx) => {
      const jogo = await tx.jogo.create({
        data: {
          id_copa: dto.id_copa,
          id_lider: dto.id_lider ?? null,
          nome: dto.nome,
          verbo: dto.verbo ?? null,
          medida: dto.medida ?? null,
          de: dto.de ?? null,
          para: dto.para ?? null,
          data_inicio: new Date(dto.data_inicio),
          data_fim: new Date(dto.data_fim),
          observacao: dto.observacao ?? null,
          tem_plp: dto.tem_plp ?? false,
        },
      });

      if (dto.previdencias && dto.previdencias.length > 0) {
        await Promise.all(
          dto.previdencias.map((prev) =>
            tx.previdencia.create({
              data: {
                id_jogo: jogo.id_jogo,
                unidade_medida: prev.unidade_medida ?? null,
                placar_inicial: prev.placar_inicial,
                placar_atual: prev.placar_inicial,
                placar_desejado: prev.placar_desejado,
                data_inicio: new Date(prev.data_inicio),
                data_fim: new Date(prev.data_fim),
                inativo_de: prev.inativo_de ? new Date(prev.inativo_de) : null,
                inativo_ate: prev.inativo_ate ? new Date(prev.inativo_ate) : null,
                verbo: prev.verbo ?? null,
              },
            }),
          ),
        );
      }

      return tx.jogo.findFirst({
        where: { id_jogo: jogo.id_jogo },
        include: INCLUDE_JOGO,
      });
    });
  }

  async atualizar(id: string, dto: AtualizarJogoDto) {
    await this.buscarPorId(id);

    const dados: any = { data_atualizacao: new Date() };
    if (dto.nome !== undefined) dados.nome = dto.nome;
    if (dto.id_lider !== undefined) dados.id_lider = dto.id_lider;
    if (dto.verbo !== undefined) dados.verbo = dto.verbo;
    if (dto.medida !== undefined) dados.medida = dto.medida;
    if (dto.de !== undefined) dados.de = dto.de;
    if (dto.para !== undefined) dados.para = dto.para;
    if (dto.data_inicio !== undefined) dados.data_inicio = new Date(dto.data_inicio);
    if (dto.data_fim !== undefined) dados.data_fim = new Date(dto.data_fim);
    if (dto.observacao !== undefined) dados.observacao = dto.observacao;
    if (dto.tem_plp !== undefined) dados.tem_plp = dto.tem_plp;

    return this.prisma.jogo.update({
      where: { id_jogo: id },
      data: dados,
      include: INCLUDE_JOGO,
    });
  }

  async remover(id: string) {
    await this.buscarPorId(id);

    await this.prisma.$transaction(async (tx) => {
      const previds = await tx.previdencia.findMany({
        where: { id_jogo: id, deletado_em: null },
        select: { id_previdencia: true },
      });

      for (const prev of previds) {
        await tx.atualizacaoPrevidencia.updateMany({
          where: { id_previdencia: prev.id_previdencia },
          data: { deletado_em: new Date() },
        });
        await tx.plp.updateMany({
          where: { id_previdencia: prev.id_previdencia },
          data: { deletado_em: new Date() },
        });
        await tx.observacaoPrevidencia.updateMany({
          where: { id_previdencia: prev.id_previdencia },
          data: { deletado_em: new Date() },
        });
      }

      await tx.previdencia.updateMany({
        where: { id_jogo: id },
        data: { deletado_em: new Date() },
      });

      await tx.jogoStatus.updateMany({
        where: { id_jogo: id },
        data: { deletado_em: new Date() },
      });

      await tx.jogo.update({
        where: { id_jogo: id },
        data: { deletado_em: new Date() },
      });
    });

    return { mensagem: 'Jogo removido com sucesso' };
  }

  async filtrar(solicitante: UsuarioAutenticado, dto: FiltrarJogoDto) {
    const where: any = { ...filtroJogos(solicitante, solicitante.ano_ativo) };

    if (dto.nome) where.nome = { contains: dto.nome, mode: 'insensitive' };
    if (dto.id_copa) where.id_copa = dto.id_copa;
    if (dto.id_lider) where.id_lider = dto.id_lider;
    if (dto.id_departamento) {
      where.copa = { id_departamento: dto.id_departamento, deletado_em: null };
    }

    return this.prisma.jogo.findMany({ where, include: INCLUDE_JOGO, orderBy: { nome: 'asc' } });
  }

  async listarParaSelect(solicitante: UsuarioAutenticado) {
    return this.prisma.jogo.findMany({
      where: filtroJogos(solicitante, solicitante.ano_ativo),
      select: { id_jogo: true, nome: true, id_copa: true },
      orderBy: { nome: 'asc' },
    });
  }

  async porCopa(idCopa: string) {
    return this.prisma.jogo.findMany({
      where: { id_copa: idCopa, deletado_em: null },
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
  }

  async porDepartamento(idDepartamento: string, solicitante: UsuarioAutenticado) {
    return this.prisma.jogo.findMany({
      where: {
        ...filtroJogos(solicitante, solicitante.ano_ativo),
        copa: { id_departamento: idDepartamento, deletado_em: null },
      },
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
  }

  async duplicar(id: string) {
    const original = await this.buscarPorId(id);

    return this.prisma.jogo.create({
      data: {
        id_copa: original.id_copa,
        id_lider: original.id_lider,
        nome: `${original.nome} (cópia)`,
        verbo: original.verbo,
        medida: original.medida,
        de: original.de,
        para: original.para,
        data_inicio: original.data_inicio,
        data_fim: original.data_fim,
        observacao: original.observacao,
        tem_plp: original.tem_plp,
      },
      include: INCLUDE_JOGO,
    });
  }

  async atualizarStatus(idJogo: string, status: string, valor: string) {
    const existente = await this.prisma.jogoStatus.findFirst({
      where: { id_jogo: idJogo, deletado_em: null },
    });

    if (existente) {
      return this.prisma.jogoStatus.update({
        where: { id_status: existente.id_status },
        data: { status, valor, data_atualizacao: new Date() },
      });
    }

    return this.prisma.jogoStatus.create({
      data: { id_jogo: idJogo, status, valor },
    });
  }
}
