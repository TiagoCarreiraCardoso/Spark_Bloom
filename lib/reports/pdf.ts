import PDFDocument from 'pdfkit'
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

interface ReportData {
  periodo: { inicio: Date; fim: Date }
  totalSessoes: number
  valorTotal: Decimal
  valorNaoRecebido: Decimal
  sessoesSemRecibo: number
  sessoes: SessaoReport[]
}

/**
 * Gera um PDF com o resumo das sessões
 */
export async function generateReportPDF(data: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Cabeçalho
    doc.fontSize(20).text('Spark & Bloom - Relatório de Sessões', { align: 'center' })
    doc.moveDown()

    // Período
    doc.fontSize(12).text(
      `Período: ${format(data.periodo.inicio, 'dd/MM/yyyy', { locale: pt })} - ${format(
        data.periodo.fim,
        'dd/MM/yyyy',
        { locale: pt }
      )}`,
      { align: 'center' }
    )
    doc.moveDown(2)

    // KPIs
    doc.fontSize(14).text('Resumo', { underline: true })
    doc.moveDown(0.5)
    doc.fontSize(11).text(`Total de Sessões: ${data.totalSessoes}`)
    doc.text(`Valor Total: ${data.valorTotal.toFixed(2)} €`)
    doc.text(`Valor Não Recebido: ${data.valorNaoRecebido.toFixed(2)} €`)
    doc.text(`Sessões sem Recibo: ${data.sessoesSemRecibo}`)
    doc.moveDown(2)

    // Tabela de sessões
    if (data.sessoes.length > 0) {
      doc.fontSize(14).text('Detalhe das Sessões', { underline: true })
      doc.moveDown(0.5)

      let y = doc.y
      const rowHeight = 20
      const colWidths = [80, 120, 100, 80, 100]

      // Cabeçalho da tabela
      doc.fontSize(10).font('Helvetica-Bold')
      doc.text('Data', 50, y, { width: colWidths[0] })
      doc.text('Utente', 50 + colWidths[0], y, { width: colWidths[1] })
      doc.text('Valor', 50 + colWidths[0] + colWidths[1], y, { width: colWidths[2] })
      doc.text('Pagamento', 50 + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] })
      doc.text('Recibo', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, {
        width: colWidths[4],
      })

      y += rowHeight
      doc.font('Helvetica')

      // Linhas da tabela
      for (const sessao of data.sessoes) {
        if (y > 700) {
          doc.addPage()
          y = 50
        }

        doc.fontSize(9).text(format(sessao.dataSessao, 'dd/MM/yyyy HH:mm', { locale: pt }), 50, y, {
          width: colWidths[0],
        })
        doc.text(sessao.utenteNome, 50 + colWidths[0], y, { width: colWidths[1] })
        doc.text(`${sessao.valorSessao.toFixed(2)} €`, 50 + colWidths[0] + colWidths[1], y, {
          width: colWidths[2],
        })
        doc.text(sessao.estadoPagamento, 50 + colWidths[0] + colWidths[1] + colWidths[2], y, {
          width: colWidths[3],
        })
        doc.text(sessao.numeroRecibo || '-', 50 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, {
          width: colWidths[4],
        })

        y += rowHeight
      }
    }

    doc.end()
  })
}
