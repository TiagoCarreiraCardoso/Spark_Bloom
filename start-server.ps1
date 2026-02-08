# Script para iniciar o servidor Next.js
cd C:\Users\crist\Cursor\Spark_Bloom

# Parar processos Node existentes
Write-Host "Parando processos Node existentes..."
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Limpar cache do Next.js
if (Test-Path .next) {
    Write-Host "Removendo pasta .next..."
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "AVISO: Arquivo .env não encontrado!"
}

# Iniciar servidor
Write-Host "Iniciando servidor Next.js..."
Write-Host "Aguarde 15-20 segundos para compilar..."
npm run dev
