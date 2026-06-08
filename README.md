# MCI API

API REST do sistema **MCI — Rastreamento de Metas Corporativas**, organizado em campanhas chamadas de *Copas do Mundo*. Cada copa agrupa jogos com metas mensuráveis e acompanhamento semanal de progresso.

---

## Sumário

- [Stack](#stack)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do ambiente](#configuração-do-ambiente)
- [Banco de dados](#banco-de-dados)
- [Rodando o serviço](#rodando-o-serviço)
- [Subindo no Git](#subindo-no-git)
- [Documentação Swagger](#documentação-swagger)
- [Hierarquia de dados](#hierarquia-de-dados)
- [Hierarquia de usuários e permissões](#hierarquia-de-usuários-e-permissões)
- [Rotas da API](#rotas-da-api)
- [Regras de negócio principais](#regras-de-negócio-principais)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20+ |
| Framework | NestJS 10 |
| ORM | Prisma 5 |
| Banco de dados | PostgreSQL 15+ |
| Autenticação | JWT (passport-jwt) |
| Validação | class-validator + class-transformer |
| Documentação | Swagger (@nestjs/swagger) |
| Linguagem | TypeScript 5 |

---

## Pré-requisitos

- **Node.js** >= 20
- **npm** >= 10
- **PostgreSQL** >= 15 rodando localmente ou via Docker
- **Git**

### PostgreSQL via Docker (opcional)

```bash
docker run --name mci-postgres \
  -e POSTGRES_USER=mci \
  -e POSTGRES_PASSWORD=mci123 \
  -e POSTGRES_DB=mci_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## Configuração do ambiente

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Edite o `.env` com suas credenciais:

```env
DATABASE_URL="postgresql://mci:mci123@localhost:5432/mci_db?schema=public"
JWT_SECRET="troque-este-segredo-em-producao"
JWT_EXPIRATION="8h"
PORT=3000
```

> **Atenção:** nunca suba o `.env` para o repositório. Ele já está no `.gitignore`.

---

## Banco de dados

### 1. Instalar dependências

```bash
npm install
```

### 2. Gerar o cliente Prisma

```bash
npx prisma generate
```

### 3. Criar as tabelas (migration)

```bash
npx prisma migrate dev --name init
```

Isso cria todas as tabelas no banco conforme o `prisma/schema.prisma`.

### 4. Popular dados iniciais (seed)

```bash
npx ts-node prisma/seed.ts
```

O seed cria:
- Roles: `Admin Global` (id 1) e `Admin Local` (id 2)
- Níveis: `Franqueadora` (1), `Filial` (2), `Departamento` (3)
- Usuário administrador padrão:
  - **E-mail:** `admin@mci.com`
  - **Senha:** `admin123`

### Comandos úteis do Prisma

```bash
# Abrir o Prisma Studio (visualizador de banco)
npx prisma studio

# Resetar banco (CUIDADO: apaga todos os dados)
npx prisma migrate reset

# Ver status das migrations
npx prisma migrate status
```

---

## Rodando o serviço

### Desenvolvimento (com hot reload)

```bash
npm run start:dev
```

### Produção

```bash
npm run build
npm run start:prod
```

O serviço sobe em `http://localhost:3000` (ou na porta definida em `PORT`).

---

## Subindo no Git

```bash
# Inicializar repositório (se ainda não existir)
git init

# Adicionar remote
git remote add origin https://github.com/seu-usuario/mci-api.git

# Primeiro commit
git add .
git commit -m "feat: API MCI — NestJS + Prisma + PostgreSQL"

# Subir para o repositório
git push -u origin main
```

> O `.gitignore` já exclui: `node_modules/`, `dist/`, `.env` e arquivos de log.

### Fluxo de trabalho recomendado

```bash
# Antes de qualquer mudança no schema do banco
npx prisma migrate dev --name descricao-da-mudanca

# Após pull de outro desenvolvedor
npm install
npx prisma generate
npx prisma migrate deploy
```

---

## Documentação Swagger

Com o serviço rodando, acesse:

```
http://localhost:3000/docs
```

A interface permite:
- Visualizar todos os endpoints organizados por tag
- Testar requisições diretamente no navegador
- Autenticar via JWT: clique em **Authorize** e informe `Bearer <token>`

Para obter o token, use `POST /auth/login` com e-mail e senha.

---

## Hierarquia de dados

```
Franqueadora  (empresa / rede)
└── Filial  (unidade regional)
    └── Departamento  (setor)
        └── Copa  (campanha com período e objetivo)
            └── Jogo  (iniciativa mensurável com líder)
                ├── Previdência  (rastreamento semanal)
                │   ├── Atualização de Placar  (histórico semanal)
                │   ├── PLP / NPS  (Net Promoter Score)
                │   └── Observação  (notas e comentários)
                └── Status do Jogo
```

Todos os registros possuem soft delete via campo `deletado_em`.
Registros de copas e jogos são filtrados pelo **ano ativo** do usuário logado.

---

## Hierarquia de usuários e permissões

| Role | Nível | Campo `relacao` | Acesso |
|------|-------|-----------------|--------|
| 1 (Admin Global) | qualquer | nulo | Todos os dados sem restrição |
| 2 (Admin Local) | 1 — Franqueadora | UUID da franqueadora | Sua franqueadora + filiais + departamentos |
| 2 (Admin Local) | 2 — Filial | UUID da filial | Sua filial + departamentos |
| 2 (Admin Local) | 3 — Departamento | UUID do departamento | Apenas seu departamento |

As permissões são aplicadas automaticamente pelo servidor — o cliente não precisa enviar filtros.

---

## Rotas da API

Todas as rotas (exceto `POST /auth/login`) exigem o cabeçalho:

```
Authorization: Bearer <token>
```

### Auth

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/login` | Login — retorna JWT |
| POST | `/auth/logout` | Logout |
| GET | `/auth/me` | Dados do usuário autenticado com ano ativo |
| PATCH | `/auth/ano` | Muda o ano ativo do usuário `{ "ano": 2025 }` |

---

### Usuários

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/usuarios` | Lista usuários conforme permissões |
| GET | `/usuarios/formulario` | Dados para formulário (roles, níveis, franqueadoras, filiais, depts) |
| GET | `/usuarios/:id` | Busca usuário por ID |
| POST | `/usuarios` | Cria usuário |
| PUT | `/usuarios/:id` | Atualiza usuário |
| POST | `/usuarios/:id/remover` | Remove usuário (soft delete com hash no e-mail) |
| POST | `/usuarios/filtrar` | Filtra por nome, e-mail, role ou nível |

**Body de criação:**
```json
{
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "senha": "senha123",
  "confirmacao_senha": "senha123",
  "id_role": 2,
  "id_nivel": 3,
  "relacao": "uuid-do-departamento"
}
```

---

### Franqueadoras

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/franqueadoras` | Lista conforme permissões |
| GET | `/franqueadoras/:id` | Busca por ID |
| POST | `/franqueadoras` | Cria `{ "nome": "..." }` |
| PUT | `/franqueadoras/:id` | Atualiza |
| POST | `/franqueadoras/:id/remover` | Remove em cascata (filiais e departamentos) |
| POST | `/franqueadoras/filtrar` | Filtra por nome |

---

### Filiais

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/filiais` | Lista conforme permissões |
| GET | `/filiais/franqueadoras` | Lista franqueadoras para select |
| GET | `/filiais/:id` | Busca por ID |
| POST | `/filiais` | Cria `{ "nome": "...", "id_franqueadora": "uuid" }` |
| PUT | `/filiais/:id` | Atualiza |
| POST | `/filiais/:id/remover` | Remove em cascata (departamentos) |
| POST | `/filiais/filtrar` | Filtra por nome ou franqueadora |

---

### Departamentos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/departamentos` | Lista conforme permissões |
| GET | `/departamentos/com-copa` | Lista apenas departamentos com copa ativa |
| GET | `/departamentos/filiais` | Lista filiais para select |
| GET | `/departamentos/:id` | Busca por ID |
| POST | `/departamentos` | Cria `{ "nome": "...", "id_filial": "uuid" }` |
| PUT | `/departamentos/:id` | Atualiza |
| POST | `/departamentos/:id/remover` | Remove (soft delete) |
| POST | `/departamentos/filtrar` | Filtra por nome, filial, franqueadora ou com/sem copa |

---

### Copas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/copas` | Lista copas do ano ativo conforme permissões |
| GET | `/copas/select` | Lista simplificada (id + nome) para select |
| GET | `/copas/por-departamento/:id` | Copas de um departamento |
| GET | `/copas/:id` | Busca por ID com hierarquia completa |
| POST | `/copas` | Cria copa — aceita múltiplos departamentos |
| PUT | `/copas/:id` | Atualiza |
| POST | `/copas/:id/remover` | Remove em cascata (jogos, previdências, PLPs, observações) |
| POST | `/copas/filtrar` | Filtra por nome, departamento, filial, franqueadora ou período |

**Body de criação (cria uma copa por departamento):**
```json
{
  "nome": "Copa Q1 2025",
  "ids_departamentos": ["uuid-dept-1", "uuid-dept-2"],
  "inicio": "2025-01-01",
  "fim": "2025-03-31",
  "objetivo": "Aumentar captação",
  "verbo": "Captar",
  "medida": "contratos",
  "de": 0,
  "ate": 100
}
```

---

### Líderes

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/lideres` | Lista (admin global vê todos, demais veem só da sua franqueadora) |
| GET | `/lideres/:id` | Busca por ID |
| POST | `/lideres` | Cria `{ "nome": "..." }` (franqueadora vinculada automaticamente) |
| PUT | `/lideres/:id` | Atualiza nome |
| POST | `/lideres/:id/remover` | Remove (soft delete) |
| POST | `/lideres/filtrar` | Filtra por nome |

---

### Jogos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/jogos` | Lista jogos do ano ativo conforme permissões |
| GET | `/jogos/select` | Lista simplificada (id + nome) para select |
| GET | `/jogos/por-copa/:id` | Jogos de uma copa |
| GET | `/jogos/por-departamento/:id` | Jogos de um departamento |
| GET | `/jogos/:id` | Busca por ID com previdências e status |
| POST | `/jogos` | Cria jogo |
| PUT | `/jogos/:id` | Atualiza |
| POST | `/jogos/:id/remover` | Remove em cascata |
| POST | `/jogos/:id/duplicar` | Duplica jogo (sem previdências) |
| PATCH | `/jogos/:id/status` | Cria ou atualiza status `{ "status": "...", "valor": "..." }` |
| POST | `/jogos/filtrar` | Filtra por nome, copa, departamento ou líder |

**Body de criação:**
```json
{
  "id_copa": "uuid-copa",
  "id_lider": "uuid-lider",
  "nome": "Captação de Novos Contratos",
  "verbo": "Captar",
  "medida": "contratos",
  "de": 0,
  "para": 50,
  "data_inicio": "2025-01-01",
  "data_fim": "2025-03-31",
  "tem_plp": false
}
```

---

### Previdências

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/previdencias/por-jogo/:id` | Lista com meta semanal e progresso calculados |
| GET | `/previdencias/por-departamento/:id` | Lista por departamento com cálculos |
| GET | `/previdencias/:id/atualizacoes` | Histórico de atualizações de placar |
| GET | `/previdencias/:id` | Busca por ID com meta semanal |
| POST | `/previdencias` | Cria previdência |
| PUT | `/previdencias/:id` | Atualiza dados |
| POST | `/previdencias/:id/remover` | Remove em cascata |
| POST | `/previdencias/:id/duplicar` | Duplica (reinicia placar_atual) |
| POST | `/previdencias/:id/placar` | Registra atualização semanal `{ "placar_atual": 30 }` |
| DELETE | `/previdencias/atualizacoes/:id` | Remove uma atualização do histórico |

**Body de criação:**
```json
{
  "id_jogo": "uuid-jogo",
  "unidade_medida": "contratos",
  "placar_inicial": 0,
  "placar_desejado": 50,
  "data_inicio": "2025-01-01",
  "data_fim": "2025-03-31",
  "inativo_de": null,
  "inativo_ate": null,
  "verbo": "Captar"
}
```

**Campos calculados retornados:**
```json
{
  "meta_semanal": 4,
  "progresso": {
    "semanas_totais": 13,
    "semanas_inatividade": 0,
    "semanas_efetivas": 13,
    "valor_por_semana": 3.85,
    "semanas_decorridas": 6,
    "semanas_decorridas_ajustadas": 6,
    "valor_previsto_ate_hoje": 23.08,
    "valor_atual": 18,
    "percentual": 77.98
  }
}
```

---

### PLPs (Net Promoter Score)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/plps/por-previdencia/:id` | Lista PLPs de uma previdência |
| POST | `/plps` | Cria PLP — calcula NPS e recalcula média da previdência |
| POST | `/plps/:id/remover` | Remove PLP e recalcula média |

**Body de criação:**
```json
{
  "id_previdencia": "uuid-previdencia",
  "respondentes": 100,
  "propagadores": 60,
  "detratores": 20,
  "neutros": 20
}
```

**Cálculo:** `PLP = (propagadores/respondentes × 100) − (detratores/respondentes × 100)`
Neste exemplo: `60% − 20% = 40`

---

### Observações

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/observacoes/por-previdencia/:id` | Lista observações de uma previdência |
| GET | `/observacoes/:id` | Busca por ID |
| POST | `/observacoes` | Cria `{ "id_previdencia": "uuid", "observacao": "texto" }` |
| PUT | `/observacoes/:id` | Atualiza texto |
| POST | `/observacoes/:id/remover` | Remove (soft delete) |

---

### Gráficos

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/graficos/previdencias/:id` | Dados de previdências de uma copa (histórico + progresso) |
| GET | `/graficos/jogos/:id` | Dados de jogos de uma copa com progresso por previdência |

O parâmetro `:id` é o `id_copa`.

---

### Relatórios

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/relatorios/copa/:id` | Relatório completo de uma copa com todos os cálculos |
| POST | `/relatorios/status/:idJogo` | Cria ou atualiza status de um jogo |
| PATCH | `/relatorios/status/:id` | Atualiza status existente |

---

## Regras de negócio principais

### Meta semanal (calculada automaticamente)
```
semanas_totais  = differenceInWeeks(data_fim, data_inicio) + 1   // 1ª semana já conta (Modelo A)
semanas_ativas  = semanas_totais − semanas_dentro_do_periodo_inativo
meta_semanal    = ceil((placar_desejado − placar_inicial) / semanas_ativas)
```
- O `+ 1` existe porque `data_inicio` e `data_fim` são **inclusivas**: um jogo de 02/01 a 30/01 tem 5 quintas de lançamento (não 4 intervalos). A primeira quinta já espera resultado lançado.
- O divisor usa apenas o **saldo de semanas ativas** — as semanas que caem no período de inatividade (`inativo_de`..`inativo_ate`) são descontadas, exatamente as mesmas que `gerarSemanas` esconde do front.

### Validação de meta inteira (criação/atualização)
Ao criar uma previdência (avulsa, via update ou na criação do jogo), a meta (`placar_desejado`) é validada contra o saldo de semanas ativas. Se a divisão **não** der um valor inteiro por semana, a API responde **400** sugerindo a meta inteira imediatamente abaixo e acima:
```
A meta 100 dividida em 23 semanas resulta em 4.35 por semana, que não é um
valor inteiro. Use 92 (4/semana) ou 115 (5/semana) para uma meta semanal inteira.
```

### NPS / PLP
```
plp = (propagadores / respondentes × 100) − (detratores / respondentes × 100)
plp_media = média de todos os PLPs da previdência (recalculada a cada inserção/remoção)
```

### Progresso com períodos de inatividade
```
semanas_efetivas = semanas_ativas                                   // = meta_semanal usa a mesma base
valor_por_semana = (placar_desejado − placar_inicial) / semanas_efetivas
valor_previsto   = valor_por_semana × semanas_ativas_decorridas     // só semanas ativas já passadas
percentual       = (placar_atual − placar_inicial) / valor_previsto × 100
```
`valor_por_semana` é idêntico ao `meta_semanal` (mesma base de semanas ativas). Antes do jogo começar, `semanas_ativas_decorridas = 0`.

### Multi-ano
O campo `ano_ativo` no token JWT determina quais copas e jogos são exibidos. Copas e jogos são filtrados automaticamente pelo ano de suas datas de início. O ano pode ser alterado via `PATCH /auth/ano`.

### Deleção em cascata
- **Franqueadora** → filiais → departamentos
- **Copa** → jogos → previdências → atualizações + PLPs + observações
- **Usuários**: soft delete com hash no e-mail para preservar unicidade

---

## Variáveis de ambiente

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Chave secreta para assinar tokens | string aleatória longa |
| `JWT_EXPIRATION` | Tempo de expiração do token | `8h`, `1d`, `30m` |
| `PORT` | Porta do servidor | `3000` |
