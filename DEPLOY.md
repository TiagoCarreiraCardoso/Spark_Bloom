# Deploy em Produção – Spark & Bloom

## 1. Base de dados PostgreSQL

Em produção **não uses** o Postgres do `docker-compose` (é só para desenvolvimento). Usa um serviço gerido:

| Serviço | Site | Notas |
|---------|------|-------|
| **Supabase** | supabase.com | Plano free com Postgres |
| **Neon** | neon.tech | Serverless Postgres, free tier |
| **Railway** | railway.app | Postgres + deploy da app |
| **Vercel Postgres** | vercel.com | Se fizeres deploy na Vercel |
| **AWS RDS** / **Azure DB** | — | Para infra própria |

Cria a base de dados e copia a **connection string** para a variável `DATABASE_URL`.

---

## 2. Variáveis de ambiente (obrigatórias)

Cria um `.env` de produção (ou configura no painel da plataforma) com:

| Variável | Produção | Exemplo |
|----------|----------|---------|
| `DATABASE_URL` | URL do Postgres de produção | `postgresql://user:pass@host:5432/spark_bloom?schema=public` |
| `NEXTAUTH_URL` | URL pública da app | `https://sparkbloom.pt` |
| `NEXTAUTH_SECRET` | Novo secret, só para produção | `openssl rand -base64 32` |
| `JWT_SECRET` | Novo secret, só para produção | `openssl rand -base64 32` |

**Importante:** Gera **novos** `NEXTAUTH_SECRET` e `JWT_SECRET` para produção. Não reutilizes os de desenvolvimento.

---

## 3. Variáveis opcionais (emails, Outlook)

| Variável | Uso |
|----------|-----|
| `SMTP_*` | Envio de emails (magic links, notificações) |
| `AZURE_*`, `OUTLOOK_CALENDAR_IDS` | Sincronização com calendário Outlook |

Se não configurares, a app corre; emails e Outlook ficam inativos.

---

## 4. Migrations na base de produção

Antes do primeiro deploy (e após cada alteração ao `prisma/schema`):

```bash
# Em vez de db:migrate (só para dev)
npm run db:migrate:deploy
```

Em muitas plataformas fazes isto num **step de release** ou **post-deploy**, com `DATABASE_URL` de produção.

---

## 5. Seed e primeiro utilizador

- O **seed** (`npm run db:seed`) cria `admin@sparkbloom.com` / `admin123`.
- Em produção:
  1. Corre o seed **uma vez** (ou cria o admin à mão na BD), e  
  2. **Altera a password** logo a seguir:

```bash
npm run db:reset-password admin@sparkbloom.com NovaPasswordSegura
```

Ou usa a UI (quando existir “alterar password”) ou Prisma Studio.

---

## 6. Onde fazer deploy da app

### A) Vercel

- Repo no GitHub → **Import** no Vercel.
- Variáveis: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `JWT_SECRET` (e opcionais).
- **Build:** `npm run build`
- **Release:** no step de build ou no painel, corre `npx prisma generate` (a Vercel costuma fazê-lo). Para migrations: configura um **Deploy Hook** ou corre manualmente `npm run db:migrate:deploy` com `DATABASE_URL` de produção.

### B) Docker (VPS, Railway, etc.)

Build e run:

```bash
docker build -t spark-bloom .
docker run -p 3000:3000 --env-file .env.production spark-bloom
```

Ou usa `docker-compose` com um ficheiro de produção em que:
- `DATABASE_URL` aponta para o Postgres de produção (externo ou outro container).

---

## 7. Checklist antes de ir para produção

- [ ] Postgres de produção criado e `DATABASE_URL` configurada
- [ ] `NEXTAUTH_URL` = URL real (ex: `https://sparkbloom.pt`)
- [ ] `NEXTAUTH_SECRET` e `JWT_SECRET` novos, só para produção
- [ ] `npm run db:migrate:deploy` executado na BD de produção
- [ ] Seed executado (se for a primeira vez) e **password do admin alterada**
- [ ] HTTPS ativo (a maior parte das plataformas faz isto automaticamente)

---

## 8. `next.config.js` e imagens

Se usares `next/image` com domínios externos em produção, adiciona-os em `images.domains` em `next.config.js`:

```js
images: {
  domains: ['localhost', 'cdn.seudominio.pt'],
},
```

---

## 9. Cron / jobs em background

O `npm run start:jobs` (sincronização Outlook, etc.) **não corre** em plataformas só “request/response” (ex: Vercel).

Para ter jobs em produção precisas de:

- Um **worker** separado (Railway, Render, VPS) a correr `npm run start:jobs`, ou  
- Um serviço de **cron** externo que chame a API (ex: `/api/cron`) com um secret.

Configura `CRON_SECRET` ou equivalente se a rota de cron exigir autenticação.
