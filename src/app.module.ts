import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { FranqueadorasModule } from './franqueadoras/franqueadoras.module';
import { FiliaisModule } from './filiais/filiais.module';
import { DepartamentosModule } from './departamentos/departamentos.module';
import { CopasModule } from './copas/copas.module';
import { LideresModule } from './lideres/lideres.module';
import { JogosModule } from './jogos/jogos.module';
import { PrevidenciasModule } from './previdencias/previdencias.module';
import { PlpsModule } from './plps/plps.module';
import { ObservacoesModule } from './observacoes/observacoes.module';
import { GraficosModule } from './graficos/graficos.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Rate limit disponível para uso seletivo via @UseGuards(ThrottlerGuard) — NÃO é global,
    // para não impactar requisições normais de dados (ex.: múltiplos usuários atrás de um mesmo IP).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    FranqueadorasModule,
    FiliaisModule,
    DepartamentosModule,
    CopasModule,
    LideresModule,
    JogosModule,
    PrevidenciasModule,
    PlpsModule,
    ObservacoesModule,
    GraficosModule,
    RelatoriosModule,
    DashboardModule,
  ],
})
export class AppModule {}
