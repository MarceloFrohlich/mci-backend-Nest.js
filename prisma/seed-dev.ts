// Popula uma cadeia de DEMONSTRAÇÃO isolada (tudo com sufixo "Demo") para testar
// o dashboard e o permissionamento. Re-executável: apaga a cadeia demo e recria.
// Uso: DATABASE_URL="..." npx ts-node prisma/seed-dev.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { addDays, startOfDay, startOfWeek } from 'date-fns';

const prisma = new PrismaClient();

const NOME_FRANQUEADORA = 'Educamax Demo';
const EMAILS_DEMO = [
  'franqueadora.demo@mci.com',
  'filial.demo@mci.com',
  'departamento.demo@mci.com',
];

const SEMANAS_TOTAIS = 36;
const SEMANAS_DECORRIDAS = 16; // semanas já lançadas antes da semana corrente
const META_SEMANAL = 10;

async function limparDemo() {
  const franqueadora = await prisma.franqueadora.findFirst({
    where: { nome: NOME_FRANQUEADORA },
  });

  const usuarios = await prisma.usuario.findMany({ where: { email: { in: EMAILS_DEMO } } });
  const idsUsuarios = usuarios.map((u) => u.id_usuario);
  if (idsUsuarios.length > 0) {
    await prisma.tokenRecuperacaoSenha.deleteMany({ where: { id_usuario: { in: idsUsuarios } } });
    await prisma.usuarioAno.deleteMany({ where: { id_usuario: { in: idsUsuarios } } });
    await prisma.usuario.deleteMany({ where: { id_usuario: { in: idsUsuarios } } });
  }

  if (!franqueadora) return;

  const escopo = {
    jogo: { copa: { departamento: { filial: { id_franqueadora: franqueadora.id_franqueadora } } } },
  };

  await prisma.plp.deleteMany({ where: { previdencia: escopo } });
  await prisma.observacaoPrevidencia.deleteMany({ where: { previdencia: escopo } });
  await prisma.atualizacaoPrevidencia.deleteMany({ where: { previdencia: escopo } });
  await prisma.previdencia.deleteMany({ where: escopo });
  await prisma.jogoStatus.deleteMany({
    where: { jogo: { copa: { departamento: { filial: { id_franqueadora: franqueadora.id_franqueadora } } } } },
  });
  await prisma.jogo.deleteMany({
    where: { copa: { departamento: { filial: { id_franqueadora: franqueadora.id_franqueadora } } } },
  });
  await prisma.copa.deleteMany({
    where: { departamento: { filial: { id_franqueadora: franqueadora.id_franqueadora } } },
  });
  await prisma.departamento.deleteMany({
    where: { filial: { id_franqueadora: franqueadora.id_franqueadora } },
  });
  await prisma.filial.deleteMany({ where: { id_franqueadora: franqueadora.id_franqueadora } });
  await prisma.lider.deleteMany({ where: { id_franqueadora: franqueadora.id_franqueadora } });
  await prisma.franqueadora.delete({ where: { id_franqueadora: franqueadora.id_franqueadora } });

  console.log('Cadeia demo anterior removida');
}

interface PerfilPrevidencia {
  nomeJogo: string;
  // realizado por semana (1..SEMANAS_DECORRIDAS)
  realizado: (semana: number) => number;
  // compromisso lançado em cada semana (null = sem compromisso)
  compromisso: (semana: number) => number | null;
  // lança também na semana corrente (17ª)?
  lancaSemanaAtual: boolean;
  realizadoSemanaAtual?: number;
}

