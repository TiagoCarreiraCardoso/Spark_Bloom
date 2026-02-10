const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

let mainWindow;
let serverProcess = null;
const PORT = 3000;

// Verifica se a porta está em uso
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // Porta em uso
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // Porta disponível
    });
    
    server.listen(port);
  });
}

// Cria a janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicia o servidor Next.js
async function startServer() {
  const portAvailable = await checkPort(PORT);
  
  if (!portAvailable) {
    if (mainWindow) {
      mainWindow.webContents.send('log-message', {
        type: 'error',
        message: `Porta ${PORT} já está em uso. Feche a aplicação que está a usar esta porta e tente novamente.`
      });
      mainWindow.webContents.send('server-status', { status: 'error' });
    }
    return;
  }

  if (mainWindow) {
    mainWindow.webContents.send('server-status', { status: 'starting' });
    mainWindow.webContents.send('log-message', {
      type: 'info',
      message: 'A iniciar servidor Next.js...'
    });
  }

  // Determina o diretório da aplicação
  // appPath é sempre controlado pelo Electron, não por input do utilizador
  const appPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..');

  // Inicia o servidor
  // shell: true é necessário para npm no Windows, mas seguro porque
  // appPath é controlado internamente pelo Electron
  serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: appPath,
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  // Processa output do servidor
  serverProcess.stdout.on('data', (data) => {
    const message = data.toString();
    if (mainWindow) {
      mainWindow.webContents.send('log-message', {
        type: 'info',
        message: message.trim()
      });
    }

    // Detecta quando o servidor está pronto
    if (message.includes('Local:') || message.includes('localhost:3000') || message.includes('ready')) {
      if (mainWindow) {
        mainWindow.webContents.send('server-status', { status: 'ready' });
        mainWindow.webContents.send('log-message', {
          type: 'success',
          message: `✓ Servidor pronto em http://localhost:${PORT}`
        });
      }
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const message = data.toString();
    if (mainWindow) {
      mainWindow.webContents.send('log-message', {
        type: 'error',
        message: message.trim()
      });
    }
  });

  serverProcess.on('close', (code) => {
    if (mainWindow) {
      mainWindow.webContents.send('server-status', { status: 'stopped' });
      mainWindow.webContents.send('log-message', {
        type: 'info',
        message: `Servidor parou com código ${code}`
      });
    }
    serverProcess = null;
  });

  serverProcess.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('server-status', { status: 'error' });
      mainWindow.webContents.send('log-message', {
        type: 'error',
        message: `Erro ao iniciar servidor: ${err.message}`
      });
    }
  });
}

// Para o servidor
function stopServer() {
  if (serverProcess) {
    if (mainWindow) {
      mainWindow.webContents.send('log-message', {
        type: 'info',
        message: 'A parar servidor...'
      });
    }
    
    // No Windows, usa taskkill para terminar o processo e subprocessos
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', serverProcess.pid, '/f', '/t']);
    } else {
      serverProcess.kill();
    }
    
    serverProcess = null;
  }
}

// Handlers IPC
ipcMain.handle('start-server', async () => {
  await startServer();
});

ipcMain.handle('stop-server', () => {
  stopServer();
});

ipcMain.handle('restart-server', async () => {
  stopServer();
  // Aguarda um momento antes de reiniciar
  setTimeout(async () => {
    await startServer();
  }, 2000);
});

ipcMain.handle('open-browser', () => {
  shell.openExternal(`http://localhost:${PORT}`);
});

// Evento quando o app está pronto
app.whenReady().then(() => {
  createWindow();
  
  // Inicia o servidor automaticamente
  setTimeout(() => {
    startServer();
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Evento quando todas as janelas são fechadas
app.on('window-all-closed', () => {
  stopServer();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Evento antes de sair
app.on('before-quit', () => {
  stopServer();
});
