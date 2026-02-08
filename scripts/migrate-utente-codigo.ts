/**
 * Script para atribuir códigos sequenciais aos utentes existentes
 * Execute após criar a migration do campo codigo
 * 
 * Uso: tsx scripts/migrate-utente-codigo.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando migração de códigos de utentes...')

  // Buscar todos os utentes ordenados por data de criação
  const utentes = await prisma.utente.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, codigo: true },
  })

  console.log(`Encontrados ${utentes.length} utentes`)

  // Atribuir códigos sequenciais
  for (let i = 0; i < utentes.length; i++) {
    const codigo = i + 1
    
    // Verificar se já tem código
    if (utentes[i].codigo) {
      console.log(`Utente ${utentes[i].id} já tem código ${utentes[i].codigo}, pulando...`)
      continue
    }

    try {
      await prisma.utente.update({
        where: { id: utentes[i].id },
        data: { codigo },
      })
      console.log(`✓ Atribuído código ${codigo} ao utente ${utentes[i].id}`)
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Código já existe, tentar próximo
        console.log(`⚠ Código ${codigo} já existe, tentando próximo...`)
        // Buscar próximo código disponível
        const ultimoCodigo = await prisma.utente.findFirst({
          orderBy: { codigo: 'desc' },
          select: { codigo: true },
        })
        const proximoCodigo = ultimoCodigo ? ultimoCodigo.codigo + 1 : codigo
        
        await prisma.utente.update({
          where: { id: utentes[i].id },
          data: { codigo: proximoCodigo },
        })
        console.log(`✓ Atribuído código ${proximoCodigo} ao utente ${utentes[i].id}`)
      } else {
        console.error(`✗ Erro ao atualizar utente ${utentes[i].id}:`, error.message)
      }
    }
  }

  console.log('Migração concluída!')
}

main()
  .catch((error) => {
    console.error('Erro na migração:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
