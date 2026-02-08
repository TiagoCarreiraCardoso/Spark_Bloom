/**
 * Repõe a password do utilizador admin para "admin123".
 * Use se tiver perdido ou alterado a password.
 *
 * Uso: npx tsx scripts/reset-admin-password.ts
 *      npx tsx scripts/reset-admin-password.ts novo@email.com minhanovapassword
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'admin@sparkbloom.com'
  const newPassword = process.argv[3] || 'admin123'

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.error(`✗ Utilizador com email "${email}" não encontrado.`)
    console.log('  Execute primeiro: npm run db:seed')
    process.exit(1)
  }

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({
    where: { email },
    data: { password: hashed },
  })

  console.log(`✓ Password do utilizador ${email} foi reposta com sucesso.`)
  console.log(`  Email: ${email}`)
  console.log(`  Nova password: ${newPassword}`)
}

main()
  .catch((e) => {
    console.error('Erro:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
