import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando seed...')

  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@sparkbloom.com' },
    update: {},
    create: {
      email: 'admin@sparkbloom.com',
      name: 'Administrador',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log('Usuário admin criado:', admin.email)

  // Criar artigos de exemplo
  const artigo1 = await prisma.artigo.upsert({
    where: { codigo: 'STF001' },
    update: {},
    create: {
      codigo: 'STF001',
      nome: 'Sessão de Terapia da Fala',
      ativo: true,
    },
  })

  const artigo2 = await prisma.artigo.upsert({
    where: { codigo: 'AV001' },
    update: {},
    create: {
      codigo: 'AV001',
      nome: 'Avaliação Inicial',
      ativo: true,
    },
  })

  console.log('Artigos criados:', artigo1.codigo, artigo2.codigo)

  // Criar utente de exemplo
  const utente = await prisma.utente.create({
    data: {
      codigo: 1,
      nome: 'João Silva',
      dataNascimento: new Date('2015-05-15'),
      telemovel: '912345678',
      email: 'joao.silva@example.com',
      nomePai: 'Carlos Silva',
      telemovelPai: '912345679',
      emailPai: 'carlos.silva@example.com',
      moradaPai: 'Rua Exemplo, 123, Lisboa',
      nomeMae: 'Maria Silva',
      telemovelMae: '912345680',
      emailMae: 'maria.silva@example.com',
      moradaMae: 'Rua Exemplo, 123, Lisboa',
      tipoEntidadeFaturacao: 'PROPRIO',
      statusProcesso: 'ATIVO',
      dataAberturaFicha: new Date(),
    },
  })

  console.log('Utente criado:', utente.nome)

  // Criar condição comercial
  const condicao = await prisma.condicaoComercial.create({
    data: {
      utenteId: utente.id,
      artigoId: artigo1.id,
      precoCliente: new Decimal('50.00'),
      valorClinica: new Decimal('20.00'),
      valorTerapeuta: new Decimal('30.00'),
      retencaoIRS: new Decimal('11.00'),
      valorLiquido: new Decimal('26.70'), // 30 - (30 * 0.11)
      necessitaRecibo: true,
      inicioVigencia: new Date(),
    },
  })

  console.log('Condição comercial criada:', condicao.id)

  // Criar algumas sessões de exemplo
  const hoje = new Date()
  const sessoes = await Promise.all([
    prisma.sessao.create({
      data: {
        utenteId: utente.id,
        dataSessao: new Date(hoje.getTime() + 1 * 24 * 60 * 60 * 1000), // Amanhã
        estadoSessao: 'PENDENTE',
        valorSessao: condicao.precoCliente,
        valorTerapeuta: condicao.valorTerapeuta,
        retencaoIRS: condicao.retencaoIRS,
        valorLiquido: condicao.valorLiquido,
        sujeitaRecibo: condicao.necessitaRecibo,
      },
    }),
    prisma.sessao.create({
      data: {
        utenteId: utente.id,
        dataSessao: new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
        estadoSessao: 'CONFIRMADA',
        estadoPagamento: 'PAGO',
        dataPagamento: new Date(hoje.getTime() - 6 * 24 * 60 * 60 * 1000),
        numeroRecibo: 'REC-001',
        valorSessao: condicao.precoCliente,
        valorTerapeuta: condicao.valorTerapeuta,
        retencaoIRS: condicao.retencaoIRS,
        valorLiquido: condicao.valorLiquido,
        sujeitaRecibo: condicao.necessitaRecibo,
      },
    }),
  ])

  console.log(`${sessoes.length} sessões criadas`)

  console.log('Seed concluído!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
