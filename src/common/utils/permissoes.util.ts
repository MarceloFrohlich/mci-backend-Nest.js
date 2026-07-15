import { ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UsuarioAutenticado } from '../types/usuario-autenticado.type';

export const ROLE_ADMIN_GLOBAL = 1;
export const ROLE_ADMIN_LOCAL = 2;
export const ROLE_USUARIO = 3;
export const NIVEL_FRANQUEADORA = 1;
export const NIVEL_FILIAL = 2;
export const NIVEL_DEPARTAMENTO = 3;

export function isAdminGlobal(usuario: UsuarioAutenticado): boolean {
  return usuario.id_role === ROLE_ADMIN_GLOBAL;
}

export function filtroFranqueadoras(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return { id_franqueadora: usuario.relacao, deletado_em: null };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return {
      filiais: { some: { id_filial: usuario.relacao, deletado_em: null } },
      deletado_em: null,
    };
  }
  return {
    filiais: {
      some: {
        departamentos: { some: { id_departamento: usuario.relacao, deletado_em: null } },
        deletado_em: null,
      },
    },
    deletado_em: null,
  };
}

export function filtroFiliais(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return { id_franqueadora: usuario.relacao, deletado_em: null };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return { id_filial: usuario.relacao, deletado_em: null };
  }
  return {
    departamentos: { some: { id_departamento: usuario.relacao, deletado_em: null } },
    deletado_em: null,
  };
}

export function filtroDepartamentos(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return {
      filial: { id_franqueadora: usuario.relacao, deletado_em: null },
      deletado_em: null,
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return { id_filial: usuario.relacao, deletado_em: null };
  }
  return { id_departamento: usuario.relacao, deletado_em: null };
}

export function filtroCopas(usuario: UsuarioAutenticado, anoAtivo: number) {
  const filtroBase = {
    deletado_em: null,
    inicio: { gte: new Date(`${anoAtivo}-01-01`) },
    fim: { lte: new Date(`${anoAtivo}-12-31`) },
  };

  if (isAdminGlobal(usuario)) return filtroBase;

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return {
      ...filtroBase,
      departamento: {
        filial: { id_franqueadora: usuario.relacao, deletado_em: null },
        deletado_em: null,
      },
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return {
      ...filtroBase,
      departamento: { id_filial: usuario.relacao, deletado_em: null },
    };
  }
  return { ...filtroBase, id_departamento: usuario.relacao };
}

export function filtroJogos(usuario: UsuarioAutenticado, anoAtivo: number) {
  const filtroBase = {
    deletado_em: null,
    data_inicio: { gte: new Date(`${anoAtivo}-01-01`) },
  };

  if (isAdminGlobal(usuario)) return filtroBase;

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return {
      ...filtroBase,
      copa: {
        departamento: {
          filial: { id_franqueadora: usuario.relacao, deletado_em: null },
          deletado_em: null,
        },
        deletado_em: null,
      },
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return {
      ...filtroBase,
      copa: {
        departamento: { id_filial: usuario.relacao, deletado_em: null },
        deletado_em: null,
      },
    };
  }
  return {
    ...filtroBase,
    copa: { id_departamento: usuario.relacao, deletado_em: null },
  };
}

// --- Escopo de tenant por ID (somente hierarquia, sem janela de ano) ---
// Usado para validar acesso a UM registro específico em operações por ID
// (buscar/atualizar/remover), sem o recorte de ano aplicado nas listagens.

export function escopoCopaPorId(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return {
      deletado_em: null,
      departamento: {
        filial: { id_franqueadora: usuario.relacao, deletado_em: null },
        deletado_em: null,
      },
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return {
      deletado_em: null,
      departamento: { id_filial: usuario.relacao, deletado_em: null },
    };
  }
  return { deletado_em: null, id_departamento: usuario.relacao };
}

export function escopoJogoPorId(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };
  return { deletado_em: null, copa: escopoCopaPorId(usuario) };
}

// Filtro de relação para escopar previdências (e seus filhos) pelo jogo/copa do usuário.
// Use como `jogo: escopoJogoDaPrevidencia(usuario)` dentro do where de uma previdência.
export function escopoJogoDaPrevidencia(usuario: UsuarioAutenticado) {
  return escopoJogoPorId(usuario);
}

