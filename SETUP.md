# Guia de Setup - Spark & Bloom

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ instalado e rodando
- Conta Microsoft Azure (para integração Outlook/Graph)

## Passo a Passo

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure:

```bash
cp .env.example .env
```

Edite o `.env` com suas configurações:

- **DATABASE_URL**: URL de conexão do PostgreSQL
- **NEXTAUTH_SECRET**: Gere um secret aleatório (ex: `openssl rand -base64 32`)
- **JWT_SECRET**: Gere outro secret para JWT
- **Azure**: Configure as credenciais do Azure AD
- **SMTP**: Configure as credenciais do servidor de email

### 3. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular dados iniciais (opcional)
npm run db:seed
```

**Nota**: O seed cria um usuário admin:
- Email: `admin@sparkbloom.com`
- Senha: `admin123`

### 4. Configurar Microsoft Graph API

1. Acesse o [Azure Portal](https://portal.azure.com)
2. Registre uma nova aplicação
3. Configure as permissões:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `Mail.Send`
4. Crie um Client Secret
5. Adicione as credenciais no `.env`:
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AZURE_TENANT_ID`

### 5. Configurar Calendários

Adicione os IDs dos calendários a sincronizar no `.env`:

```
OUTLOOK_CALENDAR_IDS=email1@domain.com,email2@domain.com
```

### 6. Iniciar Aplicação

```bash
# Desenvolvimento
npm run dev

# Em outro terminal, iniciar jobs de cron (opcional)
npm run start:jobs
```

### 7. Acessar Aplicação

Abra [http://localhost:3000](http://localhost:3000) e faça login com as credenciais do seed.

## Estratégias de Matching de Eventos

O sistema suporta 4 estratégias para associar eventos do Outlook a utentes:

1. **Subject (Assunto)**: Evento com assunto `UTENTE:12345` será associado ao utente com ID `12345`
2. **Attendee (Participante)**: Evento com email do utente/pai/mãe como participante
3. **Category (Categoria)**: Evento com categoria `Utente:12345`
4. **Extension (Extensão)**: Evento com propriedade personalizada `patientId`

Configure a estratégia na chamada da API de sincronização ou no job de cron.

## Estrutura de Pastas

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas públicas de autenticação
│   ├── (dashboard)/       # Rotas protegidas do dashboard
│   ├── (public)/          # Rotas públicas (magic links)
│   └── api/               # API Routes
├── components/            # Componentes React
├── lib/                   # Bibliotecas e utilitários
│   ├── graph/            # Integração Microsoft Graph
│   ├── email/            # Serviço de email
│   └── reports/         # Geração de relatórios
├── prisma/               # Schema e migrations
├── scripts/              # Scripts auxiliares
└── tests/                # Testes
```

## Troubleshooting

### Erro de conexão com banco de dados

Verifique se o PostgreSQL está rodando e se a `DATABASE_URL` está correta.

### Erro ao sincronizar calendários

- Verifique as credenciais do Azure no `.env`
- Confirme que as permissões foram concedidas no Azure Portal
- Verifique se os IDs dos calendários estão corretos

### Magic links não funcionam

- Verifique se `JWT_SECRET` está configurado
- Confirme que `NEXTAUTH_URL` está correto

## Próximos Passos

- [ ] Implementar webhooks do Microsoft Graph (change notifications)
- [ ] Adicionar mais testes e2e
- [ ] Implementar cache para melhor performance
- [ ] Adicionar mais relatórios e gráficos
- [ ] Implementar notificações em tempo real
