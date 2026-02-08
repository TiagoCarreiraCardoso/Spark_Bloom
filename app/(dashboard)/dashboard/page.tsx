'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Paper,
  Grid,
  Text,
  Group,
  Button,
  Select,
  Stack,
  Card,
  Table,
} from '@mantine/core'
import { DatePickerInput, DateValue } from '@mantine/dates'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import { notifications } from '@mantine/notifications'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardData {
  totalSessoes: number
  valorTotal: string
  valorNaoRecebido: string
  sessoesSemRecibo: number
  sessoesPorMes: Record<string, number>
  sessoes: Array<{
    id: string
    dataSessao: string
    utenteNome: string
    valorSessao: string
    estadoPagamento: string
    numeroRecibo: string | null
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [utentes, setUtentes] = useState<Array<{ value: string; label: string }>>([])
  const [filters, setFilters] = useState({
    utenteId: '',
    estadoSessao: '',
    dataInicio: null as DateValue | null,
    dataFim: null as DateValue | null,
  })

  useEffect(() => {
    loadUtentes()
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [filters])

  const loadUtentes = async () => {
    try {
      const res = await fetch('/api/utentes')
      const data = await res.json()
      setUtentes(data.map((u: any) => ({ value: u.id, label: u.nome })))
    } catch (error) {
      console.error('Erro ao carregar utentes:', error)
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.utenteId) params.append('utenteId', filters.utenteId)
      if (filters.estadoSessao) params.append('estadoSessao', filters.estadoSessao)
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio.toISOString())
      if (filters.dataFim) params.append('dataFim', filters.dataFim.toISOString())

      const res = await fetch(`/api/reports/dashboard?${params}`)
      const dashboardData = await res.json()
      setData(dashboardData)
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar dashboard',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams()
      params.append('format', format)
      if (filters.utenteId) params.append('utenteId', filters.utenteId)
      if (filters.estadoSessao) params.append('estadoSessao', filters.estadoSessao)
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio.toISOString())
      if (filters.dataFim) params.append('dataFim', filters.dataFim.toISOString())

      const res = await fetch(`/api/reports/export?${params}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao exportar relatório',
        color: 'red',
      })
    }
  }

  const chartData = data?.sessoesPorMes
    ? Object.entries(data.sessoesPorMes).map(([mes, count]) => ({
        mes: format(new Date(mes + '-01'), 'MMM yyyy', { locale: pt }),
        sessoes: count,
      }))
    : []

  return (
    <Container size="xl" py="md">
      <Title mb="md">Dashboard</Title>

      <Paper p="md" mb="md" withBorder>
        <Stack>
          <Title order={4}>Filtros</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Utente"
                placeholder="Todos"
                data={utentes}
                value={filters.utenteId}
                onChange={(value) => setFilters({ ...filters, utenteId: value || '' })}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Select
                label="Estado Sessão"
                placeholder="Todos"
                data={[
                  { value: 'PENDENTE', label: 'Pendente' },
                  { value: 'CONFIRMADA', label: 'Confirmada' },
                  { value: 'REJEITADA', label: 'Rejeitada' },
                ]}
                value={filters.estadoSessao}
                onChange={(value) => setFilters({ ...filters, estadoSessao: value || '' })}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DatePickerInput
                label="Data Início"
                value={filters.dataInicio}
                onChange={(value) => setFilters({ ...filters, dataInicio: value })}
                clearable
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <DatePickerInput
                label="Data Fim"
                value={filters.dataFim}
                onChange={(value) => setFilters({ ...filters, dataFim: value })}
                clearable
              />
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

      {loading ? (
        <Text>Carregando...</Text>
      ) : data ? (
        <>
          <Grid mb="md">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">
                  Total de Sessões
                </Text>
                <Text size="xl" fw={700}>
                  {data.totalSessoes}
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">
                  Valor Total
                </Text>
                <Text size="xl" fw={700}>
                  {parseFloat(data.valorTotal).toFixed(2)} €
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">
                  Valor Não Recebido
                </Text>
                <Text size="xl" fw={700} c="red">
                  {parseFloat(data.valorNaoRecebido).toFixed(2)} €
                </Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">
                  Sessões sem Recibo
                </Text>
                <Text size="xl" fw={700} c="orange">
                  {data.sessoesSemRecibo}
                </Text>
              </Card>
            </Grid.Col>
          </Grid>

          {chartData.length > 0 && (
            <Paper p="md" mb="md" withBorder>
              <Title order={4} mb="md">
                Volume de Sessões por Mês
              </Title>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sessoes" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          )}

          <Paper p="md" mb="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Sessões</Title>
              <Group>
                <Button variant="outline" onClick={() => handleExport('csv')}>
                  Exportar CSV
                </Button>
                <Button variant="outline" onClick={() => handleExport('pdf')}>
                  Exportar PDF
                </Button>
                <Button>Gerar Resumo & Email</Button>
              </Group>
            </Group>

            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Data</Table.Th>
                  <Table.Th>Utente</Table.Th>
                  <Table.Th>Valor</Table.Th>
                  <Table.Th>Pagamento</Table.Th>
                  <Table.Th>Recibo</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.sessoes.map((sessao) => (
                  <Table.Tr key={sessao.id}>
                    <Table.Td>
                      {format(new Date(sessao.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}
                    </Table.Td>
                    <Table.Td>{sessao.utenteNome}</Table.Td>
                    <Table.Td>{parseFloat(sessao.valorSessao).toFixed(2)} €</Table.Td>
                    <Table.Td>{sessao.estadoPagamento}</Table.Td>
                    <Table.Td>{sessao.numeroRecibo || '-'}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </>
      ) : null}
    </Container>
  )
}
