import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { addWeeks, differenceInWeeks, getISOWeek, getISOWeekYear, startOfDay } from 'date-fns';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { calcularMetaSemanal, calcularPlp, calcularProgressoPrevidencia, gerarSemanas, mensagemMetaNaoInteira, sugerirMetaInteira } from '../common/utils/calculos.util';
import { escopoJogoPorId } from '../common/utils/permissoes.util';
import {
  CriarPrevidenciaDto,
  AtualizarPrevidenciaDto,
  AtualizarPlacarDto,
  LancarSemanaDto,
} from './dto/previdencia.dto';

const INCLUDE_PREVIDENCIA = {
  jogo: {
    include: {
      copa: {
        include: {
          departamento: { include: { filial: { include: { franqueadora: true } } } },
        },
      },
    },
  },
  atualizacoes: {
    where: { deletado_em: null },
    orderBy: { numero_semana: 'asc' as const },
    include: { plps: { where: { deletado_em: null } } },
  },
  observacoes: { where: { deletado_em: null }, orderBy: { data_criacao: 'desc' as const } },
};

@Injectable()
export class PrevidenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorJogo(idJogo: string, solicitante: UsuarioAutenticado) {
    const previdencias = await this.prisma.previdencia.findMany({
      where: { id_jogo: idJogo, deletado_em: null, jogo: escopoJogoPorId(solicitante) },
      include: INCLUDE_PREVIDENCIA,
      orderBy: { data_criacao: 'asc' },
    });

    return previdencias.map((p) => ({
      ...p,
      meta_semanal: calcularMetaSemanal(p.placar_inicial, p.placar_desejado, p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate),
      progresso: calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      ),
      semanas: gerarSemanas(p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate, p.atualizacoes).filter(s => !s.inativa),
    }));
  }

  async listarPorDepartamento(idDepartamento: string, solicitante: UsuarioAutenticado) {
    const previdencias = await this.prisma.previdencia.findMany({
      where: {
        deletado_em: null,
        jogo: {
          deletado_em: null,
          copa: { id_departamento: idDepartamento, deletado_em: null },
          AND: [escopoJogoPorId(solicitante)],
        },
      },
      include: INCLUDE_PREVIDENCIA,
      orderBy: { data_criacao: 'asc' },
    });

    return previdencias.map((p) => ({
      ...p,
      meta_semanal: calcularMetaSemanal(p.placar_inicial, p.placar_desejado, p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate),
      progresso: calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      ),
      semanas: gerarSemanas(p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate, p.atualizacoes).filter(s => !s.inativa),
    }));
  }

  async buscarPorId(id: string, solicitante: UsuarioAutenticado) {
    const previdencia = await this.prisma.previdencia.findFirst({
      where: { AND: [{ id_previdencia: id, deletado_em: null }, { jogo: escopoJogoPorId(solicitante) }] },
      include: INCLUDE_PREVIDENCIA,
    });
    if (!previdencia) throw new NotFoundException('Previdência não encontrada');

    return {
      ...previdencia,
      meta_semanal: calcularMetaSemanal(
        previdencia.placar_inicial, previdencia.placar_desejado,
        previdencia.data_inicio, previdencia.data_fim,
        previdencia.inativo_de, previdencia.inativo_ate,
      ),
      semanas: gerarSemanas(
        previdencia.data_inicio, previdencia.data_fim,
        previdencia.inativo_de, previdencia.inativo_ate,
        previdencia.atualizacoes,
      ).filter(s => !s.inativa),
    };
  }

  async criar(dto: CriarPrevidenciaDto, solicitante: UsuarioAutenticado) {
    const jogo = await this.prisma.jogo.findFirst({
      where: { AND: [{ id_jogo: dto.id_jogo, deletado_em: null }, escopoJogoPorId(solicitante)] },
      select: { id_jogo: true },
    });
    if (!jogo) throw new NotFoundException('Jogo não encontrado');

    const dataInicio = new Date(dto.data_inicio);
    const dataFim = new Date(dto.data_fim);
    const inativoDe = dto.inativo_de ? new Date(dto.inativo_de) : null;
    const inativoAte = dto.inativo_ate ? new Date(dto.inativo_ate) : null;
    const sugestao = sugerirMetaInteira(0, dto.placar_desejado, dataInicio, dataFim, inativoDe, inativoAte);
    if (sugestao) {
      throw new BadRequestException(mensagemMetaNaoInteira(dto.placar_desejado, sugestao));
    }

    const previdencia = await this.prisma.previdencia.create({
      data: {
        id_jogo: dto.id_jogo,
        unidade_medida: dto.unidade_medida ?? null,
        placar_desejado: dto.placar_desejado,
        data_inicio: dataInicio,
        data_fim: dataFim,
        inativo_de: inativoDe,
        inativo_ate: inativoAte,
        verbo: dto.verbo ?? null,
        excluir_periodo: dto.excluir_periodo ?? false,
      },
      include: INCLUDE_PREVIDENCIA,
    });

    return {
      ...previdencia,
      meta_semanal: calcularMetaSemanal(
        previdencia.placar_inicial, previdencia.placar_desejado,
        previdencia.data_inicio, previdencia.data_fim,
        previdencia.inativo_de, previdencia.inativo_ate,
      ),
    };
  }

  async atualizar(id: string, dto: AtualizarPrevidenciaDto, solicitante: UsuarioAutenticado) {
    const existente = await this.buscarPorId(id, solicitante);

    const mudaMeta =
      dto.placar_desejado !== undefined ||
      dto.data_inicio !== undefined ||
      dto.data_fim !== undefined ||
      dto.inativo_de !== undefined ||
      dto.inativo_ate !== undefined;

    if (mudaMeta) {
      const placarDesejado = dto.placar_desejado ?? existente.placar_desejado;
      const dataInicio = dto.data_inicio ? new Date(dto.data_inicio) : existente.data_inicio;
      const dataFim = dto.data_fim ? new Date(dto.data_fim) : existente.data_fim;
      const inativoDe =
        dto.inativo_de !== undefined ? (dto.inativo_de ? new Date(dto.inativo_de) : null) : existente.inativo_de;
      const inativoAte =
        dto.inativo_ate !== undefined ? (dto.inativo_ate ? new Date(dto.inativo_ate) : null) : existente.inativo_ate;
      const sugestao = sugerirMetaInteira(existente.placar_inicial, placarDesejado, dataInicio, dataFim, inativoDe, inativoAte);
      if (sugestao) {
        throw new BadRequestException(mensagemMetaNaoInteira(placarDesejado, sugestao));
      }
    }

    const dados: any = { data_atualizacao: new Date() };
    if (dto.unidade_medida !== undefined) dados.unidade_medida = dto.unidade_medida;
    if (dto.placar_desejado !== undefined) dados.placar_desejado = dto.placar_desejado;
    if (dto.data_inicio !== undefined) dados.data_inicio = new Date(dto.data_inicio);
    if (dto.data_fim !== undefined) dados.data_fim = new Date(dto.data_fim);
    if (dto.inativo_de !== undefined) dados.inativo_de = dto.inativo_de ? new Date(dto.inativo_de) : null;
    if (dto.inativo_ate !== undefined) dados.inativo_ate = dto.inativo_ate ? new Date(dto.inativo_ate) : null;
    if (dto.verbo !== undefined) dados.verbo = dto.verbo;
    if (dto.excluir_periodo !== undefined) dados.excluir_periodo = dto.excluir_periodo;

    const atualizada = await this.prisma.previdencia.update({
      where: { id_previdencia: id },
      data: dados,
      include: INCLUDE_PREVIDENCIA,
    });

    return {
      ...atualizada,
      meta_semanal: calcularMetaSemanal(
        atualizada.placar_inicial, atualizada.placar_desejado,
        atualizada.data_inicio, atualizada.data_fim,
        atualizada.inativo_de, atualizada.inativo_ate,
      ),
    };
  }

  async lancarSemana(idPrevidencia: string, numeroSemana: number, dto: LancarSemanaDto, solicitante: UsuarioAutenticado) {
    const previdencia = await this.prisma.previdencia.findFirst({
      where: { AND: [{ id_previdencia: idPrevidencia, deletado_em: null }, { jogo: escopoJogoPorId(solicitante) }] },
      include: { jogo: true },
    });
    if (!previdencia) throw new NotFoundException('Previdência não encontrada');

    const hoje = startOfDay(new Date());
    const inicioSemana = addWeeks(previdencia.data_inicio, numeroSemana - 1);
    const semanaAtualDoAno = getISOWeek(hoje);
    const anoAtual = getISOWeekYear(hoje);
    const anoSemana = getISOWeekYear(inicioSemana);
    const numSemana = getISOWeek(inicioSemana);
    const ehFutura = anoSemana > anoAtual || (anoSemana === anoAtual && numSemana > semanaAtualDoAno);
    if (ehFutura) {
      throw new ForbiddenException('Não é permitido lançar para semanas futuras');
    }

    const totalSemanas = differenceInWeeks(previdencia.data_fim, previdencia.data_inicio) + 1;
    if (numeroSemana < 1 || numeroSemana > totalSemanas) {
      throw new BadRequestException(`Semana inválida. Esta previdência tem ${totalSemanas} semanas (1 a ${totalSemanas})`);
    }

    if (previdencia.inativo_de && previdencia.inativo_ate) {
      const fimSemana = addWeeks(inicioSemana, 1);
      const dentroDoInativo =
        inicioSemana < previdencia.inativo_ate && fimSemana > previdencia.inativo_de;
      if (dentroDoInativo) {
        throw new ForbiddenException('Não é permitido lançar em semanas do período de inatividade');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      const existente = await tx.atualizacaoPrevidencia.findFirst({
        where: { id_previdencia: idPrevidencia, numero_semana: numeroSemana, deletado_em: null },
      });

      let idAtualizacao: string;

      if (existente) {
        await tx.atualizacaoPrevidencia.update({
          where: { id_atualizacao: existente.id_atualizacao },
          data: { placar_atual: dto.realizado, compromisso: dto.compromisso, data_atualizacao: new Date() },
        });
        idAtualizacao = existente.id_atualizacao;
      } else {
        const criada = await tx.atualizacaoPrevidencia.create({
          data: {
            id_previdencia: idPrevidencia,
            id_usuario: solicitante.id_usuario,
            numero_semana: numeroSemana,
            placar_atual: dto.realizado,
            compromisso: dto.compromisso,
          },
        });
        idAtualizacao = criada.id_atualizacao;
      }

      if (previdencia.jogo.tem_plp && dto.entrevistaqtd != null) {
        const somaRespostas = (dto.promotores ?? 0) + (dto.detratores ?? 0) + (dto.neutros ?? 0);
        if (somaRespostas > dto.entrevistaqtd) {
          throw new BadRequestException(
            `A soma de promotores, detratores e neutros (${somaRespostas}) é maior que o total de entrevistados (${dto.entrevistaqtd})`,
          );
        }
        if (somaRespostas < dto.entrevistaqtd) {
          throw new BadRequestException(
            `A soma de promotores, detratores e neutros (${somaRespostas}) é menor que o total de entrevistados (${dto.entrevistaqtd})`,
          );
        }

        const score = calcularPlp(dto.promotores ?? 0, dto.detratores ?? 0, dto.entrevistaqtd);
        const plpExistente = await tx.plp.findFirst({
          where: { id_atualizacao: idAtualizacao, deletado_em: null },
        });

        if (plpExistente) {
          await tx.plp.update({
            where: { id_plp: plpExistente.id_plp },
            data: {
              respondentes: dto.entrevistaqtd,
              propagadores: dto.promotores ?? 0,
              detratores: dto.detratores ?? 0,
              neutros: dto.neutros ?? 0,
              plp: score,
              data_atualizacao: new Date(),
            },
          });
        } else {
          await tx.plp.create({
            data: {
              id_previdencia: idPrevidencia,
              id_atualizacao: idAtualizacao,
              respondentes: dto.entrevistaqtd,
              propagadores: dto.promotores ?? 0,
              detratores: dto.detratores ?? 0,
              neutros: dto.neutros ?? 0,
              plp: score,
            },
          });
        }
      }

      const ultimoLancamento = await tx.atualizacaoPrevidencia.findFirst({
        where: { id_previdencia: idPrevidencia, deletado_em: null },
        orderBy: { numero_semana: 'desc' },
      });

      if (ultimoLancamento) {
        await tx.previdencia.update({
          where: { id_previdencia: idPrevidencia },
          data: { placar_atual: ultimoLancamento.placar_atual, data_atualizacao: new Date() },
        });
      }
    });

    return this.buscarPorId(idPrevidencia, solicitante);
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    await this.prisma.$transaction(async (tx) => {
      await tx.atualizacaoPrevidencia.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.plp.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.observacaoPrevidencia.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.previdencia.update({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
    });

    return { mensagem: 'Previdência removida com sucesso' };
  }

  async duplicar(id: string, solicitante: UsuarioAutenticado) {
    const original = await this.buscarPorId(id, solicitante);

    return this.prisma.previdencia.create({
      data: {
        id_jogo: original.id_jogo,
        unidade_medida: original.unidade_medida,
        placar_inicial: original.placar_inicial,
        placar_atual: original.placar_inicial,
        placar_desejado: original.placar_desejado,
        data_inicio: original.data_inicio,
        data_fim: original.data_fim,
        inativo_de: original.inativo_de,
        inativo_ate: original.inativo_ate,
        verbo: original.verbo,
      },
      include: INCLUDE_PREVIDENCIA,
    });
  }

  async atualizarPlacar(id: string, dto: AtualizarPlacarDto, solicitante: UsuarioAutenticado) {
    await this.buscarPorId(id, solicitante);

    const [atualizacao] = await this.prisma.$transaction([
      this.prisma.atualizacaoPrevidencia.create({
        data: { id_previdencia: id, id_usuario: solicitante.id_usuario, placar_atual: dto.placar_atual },
      }),
      this.prisma.previdencia.update({
        where: { id_previdencia: id },
        data: { placar_atual: dto.placar_atual, data_atualizacao: new Date() },
      }),
    ]);

    return atualizacao;
  }

  async listarAtualizacoes(idPrevidencia: string, solicitante: UsuarioAutenticado) {
    return this.prisma.atualizacaoPrevidencia.findMany({
      where: {
        id_previdencia: idPrevidencia,
        deletado_em: null,
        previdencia: { jogo: escopoJogoPorId(solicitante) },
      },
      orderBy: { data_criacao: 'desc' },
    });
  }

  async removerAtualizacao(id: string, solicitante: UsuarioAutenticado) {
    const atualizacao = await this.prisma.atualizacaoPrevidencia.findFirst({
      where: { AND: [{ id_atualizacao: id, deletado_em: null }, { previdencia: { jogo: escopoJogoPorId(solicitante) } }] },
      select: { id_atualizacao: true },
    });
    if (!atualizacao) throw new NotFoundException('Atualização não encontrada');

    await this.prisma.atualizacaoPrevidencia.update({
      where: { id_atualizacao: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Atualização removida com sucesso' };
  }
}
