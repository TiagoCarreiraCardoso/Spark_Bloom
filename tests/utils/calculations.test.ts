import { calcularValorLiquido } from '@/lib/utils/calculations'
import { Decimal } from '@prisma/client/runtime/library'

describe('Cálculos', () => {
  describe('calcularValorLiquido', () => {
    it('deve calcular corretamente o valor líquido com retenção', () => {
      const valorTerapeuta = new Decimal('100.00')
      const retencaoIRS = new Decimal('11.00')

      const resultado = calcularValorLiquido(valorTerapeuta, retencaoIRS)

      expect(resultado.toNumber()).toBeCloseTo(89.0, 2)
    })

    it('deve retornar o valor completo quando retenção é zero', () => {
      const valorTerapeuta = new Decimal('100.00')
      const retencaoIRS = new Decimal('0.00')

      const resultado = calcularValorLiquido(valorTerapeuta, retencaoIRS)

      expect(resultado.toNumber()).toBe(100.0)
    })

    it('deve funcionar com números como input', () => {
      const resultado = calcularValorLiquido(100, 11)

      expect(resultado.toNumber()).toBeCloseTo(89.0, 2)
    })
  })
})