async function main() {
  console.log('Iniciando seed de demonstração...');

  await limparDemo();

  const hoje = startOfDay(new Date());
  const inicioSemanaAtual = startOfWeek(hoje, { weekStartsOn: 0 });
  const inicio = addDays(inicioSemanaAtual, -SEMANAS_DECORRIDAS * 7);
  const fim = addDays(inicio, SEMANAS_TOTAIS * 7 - 1);
  const ano = hoje.getFullYear();

  const franqueadora = await prisma.franqueadora.create({
    data: { nome: NOME_FRANQUEADORA },
  });

  const [filialNorte, filialSul] = await Promise.all([
    prisma.filial.create({ data: { nome: 'Filial Norte Demo', id_franqueadora: franqueadora.id_franqueadora } }),
    prisma.filial.create({ data: { nome: 'Filial Sul Demo', id_franqueadora: franqueadora.id_franqueadora } }),
  ]);

  const [depVendas, depMarketing, depTi, depFinanceira] = await Promise.all([
    prisma.departamento.create({ data: { nome: 'Equipe de Vendas Demo', id_filial: filialNorte.id_filial } }),
    prisma.departamento.create({ data: { nome: 'Equipe de Marketing Demo', id_filial: filialNorte.id_filial } }),
    prisma.departamento.create({ data: { nome: 'Equipe de TI Demo', id_filial: filialSul.id_filial } }),
    prisma.departamento.create({ data: { nome: 'Equipe Financeira Demo', id_filial: filialSul.id_filial } }),
  ]);

  const [liderUm, liderDois] = await Promise.all([
    prisma.lider.create({ data: { nome: 'Líder Demo Um', id_franqueadora: franqueadora.id_franqueadora } }),
    prisma.lider.create({ data: { nome: 'Líder Demo Dois', id_franqueadora: franqueadora.id_franqueadora } }),
  ]);

  // usuários de teste por nível (senha admin123)
  const senha = await bcrypt.hash('admin123', 10);
  const usuariosDemo = [
    { nome: 'Gestor Franqueadora Demo', email: EMAILS_DEMO[0], id_nivel: 1, relacao: franqueadora.id_franqueadora },
    { nome: 'Gestor Filial Demo', email: EMAILS_DEMO[1], id_nivel: 2, relacao: filialNorte.id_filial },
    { nome: 'Gestor Departamento Demo', email: EMAILS_DEMO[2], id_nivel: 3, relacao: depVendas.id_departamento },
  ];
  for (const dados of usuariosDemo) {
    const usuario = await prisma.usuario.create({
      data: { ...dados, senha, id_role: 2 },
    });
    await prisma.usuarioAno.create({ data: { id_usuario: usuario.id_usuario, ano } });
  }

  const placarDesejado = META_SEMANAL * SEMANAS_TOTAIS;

  // perfis por departamento: cada um exercita um estado do dashboard
  const equipes: { departamento: any; lider: any; nomeCopa: string; perfis: PerfilPrevidencia[] }[] = [
    {
      departamento: depVendas,
      lider: liderUm,
      nomeCopa: 'Copa de Vendas Demo',
      perfis: [
        {
          // meta atingida antes do prazo (400 lançados de 360) + compromissos cumpridos
          nomeJogo: 'Prospecção de Clientes',
          realizado: () => 25,
          compromisso: () => 25,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 5,
        },
        {
          // on track com folga pequena
          nomeJogo: 'Visitas de Retorno',
          realizado: () => 12,
          compromisso: () => 12,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 12,
        },
      ],
    },
    {
      departamento: depMarketing,
      lider: liderUm,
      nomeCopa: 'Copa de Marketing Demo',
      perfis: [
        {
          // on track; compromissos alternam entre cumpridos e não cumpridos
          nomeJogo: 'Leads Qualificados',
          realizado: () => 11,
          compromisso: (semana) => (semana % 2 === 0 ? 12 : 10),
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 11,
        },
      ],
    },
    {
      departamento: depTi,
      lider: liderDois,
      nomeCopa: 'Copa de TI Demo',
      perfis: [
        {
          // constantemente abaixo da meta (ritmo ~80%) e compromissos não cumpridos
          nomeJogo: 'Chamados Resolvidos',
          realizado: () => 8,
          compromisso: () => 10,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 8,
        },
      ],
    },
    {
      departamento: depFinanceira,
      lider: liderDois,
      nomeCopa: 'Copa Financeira Demo',
      perfis: [
        {
          // começou bem e desabou: 3+ semanas abaixo (alerta de risco) e sem lançamento na semana atual
          nomeJogo: 'Redução de Inadimplência',
          realizado: (semana) => (semana <= 8 ? 10 : 3),
          compromisso: () => 10,
          lancaSemanaAtual: false,
        },
      ],
    },
  ];

  for (const equipe of equipes) {
    const copa = await prisma.copa.create({
      data: {
        nome: equipe.nomeCopa,
        id_departamento: equipe.departamento.id_departamento,
        id_lider: equipe.lider.id_lider,
        objetivo: `Objetivo da ${equipe.nomeCopa}`,
        inicio,
        fim,
        verbo: 'Alcançar',
        medida: 'pontos',
        de: 0,
        ate: placarDesejado,
      },
    });

    for (const perfil of equipe.perfis) {
      const jogo = await prisma.jogo.create({
        data: {
          id_copa: copa.id_copa,
          id_lider: equipe.lider.id_lider,
          nome: perfil.nomeJogo,
          verbo: 'Alcançar',
          medida: 'pontos',
          de: 0,
          para: placarDesejado,
          data_inicio: inicio,
          data_fim: fim,
          semanas: SEMANAS_TOTAIS,
          data_criacao: inicio, // retro-datado: só a MCI nova deve disparar alerta de criação
        },
      });

      const previdencia = await prisma.previdencia.create({
        data: {
          id_jogo: jogo.id_jogo,
          unidade_medida: 'pontos',
          placar_inicial: 0,
          placar_atual: 0,
          placar_desejado: placarDesejado,
          data_inicio: inicio,
          data_fim: fim,
          verbo: 'Alcançar',
        },
      });

      let acumulado = 0;
      for (let semana = 1; semana <= SEMANAS_DECORRIDAS; semana++) {
        const realizado = perfil.realizado(semana);
        acumulado += realizado;
        await prisma.atualizacaoPrevidencia.create({
          data: {
            id_previdencia: previdencia.id_previdencia,
            numero_semana: semana,
            placar_atual: realizado,
            compromisso: perfil.compromisso(semana),
            data_criacao: addDays(inicio, (semana - 1) * 7 + 3), // quinta-feira da semana
          },
        });
      }

      if (perfil.lancaSemanaAtual) {
        const realizado = perfil.realizadoSemanaAtual ?? META_SEMANAL;
        acumulado += realizado;
        await prisma.atualizacaoPrevidencia.create({
          data: {
            id_previdencia: previdencia.id_previdencia,
            numero_semana: SEMANAS_DECORRIDAS + 1,
            placar_atual: realizado,
            compromisso: META_SEMANAL,
            data_criacao: hoje,
          },
        });
      }

      // invariante do sistema: placar_atual = inicial + soma dos lançamentos
      await prisma.previdencia.update({
        where: { id_previdencia: previdencia.id_previdencia },
        data: { placar_atual: acumulado },
      });
    }
  }

  // jogo recém-criado sem lançamentos (alerta de "nova MCI")
  const copaMarketing = await prisma.copa.findFirst({
    where: { nome: 'Copa de Marketing Demo', departamento: { id_departamento: depMarketing.id_departamento } },
  });
  const jogoNovo = await prisma.jogo.create({
    data: {
      id_copa: copaMarketing!.id_copa,
      id_lider: liderUm.id_lider,
      nome: 'Campanha de Redes Sociais',
      verbo: 'Publicar',
      medida: 'posts',
      de: 0,
      para: 100,
      data_inicio: inicioSemanaAtual,
      data_fim: addDays(inicioSemanaAtual, 20 * 7 - 1),
      semanas: 20,
    },
  });
  await prisma.previdencia.create({
    data: {
      id_jogo: jogoNovo.id_jogo,
      unidade_medida: 'posts',
      placar_inicial: 0,
      placar_atual: 0,
      placar_desejado: 100,
      data_inicio: inicioSemanaAtual,
      data_fim: addDays(inicioSemanaAtual, 20 * 7 - 1),
      verbo: 'Publicar',
    },
  });

  console.log('Seed de demonstração concluído!');
  console.log('');
  console.log('Cadeia criada: Educamax Demo > Filial Norte/Sul Demo > 4 equipes');
  console.log('Perfis: Vendas (meta antecipada + on track), Marketing (on track + MCI nova),');
  console.log('        TI (abaixo do ritmo), Financeira (em risco + sem atualização na semana)');
  console.log('');
  console.log('Usuários de teste (senha admin123):');
  console.log('  franqueadora.demo@mci.com  (nível franqueadora)');
  console.log('  filial.demo@mci.com        (nível filial - Filial Norte)');
  console.log('  departamento.demo@mci.com  (nível departamento - Equipe de Vendas)');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed de demonstração:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
