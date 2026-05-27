# Deploy MCI — Hostinger VPS com Coolify

Guia completo para hospedar o backend (NestJS) e o frontend (Next.js) num VPS da Hostinger
com deploy automático via GitHub (push na `main` → deploy).

---

## Índice

1. [Requisitos](#1-requisitos)
2. [Configurar o VPS](#2-configurar-o-vps)
3. [Instalar o Coolify](#3-instalar-o-coolify)
4. [Configurar o banco de dados PostgreSQL](#4-configurar-o-banco-de-dados-postgresql)
5. [Deploy do Backend (NestJS)](#5-deploy-do-backend-nestjs)
6. [Deploy do Frontend (Next.js)](#6-deploy-do-frontend-nextjs)
7. [Variáveis de ambiente](#7-variáveis-de-ambiente)
8. [Domínio e SSL](#8-domínio-e-ssl)
9. [Push-to-deploy automático](#9-push-to-deploy-automático)
10. [Manutenção e migrações](#10-manutenção-e-migrações)

---

## 1. Requisitos

| Item | Mínimo recomendado |
|------|--------------------|
| VPS Hostinger | **KVM 2** (2 vCPU, 8 GB RAM, 100 GB NVMe) |
| Sistema operacional | Ubuntu 22.04 LTS |
| Domínio | Apontado para o IP do VPS (registro A) |
| Repositórios | Backend e frontend em repositórios GitHub separados |

> O Coolify precisa de pelo menos **2 GB de RAM** só para si. Com banco + backend + frontend, 8 GB garante folga.

---

## 2. Configurar o VPS

Acesse o VPS via SSH como root:

```bash
ssh root@SEU_IP_DO_VPS
```

Atualize o sistema e instale dependências básicas:

```bash
apt-get update && apt-get upgrade -y
apt-get install -y curl wget git
```

---

## 3. Instalar o Coolify

Execute o instalador oficial em um único comando:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

Aguarde ~5 minutos. Ao final, acesse o painel pelo navegador:

```
http://SEU_IP_DO_VPS:8000
```

Crie a conta de administrador na primeira tela. Guarde bem o e-mail e a senha.

### Conectar o GitHub

No painel do Coolify:

1. **Settings → Source → GitHub App → Register new GitHub App**
2. Siga o fluxo de autorização no GitHub
3. Selecione os repositórios do backend e do frontend

---

## 4. Configurar o banco de dados PostgreSQL

No Coolify:

1. **New Resource → Database → PostgreSQL**
2. Defina nome, usuário e senha
3. Anote a **connection string** gerada — será usada como `DATABASE_URL` no backend

Formato da string:
```
postgresql://USUARIO:SENHA@SEU_IP_DO_VPS:5432/NOME_DO_BANCO?schema=public
```

---

## 5. Deploy do Backend (NestJS)

O projeto já possui um `Dockerfile` pronto. O Coolify o detecta automaticamente.

### Criar o serviço

1. **New Resource → Application → GitHub Repository**
2. Selecione o repositório do backend
3. Branch: `main`
4. Build Pack: **Dockerfile** (detectado automaticamente)
5. Porta: `3000`

### Variáveis de ambiente obrigatórias

Em **Environment Variables** do serviço, adicione:

```env
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/NOME_DO_BANCO?schema=public
JWT_SECRET=troque-por-um-segredo-forte-em-producao
JWT_EXPIRATION=8h
PORT=3000
RESEND_API_KEY=re_suaApiKeyDoResend
MAIL_FROM=MCI 2.0 <noreply@seudominio.com>
```

### Domínio do backend

Em **Domains**, configure:
```
api.seudominio.com
```

O Coolify provisiona o SSL automaticamente via Let's Encrypt.

---

## 6. Deploy do Frontend (Next.js)

1. **New Resource → Application → GitHub Repository**
2. Selecione o repositório do frontend
3. Branch: `main`
4. Build Pack: **Nixpacks** ou **Node.js** (Coolify detecta Next.js automaticamente)
5. Porta: `3000`

### Variáveis de ambiente do frontend

```env
NEXT_PUBLIC_API_URL=https://api.seudominio.com
```

> Ajuste o nome da variável conforme o que seu projeto Next.js usa para apontar à API.

### Domínio do frontend

```
app.seudominio.com
```

---

## 7. Variáveis de ambiente

Resumo completo de todas as variáveis necessárias:

### Backend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://...` |
| `JWT_SECRET` | Chave secreta para assinar os tokens JWT | string aleatória longa |
| `JWT_EXPIRATION` | Tempo de expiração do token | `8h` |
| `PORT` | Porta que o app escuta | `3000` |
| `RESEND_API_KEY` | API key do Resend para envio de e-mails | `re_...` |
| `MAIL_FROM` | Remetente dos e-mails | `MCI 2.0 <noreply@dominio.com>` |

### Frontend

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL base da API | `https://api.seudominio.com` |

---

## 8. Domínio e SSL

### Apontar o DNS na Hostinger

No painel de DNS do domínio (Hostinger → Domínios → Gerenciar DNS), adicione:

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | IP do VPS |
| A | `api` | IP do VPS |
| A | `app` | IP do VPS |

> A propagação de DNS pode levar até 24 horas, mas costuma ser menos de 1 hora.

### SSL automático

O Coolify provisiona certificados Let's Encrypt automaticamente quando o domínio já está apontado para o VPS. Nenhuma configuração extra necessária.

---

## 9. Push-to-deploy automático

No Coolify, em cada serviço:

1. **Settings → Deploy → Enable Auto Deploy**
2. Selecione a branch `main`

A partir daí, todo `git push origin main` dispara um novo deploy automaticamente, idêntico ao comportamento do Railway e da Vercel.

---

## 10. Manutenção e migrações

### Migrações do banco

O `Dockerfile` do backend já executa `prisma migrate deploy` automaticamente antes de subir o app:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
```

As migrações rodam sozinhas a cada deploy. Nenhuma ação manual necessária.

### Acessar o banco via terminal

No painel do Coolify, clique no serviço do PostgreSQL → **Terminal** → use o `psql` diretamente.

### Ver logs em tempo real

Coolify → serviço → aba **Logs** — equivalente ao que o Railway oferece.

### Escalar recursos

Para aumentar RAM/CPU, redimensione o plano do VPS na Hostinger e reinicie o Coolify. Nenhuma mudança de configuração necessária.

---

## Resumo do fluxo de trabalho

```
git push origin main
       │
       ▼
  GitHub Webhook
       │
       ▼
   Coolify CI
  ┌─────────────────┐
  │  docker build   │
  │  migrate DB     │
  │  start app      │
  └─────────────────┘
       │
       ▼
  App no ar com SSL
```
