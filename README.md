# Spark & Bloom - Sistema de Gestão de Sessões e Faturação

Sistema interno para gestão de sessões de Terapia da Fala, sincronização com Outlook/Calendar, e faturação.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ e npm/yarn
- PostgreSQL 14+
- Docker e Docker Compose (opcional)

### Instalação

1. Clone o repositório e instale dependências:

```bash
npm install
```

2. Configure as variáveis de ambiente:

```bash
cp .env.example .env
# Edite .env com suas configurações
```

3. Configure o banco de dados:

```bash
# Gerar Prisma Client
npm run db:generate

# Executar migrations
npm run db:migrate

# Popular dados iniciais (opcional)
npm run db:seed
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000)

### Com Aplicação Desktop (Windows)

Para utilizadores do Windows, está disponível uma aplicação Desktop Electron que automatiza todo o processo de inicialização:

```bash
# Modo desenvolvimento
npm run electron:dev

# Criar executável Windows
npm run electron:build
```

A aplicação Desktop oferece:
- Inicialização automática do servidor
- Painel de controlo visual com estado do servidor
- Logs em tempo real
- Botões para iniciar/parar/reiniciar o servidor
- Abertura automática do navegador

Para mais detalhes, consulte [electron/README.md](electron/README.md)

### Com Docker

```bash
docker-compose up -d
```

## 📁 Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Rotas protegidas
│   │   ├── utentes/       # Gestão de utentes
│   │   ├── sessoes/       # Gestão de sessões
│   │   └── dashboard/     # Dashboard e relatórios
│   └── api/               # API Routes
│       ├── utentes/       # CRUD utentes
│       ├── sessoes/       # CRUD sessões
│       ├── graph/         # Integração Microsoft Graph
│       └── webhooks/      # Magic links confirmação
├── components/            # Componentes React reutilizáveis
├── lib/                   # Bibliotecas e utilitários
│   ├── prisma.ts         # Cliente Prisma
│   ├── auth.ts           # Autenticação
│   ├── graph/            # Microsoft Graph
│   ├── email.ts          # Serviço de email
│   └── utils/            # Utilitários
├── prisma/               # Schema e migrations Prisma
├── scripts/              # Scripts auxiliares
└── tests/                # Testes
```

## 🔐 Autenticação

O sistema usa NextAuth.js com suporte a:
- Login por email/senha
- Integração Microsoft Entra ID (futuro)

**Roles disponíveis:**
- `ADMIN`: Acesso total
- `TERAPEUTA`: Pode confirmar/rejeitar sessões
- `FINANCEIRO`: Acesso a relatórios e faturação

## 📊 Funcionalidades Principais

### 1. Gestão de Utentes
- CRUD completo de utentes
- Gestão de condições comerciais com histórico
- Ficha completa do utente

### 2. Gestão de Sessões
- Sincronização automática com Outlook Calendar
- Confirmação/rejeição via magic links
- Gestão de pagamentos e recibos

### 3. Dashboard e Relatórios
- Filtros dinâmicos (período, utente, estado)
- KPIs: volume, valores, pendências
- Exportação CSV e PDF
- Geração de emails com resumos

## 🔄 Integração Microsoft Graph

### Configuração

1. Registre uma aplicação no [Azure Portal](https://portal.azure.com)
2. Configure permissões:
   - `Calendars.Read`
   - `Calendars.ReadWrite`
   - `Mail.Send`
3. Adicione as credenciais no `.env`

### Sincronização

A sincronização ocorre automaticamente a cada 5 minutos via cron job. Estratégias de matching:

1. **Código no assunto**: `UTENTE:12345`
2. **Participante/email**: email do utente como participante
3. **Categoria/Label**: `Utente:12345`
4. **Propriedade personalizada**: extensão com `patientId`

## 🧪 Testes

```bash
# Testes unitários
npm test

# Testes e2e
npm run test:e2e

# Watch mode
npm run test:watch
```

## 📝 Scripts Disponíveis

### Desenvolvimento e Produção
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção

### Base de Dados
- `npm run db:migrate` - Executar migrations
- `npm run db:seed` - Popular banco de dados
- `npm run db:studio` - Abrir Prisma Studio

### Qualidade de Código
- `npm run lint` - Verificar código
- `npm run format` - Formatar código
- `npm run test` - Executar testes

### Aplicação Desktop
- `npm run electron:dev` - Executar aplicação Electron em modo desenvolvimento
- `npm run electron:build` - Criar executável Windows

## 🔒 Segurança

- Autenticação obrigatória em todas as rotas protegidas
- RBAC (Role-Based Access Control)
- Validação de inputs com Zod
- Magic links com JWT assinado e expiração
- Logs de auditoria para operações críticas
- Sanitização de uploads

## 📄 Licença

Proprietário - Spark & Bloom
