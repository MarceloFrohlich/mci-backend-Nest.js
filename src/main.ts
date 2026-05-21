import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { FiltroHttpException } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new FiltroHttpException());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MCI API')
    .setDescription(
      'API REST do sistema MCI — Rastreamento de Metas Corporativas organizado em Copas do Mundo.\n\n' +
      '**Autenticação:** Bearer JWT. Faça login em `POST /auth/login` e use o token retornado no cabeçalho `Authorization: Bearer <token>`.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('Auth', 'Autenticação e sessão do usuário')
    .addTag('Usuários', 'Gestão de usuários com controle de acesso hierárquico')
    .addTag('Franqueadoras', 'Gestão de franqueadoras (topo da hierarquia)')
    .addTag('Filiais', 'Gestão de filiais vinculadas a franqueadoras')
    .addTag('Departamentos', 'Gestão de departamentos vinculados a filiais')
    .addTag('Copas', 'Campanhas de metas (Copas do Mundo)')
    .addTag('Líderes', 'Gestão de líderes de jogos')
    .addTag('Jogos', 'Iniciativas mensuráveis dentro de uma copa')
    .addTag('Previdências', 'Rastreamento semanal de metas por jogo')
    .addTag('PLPs', 'Net Promoter Score (propagadores − detratores)')
    .addTag('Observações', 'Anotações vinculadas a previdências')
    .addTag('Gráficos', 'Dados formatados para visualização gráfica')
    .addTag('Relatórios', 'Relatório completo de uma copa com cálculos de progresso')
    .build();

  const documento = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, documento, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
    },
    customSiteTitle: 'MCI API — Documentação',
  });

  const porta = process.env.PORT ?? 3000;
  await app.listen(porta);
  console.log(`MCI API rodando em: http://localhost:${porta}`);
  console.log(`Documentação Swagger: http://localhost:${porta}/docs`);
}

bootstrap();
