# Migration: Simplificar Gestão de Sessões

## Mudança Realizada

Removido o campo `estadoRealizacao` do modelo `Sessao`. Agora as sessões usam apenas `estadoSessao` com três estados:

- **PENDENTE**: Sessão agendada no Outlook, aguardando confirmação
- **CONFIRMADA**: Sessão confirmada pela terapeuta (via Outlook/magic link)
- **REJEITADA**: Sessão rejeitada pela terapeuta (com motivo)

## Passos para Aplicar a Migration

1. **Parar o servidor Next.js** (se estiver rodando): `Ctrl + C`

2. **Gerar a migration:**
   ```bash
   npm run db:migrate
   ```
   Quando pedir o nome da migration, digite: `remove_estado_realizacao`

3. **Regenerar o Prisma Client:**
   ```bash
   npm run db:generate
   ```

4. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

## O que foi Atualizado

- ✅ Campo `estadoRealizacao` removido do schema Prisma
- ✅ Enum `EstadoRealizacao` removido
- ✅ Validação atualizada (removido `estadoRealizacao` do schema Zod)
- ✅ Página de edição de sessões simplificada
- ✅ Dashboard atualizado para usar `estadoSessao` ao invés de `estadoRealizacao`
- ✅ API de reports atualizada
- ✅ Webhooks de confirmação/rejeição atualizados
- ✅ Seed atualizado

## Fluxo Simplificado

1. **Agendamento**: Sessão criada no Outlook → sincronizada → estado: `PENDENTE`
2. **Confirmação**: Terapeuta confirma no Outlook → estado: `CONFIRMADA`
3. **Rejeição**: Terapeuta rejeita no Outlook (com motivo) → estado: `REJEITADA`

## Nota

O campo `estadoRealizacao` será removido do banco de dados durante a migration. Dados existentes neste campo serão perdidos, mas isso não afeta a funcionalidade, pois agora usamos apenas `estadoSessao`.
