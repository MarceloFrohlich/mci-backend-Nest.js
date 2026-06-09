import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calcularPlp, calcularMediaPlp } from '../common/utils/calculos.util';
import { UsuarioAutenticado } from '../common/types/usuario-autenticado.type';
import { escopoJogoPorId } from '../common/utils/permissoes.util';
import { CriarPlpDto } from './dto/plp.dto';

@Injectable()
export class PlpsService {
  constructor(private readonly prisma: PrismaService) {}

  async listarPorPrevidencia(idPrevidencia: string, solicitante: UsuarioAutenticado) {
    return this.prisma.plp.findMany({
      where: {
        id_previdencia: idPrevidencia,
        deletado_em: null,
        previdencia: { jogo: escopoJogoPorId(solicitante) },
      },
      orderBy: { data_criacao: 'desc' },
    });
  }

  async criar(dto: CriarPlpDto, solicitante: UsuarioAutenticado) {
    const previdencia = await this.prisma.previdencia.findFirst({
      where: { AND: [{ id_previdencia: dto.id_previdencia, deletado_em: null }, { jogo: escopoJogoPorId(solicitante) }] },
      select: { id_previdencia: true },
    });
    if (!previdencia) throw new NotFoundException('Previdência não encontrada');

    const valorPlp = calcularPlp(dto.propagadores, dto.detratores, dto.respondentes);

    const plp = await this.prisma.plp.create({
      data: {
        id_previdencia: dto.id_previdencia,
        id_atualizacao: dto.id_atualizacao ?? null,
        respondentes: dto.respondentes,
        detratores: dto.detratores,
        propagadores: dto.propagadores,
        neutros: dto.neutros,
        plp: valorPlp,
      },
    });

    await this.recalcularMedia(dto.id_previdencia);

    return plp;
  }

  async remover(id: string, solicitante: UsuarioAutenticado) {
    const plp = await this.prisma.plp.findFirst({
      where: { AND: [{ id_plp: id, deletado_em: null }, { previdencia: { jogo: escopoJogoPorId(solicitante) } }] },
    });
    if (!plp) throw new NotFoundException('PLP não encontrado');

    await this.prisma.plp.update({
      where: { id_plp: id },
      data: { deletado_em: new Date() },
    });

    await this.recalcularMedia(plp.id_previdencia);

    return { mensagem: 'PLP removido com sucesso' };
  }

  private async recalcularMedia(idPrevidencia: string) {
    const plps = await this.prisma.plp.findMany({
      where: { id_previdencia: idPrevidencia, deletado_em: null },
      select: { plp: true },
    });

    const valores = plps.map((p) => Number(p.plp));
    const media = calcularMediaPlp(valores);

    await this.prisma.previdencia.update({
      where: { id_previdencia: idPrevidencia },
      data: { plp_media: media, data_atualizacao: new Date() },
    });
  }
}
