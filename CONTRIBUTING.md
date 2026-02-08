# Guia de Contribuição

## Desenvolvimento

### Estrutura do Código

- **Backend**: API Routes em `app/api/`
- **Frontend**: Páginas em `app/(dashboard)/` e componentes em `components/`
- **Lógica de Negócio**: Funções utilitárias em `lib/`
- **Banco de Dados**: Schema Prisma em `prisma/schema.prisma`

### Convenções

- Use TypeScript para todo o código
- Siga os padrões do ESLint configurado
- Use componentes do Mantine UI
- Valide inputs com Zod
- Adicione logs de auditoria para operações críticas

### Testes

Execute os testes antes de fazer commit:

```bash
npm test
```

Adicione testes para novas funcionalidades.

### Commits

Use mensagens de commit descritivas:

```
feat: adiciona exportação de relatórios em PDF
fix: corrige cálculo de valor líquido
docs: atualiza documentação de setup
```

## Pull Requests

1. Crie uma branch a partir de `main`
2. Faça suas alterações
3. Execute testes e lint
4. Crie um PR com descrição clara das mudanças
