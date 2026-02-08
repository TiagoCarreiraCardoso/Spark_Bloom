import { Decimal } from '@prisma/client/runtime/library'

/**
 * Calcula o valor líquido baseado no valor do terapeuta e retenção IRS
 */
export function calcularValorLiquido(
  valorTerapeuta: number | Decimal,
  retencaoIRS: number | Decimal
): Decimal {
  const valor = typeof valorTerapeuta === 'number' ? valorTerapeuta : valorTerapeuta.toNumber()
  const retencao =
    typeof retencaoIRS === 'number' ? retencaoIRS : retencaoIRS.toNumber()

  const valorRetido = (valor * retencao) / 100
  const liquido = valor - valorRetido

  return new Decimal(liquido.toFixed(2))
}

/**
 * Calcula os valores da sessão baseado nas condições comerciais vigentes
 */
export function calcularValoresSessao(condicao: {
  precoCliente: Decimal
  valorClinica: Decimal
  valorTerapeuta: Decimal
  retencaoIRS: Decimal
  necessitaRecibo: boolean
}) {
  const valorLiquido = calcularValorLiquido(condicao.valorTerapeuta, condicao.retencaoIRS)

  return {
    valorSessao: condicao.precoCliente,
    valorClinica: condicao.valorClinica,
    valorTerapeuta: condicao.valorTerapeuta,
    retencaoIRS: condicao.retencaoIRS,
    valorLiquido,
    sujeitaRecibo: condicao.necessitaRecibo,
  }
}
