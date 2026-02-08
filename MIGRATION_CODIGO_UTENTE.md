# Migration: Adicionar Código Numérico aos Utentes

## Passos para aplicar a migration:

### Fase 1: Adicionar campo nullable

1. **Parar o servidor Next.js** (se estiver rodando)

2. **Gerar a migration (campo nullable):**
   ```bash
   npm run db:migrate
   ```
   Quando pedir o nome da migration, digite: `add_codigo_to_utente_nullable`

3. **Atualizar utentes existentes com códigos:**
   Execute o script de migração:
   ```bash
   npm run db:migrate:codigo
   ```
   
   Este script atribuirá códigos sequenciais (1, 2, 3...) aos utentes existentes, ordenados por data de criação.

### Fase 2: Tornar campo obrigatório

4. **Atualizar o schema** - Remover o `?` do campo codigo no `prisma/schema.prisma`:
   ```prisma
   codigo                 Int                   @unique
   ```

5. **Gerar a migration (campo obrigatório):**
   ```bash
   npm run db:migrate
   ```
   Quando pedir o nome da migration, digite: `make_codigo_required`

6. **Regenerar o Prisma Client:**
   ```bash
   npm run db:generate
   ```

7. **Reiniciar o servidor:**
   ```bash
   npm run dev
   ```

## O que foi implementado:

- ✅ Campo `codigo` (Int, unique) adicionado ao modelo Utente
- ✅ Código gerado automaticamente ao criar novo utente (sequencial)
- ✅ Código exibido na lista de utentes
- ✅ Código exibido na página de detalhes do utente
- ✅ Busca por código numérico implementada
- ✅ Índice criado no campo código para performance

## Notas:

- O código é gerado automaticamente ao criar um novo utente
- O código é único e sequencial (1, 2, 3, ...)
- Utentes existentes precisam ter códigos atribuídos manualmente (veja SQL acima)
