export interface UsuarioAutenticado {
  id_usuario: string;
  nome: string;
  email: string;
  id_role: number;
  id_nivel: number;
  relacao: string | null;
  ano_ativo: number;
}
