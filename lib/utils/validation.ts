import { z } from 'zod'

export const utenteSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  dataNascimento: z.date(),
  telemovel: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  fotoUrl: z.string().optional(),
  nomePai: z.string().optional(),
  telemovelPai: z.string().optional(),
  emailPai: z.string().email('Email inválido').optional().or(z.literal('')),
  moradaPai: z.string().optional(),
  nomeMae: z.string().optional(),
  telemovelMae: z.string().optional(),
  emailMae: z.string().email('Email inválido').optional().or(z.literal('')),
  moradaMae: z.string().optional(),
  tipoEntidadeFaturacao: z.enum(['PROPRIO', 'CLINICA']),
  entidadeFaturacao: z.string().optional(),
  moradaEntidadeFaturacao: z.string().optional(),
  statusProcesso: z.enum(['ATIVO', 'INATIVO']),
  dataAberturaFicha: z.date(),
  notas: z.string().optional(),
})

export const condicaoComercialSchema = z.object({
  artigoId: z.string().optional().nullable(),
  precoCliente: z.number().positive('Preço deve ser positivo'),
  valorClinica: z.number().min(0, 'Valor deve ser positivo ou zero'),
  valorTerapeuta: z.number().min(0, 'Valor deve ser positivo ou zero'),
  retencaoIRS: z.number().min(0).max(100, 'Retenção deve estar entre 0 e 100'),
  necessitaRecibo: z.boolean(),
  inicioVigencia: z.date(),
  fimVigencia: z.date().nullable().optional(),
})

export const sessaoSchema = z.object({
  utenteId: z.string().min(1, 'Utente é obrigatório'),
  dataSessao: z.date(),
  estadoSessao: z.enum(['PENDENTE', 'CONFIRMADA', 'REJEITADA']).optional(),
  estadoPagamento: z.enum(['PAGO', 'NAO_PAGO']).optional(),
  dataPagamento: z.date().nullable().optional(),
  numeroRecibo: z.string().optional(),
  motivoRejeicao: z.string().optional(),
})

export const confirmacaoSessaoSchema = z.object({
  sessaoId: z.string(),
  acao: z.enum(['confirmar', 'rejeitar']),
  motivo: z.string().optional(),
})
