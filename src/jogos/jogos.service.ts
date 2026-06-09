import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { differenceInWeeks } from 'date-fns';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { filtroJogos } from '../common/utils/permissoes.util';
import { gerarSemanas, mensagemMetaNaoInteira, sugerirMetaInteira } from '../common/utils/calculos.util';
import { CriarJogoDto, AtualizarJogoDto, FiltrarJogoDto, DuplicarJogoDto } from './dto/jogo.dto';

function calcularSemanas(dataInicio: Date, dataFim: Date): number {
  return differenceInWeeks(dataFim, dataInicio) + 1;
}

const INCLUDE_JOGO = {
  copa: {
    include: {
      departamento: { include: { filial: { include: { franqueadora: true } } } },
    },
  },
  lider: true,
  status: true,
  previdencias: {
    where: { deletado_em: null },
    include: {
      atualizacoes: {
        where: { deletado_em: null },
        orderBy: { numero_semana: 'asc' as const },
        include: { plps: { where: { deletado_em: null } } },
      },
    },
  },
};

function enriquecerJogo(jogo: any) {
  return {
    ...jogo,
    previdencias: (jogo.previdencias ?? []).map((p: any) => ({
      ...p,
      semanas: gerarSemanas(p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate, p.atualizacoes).filter((s) => !s.inativa),
    })),
  };
}

@Injectable()
export class JogosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(solicitante: UsuarioAutenticado) {
    const jogos = await this.prisma.jogo.findMany({
      where: filtroJogos(solicitante, solicitante.ano_ativo),
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
    return jogos.map(enriquecerJogo);
  }

  async buscarPorId(id: string) {
    const jogo = await this.prisma.jogo.findFirst({
      where: { id_jogo: id, deletado_em: null },
      include: INCLUDE_JOGO,
    });
    if (!jogo) throw new NotFoundException('Jogo não encontrado');
    return enriquecerJogo(jogo);
  }

  async criar(dto: CriarJogoDto) {
    const copas = dto.ids_copas.filter((id) => id != null && id.length > 0);

    for (const prev of dto.previdencias ?? []) {
      const sugestao = sugerirMetaInteira(
        0,
        prev.placar_desejado,
        new Date(prev.data_inicio),
        new Date(prev.data_fim),
        prev.inativo_de ? new Date(prev.inativo_de) : null,
        prev.inativo_ate ? new Date(prev.inativo_ate) : null,
      );
      if (sugestao) {
        throw new BadRequestException(mensagemMetaNaoInteira(prev.placar_desejado, sugestao));
      }
    }

    return Promise.all(
      copas.map((idCopa) =>
        this.prisma.$transaction(async (tx) => {
          const dataInicio = new Date(dto.data_inicio);
          const dataFim = new Date(dto.data_fim);
          const jogo = await tx.jogo.create({
            data: {
              id_copa: idCopa,
              id_lider: dto.id_lider ?? null,
              nome: dto.nome,
              verbo: dto.verbo ?? null,
              medida: dto.medida ?? null,
              de: dto.de ?? null,
              para: dto.para ?? null,
              data_inicio: dataInicio,
              data_fim: dataFim,
              observacao: dto.observacao ?? null,
              tem_plp: dto.tem_plp ?? false,
              semanas: calcularSemanas(dataInicio, dataFim),
            },
          });

          if (dto.previdencias && dto.previdencias.length > 0) {
            await Promise.all(
              dto.previdencias.map((prev) =>
                tx.previdencia.create({
                  data: {
                    id_jogo: jogo.id_jogo,
                    unidade_medida: prev.unidade_medida ?? null,
                    placar_desejado: prev.placar_desejado,
                    data_inicio: new Date(prev.data_inicio),
                    data_fim: new Date(prev.data_fim),
                    inativo_de: prev.inativo_de ? new Date(prev.inativo_de) : null,
                    inativo_ate: prev.inativo_ate ? new Date(prev.inativo_ate) : null,
                    verbo: prev.verbo ?? null,
                    excluir_periodo: prev.excluir_periodo ?? false,
                  },
                }),
              ),
            );
          }

          const criado = await tx.jogo.findFirst({
            where: { id_jogo: jogo.id_jogo },
            include: INCLUDE_JOGO,
          });
          return enriquecerJogo(criado);
        }).catch((e) => {
          if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
            const campo = String((e.meta as any)?.field_name ?? '');
            if (campo.includes('id_copa')) throw new BadRequestException('Copa não encontrada');
            if (campo.includes('id_lider')) throw new BadRequestException('Líder não encontrado');
            throw new BadRequestException('Referência inválida: registro relacionado não encontrado');
          }
          throw e;
        }),
      ),
    );
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

    if (dto.data_inicio !== undefined || dto.data_fim !== undefined) {
      const jogoAtual = await this.buscarPorId(id);
      const dataInicio = dados.data_inicio ?? jogoAtual.data_inicio;
      const dataFim = dados.data_fim ?? jogoAtual.data_fim;
      dados.semanas = calcularSemanas(dataInicio, dataFim);
    }

    const atualizado = await this.prisma.jogo.update({
      where: { id_jogo: id },
      data: dados,
      include: INCLUDE_JOGO,
    });
    return enriquecerJogo(atualizado);
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

    const jogos = await this.prisma.jogo.findMany({ where, include: INCLUDE_JOGO, orderBy: { nome: 'asc' } });
    return jogos.map(enriquecerJogo);
  }

