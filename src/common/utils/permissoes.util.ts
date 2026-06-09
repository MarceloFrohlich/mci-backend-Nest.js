import { UsuarioAutenticado } from '../types/usuario-autenticado.type';

export const ROLE_ADMIN_GLOBAL = 1;
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

export function filtroLideres(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };
  return { id_franqueadora: usuario.relacao, deletado_em: null };
}

export function filtroUsuarios(usuario: UsuarioAutenticado) {
  if (isAdminGlobal(usuario)) return { deletado_em: null };

  if (usuario.id_nivel === NIVEL_FRANQUEADORA) {
    return {
      deletado_em: null,
      OR: [
        { relacao: usuario.relacao, id_nivel: NIVEL_FRANQUEADORA },
        {
          nivel: {
            id_nivel: { in: [NIVEL_FILIAL, NIVEL_DEPARTAMENTO] },
          },
        },
      ],
    };
  }
  if (usuario.id_nivel === NIVEL_FILIAL) {
    return { relacao: usuario.relacao, id_nivel: NIVEL_FILIAL, deletado_em: null };
  }
  return { relacao: usuario.relacao, id_nivel: NIVEL_DEPARTAMENTO, deletado_em: null };
}
