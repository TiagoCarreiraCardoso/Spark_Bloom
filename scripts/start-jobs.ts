import { startAllJobs } from './cron-jobs'

// Iniciar jobs quando o script é executado
startAllJobs()

// Manter o processo vivo
console.log('Jobs iniciados. Pressione Ctrl+C para parar.')
process.on('SIGINT', () => {
  console.log('\nParando jobs...')
  process.exit(0)
})
