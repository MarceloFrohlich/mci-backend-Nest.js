# Guia de Deploy — MCI API

Stack: **NestJS + Prisma + PostgreSQL**

Escolha uma das duas opções abaixo.

---

## Opção 1 — Railway (recomendado para iniciar rápido)

O Railway detecta o projeto automaticamente, provisiona o banco PostgreSQL e gerencia tudo na nuvem. Não requer servidor próprio.

### Pré-requisitos

- Conta no [Railway](https://railway.app)
- Repositório no GitHub com o código da API

---

### Passo 1 — Criar o projeto no Railway

1. Acesse [railway.app](https://railway.app) e clique em **New Project**
2. Escolha **Deploy from GitHub repo**
3. Autorize o Railway a acessar sua conta GitHub e selecione o repositório `mci-api`

---

### Passo 2 — Adicionar o banco de dados PostgreSQL

1. No dashboard do projeto, clique em **+ New** → **Database** → **Add PostgreSQL**
2. O Railway vai criar um banco e gerar automaticamente a variável `DATABASE_URL`

---

### Passo 3 — Configurar as variáveis de ambiente

No painel do serviço da API, vá em **Variables** e adicione:

| Variável | Valor |
|---|---|
| `JWT_SECRET` | Uma string longa e aleatória (ex: `openssl rand -base64 48`) |
| `JWT_EXPIRATION` | `8h` |
| `PORT` | `3000` |

> A variável `DATABASE_URL` já é injetada automaticamente pelo addon PostgreSQL — não precisa adicionar manualmente.

---

### Passo 4 — Configurar o comando de build e start

No painel do serviço, vá em **Settings → Deploy** e configure:

| Campo | Valor |
|---|---|
| **Build Command** | `npm install && npm run build && npx prisma generate && npx prisma migrate deploy` |
| **Start Command** | `node dist/main` |

> `prisma migrate deploy` aplica as migrations existentes sem resetar dados. Nunca use `migrate dev` em produção.

---

### Passo 5 — Fazer o deploy

O Railway faz deploy automaticamente a cada push no branch configurado (padrão: `main`).

Para forçar um deploy manual: **Deploy** → **Trigger Deploy**.

---

### Passo 6 — Verificar

Após o deploy, o Railway exibe a URL pública do serviço (ex: `https://mci-api-production.up.railway.app`).

- **API:** `https://sua-url.up.railway.app`
- **Swagger:** `https://sua-url.up.railway.app/docs`
- **JSON Postman:** `https://sua-url.up.railway.app/docs-json`

---

### Rodar o seed (dados iniciais) — opcional

Pelo terminal do Railway (**Settings → Shell**) ou via CLI:

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login e link ao projeto
railway login
railway link

# Rodar o seed
railway run npx ts-node prisma/seed.ts
```

---

### Variáveis de ambiente completas — Railway

```env
DATABASE_URL=          # gerada automaticamente pelo addon PostgreSQL
JWT_SECRET=            # string secreta longa (mínimo 32 caracteres)
JWT_EXPIRATION=8h
PORT=3000
```

---

---

## Opção 2 — Servidor Hostinger (VPS Ubuntu)

Deploy manual em VPS. Mais controle, requer configuração de servidor, Node.js, PostgreSQL, PM2 e Nginx.

### Pré-requisitos

- VPS Hostinger com Ubuntu 22.04 ou superior
- Acesso SSH ao servidor
- Domínio apontando para o IP do servidor (opcional, mas recomendado para HTTPS)

---

### Passo 1 — Conectar ao servidor via SSH

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

---

### Passo 2 — Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # deve exibir v20.x.x
npm -v
```

---

### Passo 3 — Instalar PostgreSQL

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### Criar banco e usuário

```bash
sudo -u postgres psql
```

Dentro do prompt do PostgreSQL:

```sql
CREATE DATABASE mci_db;
CREATE USER mci_user WITH ENCRYPTED PASSWORD 'SUA_SENHA_FORTE_AQUI';
GRANT ALL PRIVILEGES ON DATABASE mci_db TO mci_user;
\q
```

---

### Passo 4 — Instalar PM2 e Git

```bash
sudo npm install -g pm2
sudo apt install -y git
```

---

### Passo 5 — Clonar o repositório

```bash
cd /var/www
sudo git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git mci-api
cd mci-api
```

---

### Passo 6 — Criar o arquivo `.env`

```bash
sudo nano .env
```

Cole o conteúdo abaixo, preenchendo os valores:

```env
DATABASE_URL="postgresql://mci_user:SUA_SENHA_FORTE_AQUI@localhost:5432/mci_db?schema=public"
JWT_SECRET="string-secreta-longa-e-aleatoria-minimo-32-chars"
JWT_EXPIRATION="8h"
PORT=3000
```

Salve com `Ctrl+O`, `Enter`, `Ctrl+X`.

---

### Passo 7 — Instalar dependências e fazer o build

```bash
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
```

#### Rodar o seed (dados iniciais) — opcional

```bash
npx ts-node prisma/seed.ts
```

---

### Passo 8 — Iniciar a API com PM2

```bash
pm2 start dist/main.js --name mci-api
pm2 save
pm2 startup
```

> O comando `pm2 startup` exibe um comando para copiar e colar — execute-o para garantir que a API suba automaticamente após reinicialização do servidor.

#### Comandos úteis do PM2

```bash
pm2 status          # ver status dos processos
pm2 logs mci-api    # ver logs em tempo real
pm2 restart mci-api # reiniciar após deploy
pm2 stop mci-api    # parar
```

---

### Passo 9 — Configurar Nginx como proxy reverso

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/mci-api
```

Cole a configuração abaixo (substitua `seu-dominio.com` pelo seu domínio ou IP):

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/mci-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### Passo 10 — (Opcional mas recomendado) HTTPS com Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

O Certbot atualiza o Nginx automaticamente com HTTPS e renova o certificado sozinho.

---

### Passo 11 — Verificar

- **API:** `http://seu-dominio.com` (ou `https://` após o Certbot)
- **Swagger:** `http://seu-dominio.com/docs`
- **JSON Postman:** `http://seu-dominio.com/docs-json`

---

### Como fazer novos deploys (Hostinger)

A cada nova versão, conecte no servidor via SSH e execute:

```bash
cd /var/www/mci-api
git pull origin main
npm install
npm run build
npx prisma generate
npx prisma migrate deploy
pm2 restart mci-api
```

---

### Configurar firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Variáveis de ambiente — referência completa

| Variável | Obrigatória | Descrição | Exemplo |
|---|---|---|---|
| `DATABASE_URL` | Sim | String de conexão PostgreSQL | `postgresql://user:pass@host:5432/db?schema=public` |
| `JWT_SECRET` | Sim | Chave secreta para assinar tokens JWT | String aleatória longa |
| `JWT_EXPIRATION` | Sim | Tempo de expiração do token | `8h` |
| `PORT` | Não | Porta do servidor (padrão 3000) | `3000` |

Para gerar um `JWT_SECRET` seguro:

```bash
# Linux/Mac
openssl rand -base64 48

# Node.js (qualquer SO)
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

---

## Comparativo rápido

| | Railway | Hostinger VPS |
|---|---|---|
| **Configuração inicial** | ~10 minutos | ~45 minutos |
| **Custo** | ~$5/mês (plano Hobby) | A partir de R$30/mês |
| **Banco de dados** | Provisionado automaticamente | Configuração manual |
| **Deploy** | Automático via git push | Manual via SSH + comandos |
| **HTTPS** | Automático | Requer Certbot |
| **Escalabilidade** | Fácil (painel) | Manual |
| **Controle do servidor** | Nenhum | Total |
| **Ideal para** | Início rápido, MVPs | Projetos em produção com controle total |
