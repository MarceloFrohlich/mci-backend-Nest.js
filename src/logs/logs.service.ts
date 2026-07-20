import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DIAS_RETENCAO = 90;
const LIMITE_LISTAGEM = 1000;

interface RegistroLog {
  metodo: string;
  rota: string;
  status: number;
  sucesso: boolean;
  mensagem_erro?: string;
  usuario?: string;
  payload?: Prisma.InputJsonObject;
}

@Injectable()
export class LogsService implements OnModuleInit {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.limparAntigos();
    setInterval(() => void this.limparAntigos(), 24 * 60 * 60 * 1000);
  }

  // fire-and-forget: registrar log jamais pode derrubar a requisição original
  registrar(dados: RegistroLog) {
    this.prisma.logRequisicao
      .create({ data: dados })
      .catch((erro) => this.logger.warn(`Falha ao registrar log: ${erro.message}`));
  }

  listar() {
    return this.prisma.logRequisicao.findMany({
      orderBy: { data_hora: 'desc' },
      take: LIMITE_LISTAGEM,
    });
  }

  private async limparAntigos() {
    const corte = new Date(Date.now() - DIAS_RETENCAO * 24 * 60 * 60 * 1000);
    await this.prisma.logRequisicao
      .deleteMany({ where: { data_hora: { lt: corte } } })
      .catch((erro) => this.logger.warn(`Falha na limpeza de logs: ${erro.message}`));
  }
}
