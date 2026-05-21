import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roleAdmin = await prisma.role.upsert({
    where: { id_role: 1 },
    update: {},
    create: { id_role: 1, nome: 'Admin Global' },
  });

  const roleLocal = await prisma.role.upsert({
    where: { id_role: 2 },
    update: {},
    create: { id_role: 2, nome: 'Admin Local' },
  });

  const nivelFranqueadora = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 1 },
    update: {},
    create: { id_nivel: 1, nome: 'Franqueadora' },
  });

  const nivelFilial = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 2 },
    update: {},
    create: { id_nivel: 2, nome: 'Filial' },
  });

  const nivelDepartamento = await prisma.nivelUsuario.upsert({
    where: { id_nivel: 3 },
    update: {},
    create: { id_nivel: 3, nome: 'Departamento' },
  });

  const senhaHash = await bcrypt.hash('admin123', 10);

  const adminExistente = await prisma.usuario.findFirst({
    where: { email: 'admin@mci.com', deletado_em: null },
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
      data: { id_usuario: admin.id_usuario, ano: new Date().getFullYear() },
    });

    console.log('Usuário admin criado: admin@mci.com / admin123');
  } else {
    console.log('Usuário admin já existe');
  }

  console.log('Seed concluído');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
