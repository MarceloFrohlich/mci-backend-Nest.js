import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { calcularMetaSemanal, calcularProgressoPrevidencia } from '../common/utils/calculos.util';
import {
  CriarPrevidenciaDto,
  AtualizarPrevidenciaDto,
  AtualizarPlacarDto,
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
  atualizacoes: { where: { deletado_em: null }, orderBy: { data_criacao: 'desc' as const } },
  observacoes: { where: { deletado_em: null }, orderBy: { data_criacao: 'desc' as const } },
};

@Injectable()
export class PrevidenciasService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorJogo(idJogo: string) {
    const previdencias = await this.prisma.previdencia.findMany({
      where: { id_jogo: idJogo, deletado_em: null },
      include: INCLUDE_PREVIDENCIA,
      orderBy: { data_criacao: 'asc' },
    });

    return previdencias.map((p) => ({
      ...p,
      meta_semanal: calcularMetaSemanal(p.placar_inicial, p.placar_desejado, p.data_inicio, p.data_fim),
      progresso: calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      ),
    }));
  }

  async listarPorDepartamento(idDepartamento: string, _solicitante: UsuarioAutenticado) {
    const previdencias = await this.prisma.previdencia.findMany({
      where: {
        deletado_em: null,
        jogo: { deletado_em: null, copa: { id_departamento: idDepartamento, deletado_em: null } },
      },
      include: INCLUDE_PREVIDENCIA,
      orderBy: { data_criacao: 'asc' },
    });

    return previdencias.map((p) => ({
      ...p,
      meta_semanal: calcularMetaSemanal(p.placar_inicial, p.placar_desejado, p.data_inicio, p.data_fim),
      progresso: calcularProgressoPrevidencia(
        p.placar_inicial, p.placar_atual, p.placar_desejado,
        p.data_inicio, p.data_fim, p.inativo_de, p.inativo_ate,
      ),
    }));
  }

  async buscarPorId(id: string) {
    const previdencia = await this.prisma.previdencia.findFirst({
      where: { id_previdencia: id, deletado_em: null },
      include: INCLUDE_PREVIDENCIA,
    });
    if (!previdencia) throw new NotFoundException('Previdência não encontrada');

    return {
      ...previdencia,
      meta_semanal: calcularMetaSemanal(
        previdencia.placar_inicial, previdencia.placar_desejado,
        previdencia.data_inicio, previdencia.data_fim,
      ),
    };
  }

  async criar(dto: CriarPrevidenciaDto) {
    const previdencia = await this.prisma.previdencia.create({
      data: {
        id_jogo: dto.id_jogo,
        unidade_medida: dto.unidade_medida ?? null,
        placar_desejado: dto.placar_desejado,
        data_inicio: new Date(dto.data_inicio),
        data_fim: new Date(dto.data_fim),
        inativo_de: dto.inativo_de ? new Date(dto.inativo_de) : null,
        inativo_ate: dto.inativo_ate ? new Date(dto.inativo_ate) : null,
        verbo: dto.verbo ?? null,
      },
      include: INCLUDE_PREVIDENCIA,
    });

    return {
      ...previdencia,
      meta_semanal: calcularMetaSemanal(
        previdencia.placar_inicial, previdencia.placar_desejado,
        previdencia.data_inicio, previdencia.data_fim,
      ),
    };
  }

  async atualizar(id: string, dto: AtualizarPrevidenciaDto) {
    await this.buscarPorId(id);

    const dados: any = { data_atualizacao: new Date() };
    if (dto.unidade_medida !== undefined) dados.unidade_medida = dto.unidade_medida;
    if (dto.placar_desejado !== undefined) dados.placar_desejado = dto.placar_desejado;
    if (dto.data_inicio !== undefined) dados.data_inicio = new Date(dto.data_inicio);
    if (dto.data_fim !== undefined) dados.data_fim = new Date(dto.data_fim);
    if (dto.inativo_de !== undefined) dados.inativo_de = dto.inativo_de ? new Date(dto.inativo_de) : null;
    if (dto.inativo_ate !== undefined) dados.inativo_ate = dto.inativo_ate ? new Date(dto.inativo_ate) : null;
    if (dto.verbo !== undefined) dados.verbo = dto.verbo;

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
      ),
    };
  }

  async remover(id: string) {
    await this.buscarPorId(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.atualizacaoPrevidencia.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.plp.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.observacaoPrevidencia.updateMany({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
      await tx.previdencia.update({ where: { id_previdencia: id }, data: { deletado_em: new Date() } });
    });

    return { mensagem: 'Previdência removida com sucesso' };
  }

  async duplicar(id: string) {
    const original = await this.buscarPorId(id);

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
    await this.buscarPorId(id);

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

  async listarAtualizacoes(idPrevidencia: string) {
    return this.prisma.atualizacaoPrevidencia.findMany({
      where: { id_previdencia: idPrevidencia, deletado_em: null },
      orderBy: { data_criacao: 'desc' },
    });
  }

  async removerAtualizacao(id: string) {
    await this.prisma.atualizacaoPrevidencia.update({
      where: { id_atualizacao: id },
      data: { deletado_em: new Date() },
    });
    return { mensagem: 'Atualização removida com sucesso' };
  }
}