  async listarParaSelect(solicitante: UsuarioAutenticado) {
    return this.prisma.jogo.findMany({
      where: filtroJogos(solicitante, solicitante.ano_ativo),
      select: { id_jogo: true, nome: true, id_copa: true },
      orderBy: { nome: 'asc' },
    });
  }

  async porCopa(idCopa: string) {
    const jogos = await this.prisma.jogo.findMany({
      where: { id_copa: idCopa, deletado_em: null },
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
    return jogos.map(enriquecerJogo);
  }

  async porDepartamento(idDepartamento: string, solicitante: UsuarioAutenticado) {
    const jogos = await this.prisma.jogo.findMany({
      where: {
        ...filtroJogos(solicitante, solicitante.ano_ativo),
        copa: { id_departamento: idDepartamento, deletado_em: null },
      },
      include: INCLUDE_JOGO,
      orderBy: { nome: 'asc' },
    });
    return jogos.map(enriquecerJogo);
  }

  async duplicar(id: string, dto: DuplicarJogoDto) {
    const original = await this.buscarPorId(id);

    const copasDestino = dto.ids_copas_destino.filter((c) => c != null && c.length > 0);
    if (copasDestino.length === 0) {
      throw new BadRequestException('Informe ao menos uma copa de destino');
    }

    return Promise.all(
      copasDestino.map((idCopa) =>
        this.prisma.$transaction(async (tx) => {
          const jogo = await tx.jogo.create({
            data: {
              id_copa: idCopa,
              id_lider: null,
              nome: original.nome,
              verbo: original.verbo,
              medida: original.medida,
              de: original.de,
              para: original.para,
              data_inicio: original.data_inicio,
              data_fim: original.data_fim,
              observacao: original.observacao,
              tem_plp: original.tem_plp,
              semanas: original.semanas ?? calcularSemanas(original.data_inicio, original.data_fim),
            },
          });

          if (original.previdencias && original.previdencias.length > 0) {
            await Promise.all(
              original.previdencias.map((prev: any) =>
                tx.previdencia.create({
                  data: {
                    id_jogo: jogo.id_jogo,
                    unidade_medida: prev.unidade_medida,
                    placar_desejado: prev.placar_desejado,
                    data_inicio: prev.data_inicio,
                    data_fim: prev.data_fim,
                    inativo_de: prev.inativo_de,
                    inativo_ate: prev.inativo_ate,
                    verbo: prev.verbo,
                    excluir_periodo: prev.excluir_periodo,
                  },
                }),
              ),
            );
          }

          const criado = await tx.jogo.findFirst({
            where: { id_jogo: jogo.id_jogo },
            include: INCLUDE_JOGO,
          });
          return enriquecerJogo(criado);
        }).catch((e) => {
          if (e instanceof PrismaClientKnownRequestError && e.code === 'P2003') {
            const campo = String((e.meta as any)?.field_name ?? '');
            if (campo.includes('id_copa')) throw new BadRequestException('Copa de destino não encontrada');
            if (campo.includes('id_lider')) throw new BadRequestException('Líder não encontrado');
            throw new BadRequestException('Referência inválida: registro relacionado não encontrado');
          }
          throw e;
        }),
      ),
    );
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
