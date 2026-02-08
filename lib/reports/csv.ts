import { Decimal } from '@prisma/client/runtime/library'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface SessaoReport {
  id: string
  dataSessao: Date
  utenteNome: string
  valorSessao: Decimal
  estadoPagamento: string
  numeroRecibo?: string | null
}

/**
 * Gera CSV com as sessões
 */
export function generateReportCSV(sessoes: SessaoReport[]): string {
  const headers = ['Data', 'Utente', 'Valor', 'Estado Pagamento', 'Nº Recibo']
  const rows = sessoes.map((s) => [
    format(s.dataSessao, 'dd/MM/yyyy HH:mm', { locale: pt }),
    s.utenteNome,
    s.valorSessao.toFixed(2),
    s.estadoPagamento,
    s.numeroRecibo || '',
  ])

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

  return csv
}
