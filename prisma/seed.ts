import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed...');

  // ROLES
  const roleAdmin = await prisma.role.upsert({
    where: { id_role: 1 },
    update: {},
    create: {
      id_role: 1,
      nome: 'Admin Global',
    },
  });

  const roleLocal = await prisma.role.upsert({
    where: { id_role: 2 },
    update: {},
    create: {
      id_role: 2,
      nome: 'Admin Local',
    },
  });

  // NÍVEIS
  const nivelFranqueadora = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 1 },
    update: {},
    create: {
      id_nivel: 1,
      nome: 'Franqueadora',
    },
  });

  const nivelFilial = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 2 },
    update: {},
    create: {
      id_nivel: 2,
      nome: 'Filial',
    },
  });

  const nivelDepartamento = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 3 },
    update: {},
    create: {
      id_nivel: 3,
      nome: 'Departamento',
    },
  });

  // HASH SENHA
  const senhaHash = await bcrypt.hash('admin123', 10);

  // VERIFICA ADMIN
  const adminExistente = await prisma.usuario.findFirst({
    where: {
      email: 'admin@mci.com',
      deletado_em: null,
    },
  });

  if (!adminExistente) {
    const admin = await prisma.usuario.create({
      data: {
        nome: 'Administrador',
        email: 'admin@mci.com',
        senha: senhaHash,
        id_role: roleAdmin.id_role,
        id_nivel: nivelFranqueadora.id_nivel,
        relacao: null,
      },
    });

    await prisma.usuarioAno.create({
      data: {
        id_usuario: admin.id_usuario,
        ano: new Date().getFullYear(),
      },
    });

    console.log('Usuário admin criado');
    console.log('Email: admin@mci.com');
    console.log('Senha: admin123');
  } else {
    console.log('Usuário admin já existe');
  }

  console.log('Seed concluído com sucesso');
}

main()
  .catch((error) => {
    console.error('Erro ao executar seed:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });