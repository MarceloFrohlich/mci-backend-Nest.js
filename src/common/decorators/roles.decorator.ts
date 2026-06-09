import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Restringe o acesso a uma rota/controller a determinados id_role.
 * Deve ser usado em conjunto com o RolesGuard (após o JwtAuthGuard).
 */
export const Roles = (...roles: number[]) => SetMetadata(ROLES_KEY, roles);