// Resolve a franqueadora do usuário subindo a cadeia (departamento -> filial -> franqueadora).
export async function resolverIdFranqueadora(
  usuario: UsuarioAutenticado,
  prisma: PrismaClient,
): Promise<string | null> {
  if (!usuario.relacao) return null;

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) return usuario.relacao;

  if (usuario.id_nivel === NIVEL_FILIAL) {
    const filial = await prisma.filial.findFirst({
      where: { id_filial: usuario.relacao, deletado_em: null },
      select: { id_franqueadora: true },
    });
    return filial?.id_franqueadora ?? null;
  }

  const departamento = await prisma.departamento.findFirst({
    where: { id_departamento: usuario.relacao, deletado_em: null },
    select: { filial: { select: { id_franqueadora: true, deletado_em: true } } },
  });
  if (!departamento?.filial || departamento.filial.deletado_em) return null;
  return departamento.filial.id_franqueadora;
}

export async function filtroLideres(usuario: UsuarioAutenticado, prisma: PrismaClient) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  const idFranqueadora = await resolverIdFranqueadora(usuario, prisma);
  if (!idFranqueadora) {
    throw new ForbiddenException('Usuário não tem relação com nenhuma franqueadora');
  }
  return { id_franqueadora: idFranqueadora, deletado_em: null };
}

// Valida se uma relação (nível + id da entidade) pertence à cadeia do solicitante.
// Usado para impedir que admin local crie/mova usuários para fora da própria cadeia.
export async function relacaoNaCadeia(
  usuario: UsuarioAutenticado,
  idNivelAlvo: number,
  relacaoAlvo: string | null,
  prisma: PrismaClient,
): Promise<boolean> {
  if (isAdminGlobal(usuario)) return true;
  if (!usuario.relacao || !relacaoAlvo) return false;

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    if (idNivelAlvo === NIVEL_FRANQUEADORA) return relacaoAlvo === usuario.relacao;
    if (idNivelAlvo === NIVEL_FILIAL) {
      const filial = await prisma.filial.findFirst({
        where: { id_filial: relacaoAlvo, id_franqueadora: usuario.relacao, deletado_em: null },
      });
      return !!filial;
    }
    const departamento = await prisma.departamento.findFirst({
      where: {
        id_departamento: relacaoAlvo,
        deletado_em: null,
        filial: { id_franqueadora: usuario.relacao, deletado_em: null },
      },
    });
    return !!departamento;
  }

  if (usuario.id_nivel === NIVEL_FILIAL) {
    if (idNivelAlvo === NIVEL_FILIAL) return relacaoAlvo === usuario.relacao;
    if (idNivelAlvo === NIVEL_DEPARTAMENTO) {
      const departamento = await prisma.departamento.findFirst({
        where: { id_departamento: relacaoAlvo, id_filial: usuario.relacao, deletado_em: null },
      });
      return !!departamento;
    }
    return false;
  }

  return idNivelAlvo === NIVEL_DEPARTAMENTO && relacaoAlvo === usuario.relacao;
}

export async function filtroUsuarios(usuario: UsuarioAutenticado, prisma: PrismaClient) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  const NADA = { id_usuario: { in: [] as string[] } };
  if (!usuario.relacao) return NADA;

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    const filiais = await prisma.filial.findMany({
      where: { id_franqueadora: usuario.relacao, deletado_em: null },
      select: { id_filial: true },
    });
    const idsFiliais = filiais.map((f) => f.id_filial);
    const departamentos = idsFiliais.length
      ? await prisma.departamento.findMany({
          where: { id_filial: { in: idsFiliais }, deletado_em: null },
          select: { id_departamento: true },
        })
      : [];
    return {
      deletado_em: null,
      OR: [
        { relacao: usuario.relacao, id_nivel: NIVEL_FRANQUEADORA },
        { relacao: { in: idsFiliais }, id_nivel: NIVEL_FILIAL },
        {
          relacao: { in: departamentos.map((d) => d.id_departamento) },
          id_nivel: NIVEL_DEPARTAMENTO,
        },
      ],
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    const departamentos = await prisma.departamento.findMany({
      where: { id_filial: usuario.relacao, deletado_em: null },
      select: { id_departamento: true },
    });
    return {
      deletado_em: null,
      OR: [
        { relacao: usuario.relacao, id_nivel: NIVEL_FILIAL },
        {
          relacao: { in: departamentos.map((d) => d.id_departamento) },
          id_nivel: NIVEL_DEPARTAMENTO,
        },
      ],
    };
  }
  return { relacao: usuario.relacao, id_nivel: NIVEL_DEPARTAMENTO, deletado_em: null };
}
