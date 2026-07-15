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
  'usuario.demo@mci.com',
];

const SEMANAS_TOTAIS = 36;
const SEMANAS_DECORRIDAS = 16; // semanas já lançadas antes da semana corrente

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
  verbo: string;
  medida: string;
  metaSemanal: number;
  // realizado por semana (1..SEMANAS_DECORRIDAS)
  realizado: (semana: number) => number;
  // compromisso lançado em cada semana (null = sem compromisso)
  compromisso: (semana: number) => number | null;
  // lança também na semana corrente (17ª)?
  lancaSemanaAtual: boolean;
  realizadoSemanaAtual?: number;
  temPlp?: boolean;
  observacoes?: string[];
}

function calcularPlpSemana(semana: number) {
  const respondentes = 20;
  const propagadores = 10 + (semana % 5);
  const detratores = 3 + (semana % 3);
  const neutros = respondentes - propagadores - detratores;
  const plp = parseFloat((((propagadores - detratores) / respondentes) * 100).toFixed(2));
  return { respondentes, propagadores, detratores, neutros, plp };
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
    { nome: 'Gestor Franqueadora Demo', email: EMAILS_DEMO[0], id_nivel: 1, relacao: franqueadora.id_franqueadora, id_role: 2 },
    { nome: 'Gestor Filial Demo', email: EMAILS_DEMO[1], id_nivel: 2, relacao: filialNorte.id_filial, id_role: 2 },
    { nome: 'Gestor Departamento Demo', email: EMAILS_DEMO[2], id_nivel: 3, relacao: depVendas.id_departamento, id_role: 2 },
    { nome: 'Usuário Comum Demo', email: EMAILS_DEMO[3], id_nivel: 3, relacao: depVendas.id_departamento, id_role: 3 },
  ];
  for (const dados of usuariosDemo) {
    const usuario = await prisma.usuario.create({
      data: { ...dados, senha },
    });
    await prisma.usuarioAno.create({ data: { id_usuario: usuario.id_usuario, ano } });
  }

  // perfis por departamento: cada um exercita um estado do dashboard
  const equipes: { departamento: any; lider: any; nomeCopa: string; objetivo: string; perfis: PerfilPrevidencia[] }[] = [
    {
      departamento: depVendas,
      lider: liderUm,
      nomeCopa: 'Copa de Vendas Demo',
      objetivo: 'Dobrar a carteira de clientes ativos até o fim do ano',
      perfis: [
        {
          // meta atingida antes do prazo (400 lançados de 360) + compromissos cumpridos
          nomeJogo: 'Prospecção de Clientes',
          verbo: 'Prospectar',
          medida: 'clientes',
          metaSemanal: 10,
          realizado: () => 25,
          compromisso: () => 25,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 5,
          observacoes: [
            'Meta atingida com 20 semanas de antecedência. Equipe focando agora em qualidade do funil.',
            'Parceria com a associação regional acelerou as indicações.',
          ],
        },
        {
          // on track com folga pequena
          nomeJogo: 'Visitas de Retorno',
          verbo: 'Visitar',
          medida: 'visitas',
          metaSemanal: 10,
          realizado: () => 12,
          compromisso: () => 12,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 12,
        },
        {
          // exatamente no ritmo, sem folga
          nomeJogo: 'Propostas Enviadas',
          verbo: 'Enviar',
          medida: 'propostas',
          metaSemanal: 5,
          realizado: () => 5,
          compromisso: () => 5,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 5,
        },
        {
          // pouco acima do ritmo + pesquisa PLP acompanhando os fechamentos
          nomeJogo: 'Contratos Fechados',
          verbo: 'Fechar',
          medida: 'contratos',
          metaSemanal: 3,
          realizado: () => 4,
          compromisso: () => 3,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 4,
          temPlp: true,
          observacoes: ['Clientes fechados via indicação apresentam PLP consistentemente maior.'],
        },
      ],
    },
    {
      departamento: depMarketing,
      lider: liderUm,
      nomeCopa: 'Copa de Marketing Demo',
      objetivo: 'Gerar demanda qualificada para o time comercial',
      perfis: [
        {
          // on track; compromissos alternam entre cumpridos e não cumpridos + PLP
          nomeJogo: 'Leads Qualificados',
          verbo: 'Qualificar',
          medida: 'leads',
          metaSemanal: 10,
          realizado: () => 11,
          compromisso: (semana) => (semana % 2 === 0 ? 12 : 10),
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 11,
          temPlp: true,
        },
        {
          // recuperação: começou mal e reagiu na segunda metade
          nomeJogo: 'Publicações no Blog',
          verbo: 'Publicar',
          medida: 'artigos',
          metaSemanal: 8,
          realizado: (semana) => (semana <= 8 ? 5 : 12),
          compromisso: (semana) => (semana <= 8 ? 8 : 12),
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 12,
          observacoes: ['Reforço de redator freelancer a partir da semana 9 virou o jogo.'],
        },
        {
          // meta pequena, em dia
          nomeJogo: 'Eventos Realizados',
          verbo: 'Realizar',
          medida: 'eventos',
          metaSemanal: 2,
          realizado: () => 2,
          compromisso: () => 2,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 2,
        },
      ],
    },
    {
      departamento: depTi,
      lider: liderDois,
      nomeCopa: 'Copa de TI Demo',
      objetivo: 'Elevar a qualidade do atendimento interno',
      perfis: [
        {
          // constantemente abaixo da meta (ritmo ~80%) e compromissos não cumpridos
          nomeJogo: 'Chamados Resolvidos',
          verbo: 'Resolver',
          medida: 'chamados',
          metaSemanal: 10,
          realizado: () => 8,
          compromisso: () => 10,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 8,
          observacoes: ['Fila represada pela migração do sistema acadêmico. Plano de ação em andamento.'],
        },
        {
          // em dia, sem folga
          nomeJogo: 'Sistemas Atualizados',
          verbo: 'Atualizar',
          medida: 'sistemas',
          metaSemanal: 4,
          realizado: () => 4,
          compromisso: () => 4,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 4,
        },
        {
          // irregular: alterna semanas fortes e fracas, média no ritmo
          nomeJogo: 'Treinamentos de Equipe',
          verbo: 'Treinar',
          medida: 'turmas',
          metaSemanal: 2,
          realizado: (semana) => (semana % 2 === 0 ? 4 : 0),
          compromisso: () => 2,
          lancaSemanaAtual: true,
          realizadoSemanaAtual: 4,
        },
      ],
    },
    {
      departamento: depFinanceira,
      lider: liderDois,
      nomeCopa: 'Copa Financeira Demo',
      objetivo: 'Sanear a carteira e dar previsibilidade ao caixa',
      perfis: [
        {
          // começou bem e desabou: 3+ semanas abaixo (alerta de risco) e sem lançamento na semana atual
          nomeJogo: 'Redução de Inadimplência',
          verbo: 'Recuperar',
          medida: 'contratos',
          metaSemanal: 10,
          realizado: (semana) => (semana <= 8 ? 10 : 3),
          compromisso: () => 10,
          lancaSemanaAtual: false,
          observacoes: ['Queda coincide com a saída de dois analistas. Reposição em processo seletivo.'],
        },
        {
          // caiu na semana 11 e também parou de atualizar
          nomeJogo: 'Relatórios Entregues',
          verbo: 'Entregar',
          medida: 'relatórios',
          metaSemanal: 5,
          realizado: (semana) => (semana <= 10 ? 5 : 2),
          compromisso: () => 5,
          lancaSemanaAtual: false,
        },
        {
          // em dia no realizado, mas a equipe não registrou a semana corrente
          nomeJogo: 'Auditorias Concluídas',
          verbo: 'Auditar',
          medida: 'auditorias',
          metaSemanal: 1,
          realizado: () => 1,
          compromisso: () => 1,
          lancaSemanaAtual: false,
        },
      ],
    },
  ];

  for (const equipe of equipes) {
    const maiorMeta = Math.max(...equipe.perfis.map((p) => p.metaSemanal)) * SEMANAS_TOTAIS;

    const copa = await prisma.copa.create({
      data: {
        nome: equipe.nomeCopa,
        id_departamento: equipe.departamento.id_departamento,
        id_lider: equipe.lider.id_lider,
        objetivo: equipe.objetivo,
        inicio,
        fim,
        verbo: 'Alcançar',
        medida: 'pontos',
        de: 0,
        ate: maiorMeta,
      },
    });

    for (const perfil of equipe.perfis) {
      const placarDesejado = perfil.metaSemanal * SEMANAS_TOTAIS;

      const jogo = await prisma.jogo.create({
        data: {
          id_copa: copa.id_copa,
          id_lider: equipe.lider.id_lider,
          nome: perfil.nomeJogo,
          verbo: perfil.verbo,
          medida: perfil.medida,
          de: 0,
          para: placarDesejado,
          data_inicio: inicio,
          data_fim: fim,
          semanas: SEMANAS_TOTAIS,
          tem_plp: perfil.temPlp ?? false,
          data_criacao: inicio, // retro-datado: só a MCI nova deve disparar alerta de criação
        },
      });

      const previdencia = await prisma.previdencia.create({
        data: {
          id_jogo: jogo.id_jogo,
          unidade_medida: perfil.medida,
          placar_inicial: 0,
          placar_atual: 0,
          placar_desejado: placarDesejado,
          data_inicio: inicio,
          data_fim: fim,
          verbo: perfil.verbo,
        },
      });

      let acumulado = 0;
      const plps: number[] = [];

      for (let semana = 1; semana <= SEMANAS_DECORRIDAS; semana++) {
        const realizado = perfil.realizado(semana);
        acumulado += realizado;
        const atualizacao = await prisma.atualizacaoPrevidencia.create({
          data: {
            id_previdencia: previdencia.id_previdencia,
            numero_semana: semana,
            placar_atual: realizado,
            compromisso: perfil.compromisso(semana),
            data_criacao: addDays(inicio, (semana - 1) * 7 + 3), // quinta-feira da semana
          },
        });

        if (perfil.temPlp) {
          const dadosPlp = calcularPlpSemana(semana);
          plps.push(dadosPlp.plp);
          await prisma.plp.create({
            data: {
              id_previdencia: previdencia.id_previdencia,
              id_atualizacao: atualizacao.id_atualizacao,
              respondentes: dadosPlp.respondentes,
              propagadores: dadosPlp.propagadores,
              detratores: dadosPlp.detratores,
              neutros: dadosPlp.neutros,
              plp: dadosPlp.plp,
              data_criacao: addDays(inicio, (semana - 1) * 7 + 3),
            },
          });
        }
      }

      if (perfil.lancaSemanaAtual) {
        const realizado = perfil.realizadoSemanaAtual ?? perfil.metaSemanal;
        acumulado += realizado;
        await prisma.atualizacaoPrevidencia.create({
          data: {
            id_previdencia: previdencia.id_previdencia,
            numero_semana: SEMANAS_DECORRIDAS + 1,
            placar_atual: realizado,
            compromisso: perfil.metaSemanal,
            data_criacao: hoje,
          },
        });
      }

      const plpMedia = plps.length > 0
        ? parseFloat((plps.reduce((acc, v) => acc + v, 0) / plps.length).toFixed(2))
        : null;

      // invariante do sistema: placar_atual = inicial + soma dos lançamentos
      await prisma.previdencia.update({
        where: { id_previdencia: previdencia.id_previdencia },
        data: { placar_atual: acumulado, plp_media: plpMedia },
      });

      for (const [indice, texto] of (perfil.observacoes ?? []).entries()) {
        await prisma.observacaoPrevidencia.create({
          data: {
            id_previdencia: previdencia.id_previdencia,
            observacao: texto,
            data_criacao: addDays(inicio, 7 * (4 + indice * 4)),
          },
        });
      }
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
  console.log('Cadeia criada: Educamax Demo > Filial Norte/Sul Demo > 4 equipes, 14 MCIs');
  console.log('Perfis: Vendas (meta antecipada, on track, no ritmo exato, PLP),');
  console.log('        Marketing (on track, recuperação, eventos, MCI nova, PLP),');
  console.log('        TI (abaixo do ritmo, em dia, irregular),');
  console.log('        Financeira (em risco x2, sem atualização na semana)');
  console.log('');
  console.log('Usuários de teste (senha admin123):');
  console.log('  franqueadora.demo@mci.com  (admin local, nível franqueadora)');
  console.log('  filial.demo@mci.com        (admin local, nível filial - Filial Norte)');
  console.log('  departamento.demo@mci.com  (admin local, nível departamento - Equipe de Vendas)');
  console.log('  usuario.demo@mci.com       (usuário comum - só atualização semanal)');
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
