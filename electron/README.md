# Spark & Bloom - Aplicação Desktop Electron

Esta aplicação Desktop permite aos utilizadores do Windows aceder rapidamente ao sistema Spark & Bloom através de um ícone no desktop, automatizando todos os passos de inicialização do servidor.

## 🚀 Como Usar

### Desenvolvimento

Para executar a aplicação em modo de desenvolvimento:

```bash
npm run electron:dev
```

A aplicação irá:
1. Abrir uma janela de controlo
2. Iniciar automaticamente o servidor Next.js
3. Mostrar logs em tempo real
4. Permitir abrir o navegador quando o servidor estiver pronto

### Construir Executável para Windows

Para criar um executável Windows (.exe):

```bash
npm run electron:build
```

O executável será criado na pasta `dist/` e pode ser distribuído para outros utilizadores.

## 📋 Funcionalidades

### Controlo do Servidor
- **Iniciar**: Inicia o servidor Next.js automaticamente
- **Parar**: Para o servidor em execução
- **Reiniciar**: Reinicia o servidor
- **Abrir Navegador**: Abre o navegador na aplicação quando o servidor está pronto

### Indicadores de Estado
- 🔴 **Parado**: Servidor não está em execução
- 🟡 **A Iniciar**: Servidor está a iniciar
- 🟢 **Online**: Servidor pronto e a funcionar
- 🔴 **Erro**: Ocorreu um erro

### Logs em Tempo Real
A aplicação mostra todos os logs do servidor Next.js em tempo real, incluindo:
- Mensagens de inicialização
- Avisos e erros
- Estado de compilação
- Informações de ready state

## 🔧 Funcionalidades Técnicas

### Deteção de Porta Ocupada
Se a porta 3000 já estiver em uso, a aplicação irá notificar o utilizador e sugerir que feche a aplicação que está a usar essa porta.

### Gestão Automática
- O servidor inicia automaticamente quando a aplicação abre
- O servidor para automaticamente quando a aplicação fecha
- Logs são limitados a 100 entradas para evitar sobrecarga de memória

### Segurança
A aplicação usa `contextIsolation` e `preload.js` para garantir segurança entre o processo principal e a interface de utilizador.

## 📁 Estrutura de Ficheiros

```
electron/
├── main.js           # Processo principal Electron
├── preload.js        # Bridge de segurança para IPC
├── ui/
│   ├── index.html    # Interface de controlo
│   └── styles.css    # Estilos da interface
└── assets/
    └── icon.png      # Ícone da aplicação
```

## 🐛 Resolução de Problemas

### Porta 3000 já em uso
- Feche qualquer outra instância do servidor Next.js
- Verifique se não há outra aplicação a usar a porta 3000

### Servidor não inicia
- Certifique-se de que todas as dependências estão instaladas: `npm install`
- Verifique se o Node.js está instalado corretamente
- Consulte os logs na aplicação para mais detalhes

### Erro ao construir executável
- Certifique-se de que tem `electron-builder` instalado
- Execute `npm install` para garantir que todas as dependências estão presentes

## 📝 Notas para Programadores

### Modificar a Interface
Edite `electron/ui/index.html` e `electron/ui/styles.css` para alterar a aparência da aplicação.

### Alterar Comportamento do Servidor
Edite `electron/main.js` para modificar como o servidor é iniciado, parado ou gerido.

### Personalizar Configuração de Build
Edite a secção `build` no `package.json` para alterar configurações do electron-builder.

## 📦 Dependências

- `electron`: Framework para aplicações desktop
- `electron-builder`: Ferramenta para criar executáveis

## 🔄 Integração com o Projeto

A aplicação Electron integra-se perfeitamente com o projeto Next.js existente:
- Usa o mesmo `npm run dev` para iniciar o servidor
- Não requer alterações ao código Next.js
- Mantém compatibilidade total com o desenvolvimento normal
