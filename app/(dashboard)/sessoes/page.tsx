'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Table,
  Group,
  Select,
  Badge,
  ActionIcon,
  Button,
  Modal,
  Stack,
  Text,
  TextInput,
  Grid,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { IconEdit } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

interface Sessao {
  id: string
  dataSessao: string
  estadoSessao: string
  estadoPagamento: string
  valorSessao: string
  sujeitaRecibo: boolean
  numeroRecibo: string | null
  utente: {
    id: string
    codigo: number
    nome: string
  }
}

interface UtenteOption {
  value: string
  label: string
}

export default function SessoesPage() {
  const router = useRouter()
  const [sessoes, setSessoes] = useState<Sessao[]>([])
  const [loading, setLoading] = useState(true)
  const [utentes, setUtentes] = useState<UtenteOption[]>([])
  const [filters, setFilters] = useState({
    utenteId: '',
    estadoSessao: '',
    estadoPagamento: '',
    statusRecibo: '',
    dataInicio: null as Date | null,
    dataFim: null as Date | null,
  })
  const [modalAberto, setModalAberto] = useState(false)
  const [sessaoParaPagar, setSessaoParaPagar] = useState<Sessao | null>(null)
  const [dataPagamento, setDataPagamento] = useState<Date | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [modalReciboAberto, setModalReciboAberto] = useState(false)
  const [sessaoParaRecibo, setSessaoParaRecibo] = useState<Sessao | null>(null)
  const [numeroRecibo, setNumeroRecibo] = useState('')
  const [salvandoRecibo, setSalvandoRecibo] = useState(false)

  useEffect(() => {
    loadUtentes()
  }, [])

  useEffect(() => {
    loadSessoes()
  }, [filters])

  const loadUtentes = async () => {
    try {
      const res = await fetch('/api/utentes?status=ATIVO')
      const data = await res.json()
      const utentesOptions = data.map((u: any) => ({
        value: u.id,
        label: `[${u.codigo}] ${u.nome}`,
      }))
      setUtentes(utentesOptions)
    } catch (error) {
      console.error('Erro ao carregar utentes:', error)
    }
  }

  const loadSessoes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.utenteId) params.append('utenteId', filters.utenteId)
      if (filters.estadoSessao) params.append('estadoSessao', filters.estadoSessao)
      if (filters.estadoPagamento) params.append('estadoPagamento', filters.estadoPagamento)
      if (filters.statusRecibo) params.append('statusRecibo', filters.statusRecibo)
      if (filters.dataInicio) params.append('dataInicio', filters.dataInicio.toISOString())
      if (filters.dataFim) params.append('dataFim', filters.dataFim.toISOString())

      const res = await fetch(`/api/sessoes?${params}`)
      const data = await res.json()
      setSessoes(data)
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar sessões',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAbrirModalPagamento = (sessao: Sessao) => {
    setSessaoParaPagar(sessao)
    setDataPagamento(new Date()) // Data padrão: hoje
    setModalAberto(true)
  }

  const handleSalvarPagamento = async () => {
    if (!sessaoParaPagar || !dataPagamento) {
      notifications.show({
        title: 'Erro',
        message: 'Data de pagamento é obrigatória',
        color: 'red',
      })
      return
    }

    setSalvando(true)
    try {
      const res = await fetch(`/api/sessoes/${sessaoParaPagar.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estadoPagamento: 'PAGO',
          dataPagamento: dataPagamento.toISOString(),
        }),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Pagamento registrado com sucesso',
          color: 'green',
        })
        setModalAberto(false)
        setSessaoParaPagar(null)
        setDataPagamento(null)
        loadSessoes() // Recarregar lista
      } else {
        const error = await res.json()
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao registrar pagamento',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao registrar pagamento',
        color: 'red',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleAbrirModalRecibo = (sessao: Sessao) => {
    setSessaoParaRecibo(sessao)
    setNumeroRecibo(sessao.numeroRecibo || '')
    setModalReciboAberto(true)
  }

  const handleSalvarRecibo = async () => {
    if (!sessaoParaRecibo || !numeroRecibo.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Número do recibo é obrigatório',
        color: 'red',
      })
      return
    }

    setSalvandoRecibo(true)
    try {
      const res = await fetch(`/api/sessoes/${sessaoParaRecibo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroRecibo: numeroRecibo.trim(),
        }),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Número do recibo registrado com sucesso',
          color: 'green',
        })
        setModalReciboAberto(false)
        setSessaoParaRecibo(null)
        setNumeroRecibo('')
        loadSessoes() // Recarregar lista
      } else {
        const error = await res.json()
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao registrar número do recibo',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao registrar número do recibo',
        color: 'red',
      })
    } finally {
      setSalvandoRecibo(false)
    }
  }

  const getEstadoRecibo = (sessao: Sessao) => {
    // Se não sujeita a recibo, não mostrar status editável
    if (!sessao.sujeitaRecibo) {
      return <Badge color="gray">N/A</Badge>
    }

    // Se tem número de recibo, status é "Criado" e mostra o número
    if (sessao.numeroRecibo) {
      return (
        <Badge color="green">
          Criado: {sessao.numeroRecibo}
        </Badge>
      )
    }

    // Se não tem número de recibo e está pago, status é "Em Falta" e é clicável
    // Se não está pago, mostrar "Aguardando Pagamento"
    if (sessao.estadoPagamento === 'PAGO') {
      return (
        <Badge
          color="red"
          style={{ cursor: 'pointer' }}
          onClick={() => handleAbrirModalRecibo(sessao)}
        >
          Em Falta
        </Badge>
      )
    }

    return <Badge color="gray">Aguardando Pagamento</Badge>
  }

  const getEstadoBadge = (estado: string, sessao: Sessao) => {
    const colors: Record<string, string> = {
      PENDENTE: 'yellow',
      CONFIRMADA: 'green',
      REJEITADA: 'red',
      PAGO: 'green',
      NAO_PAGO: 'orange',
    }

    // Se for "NAO_PAGO", tornar clicável
    if (estado === 'NAO_PAGO') {
      return (
        <Badge
          color={colors[estado] || 'gray'}
          style={{ cursor: 'pointer' }}
          onClick={() => handleAbrirModalPagamento(sessao)}
        >
          {estado}
        </Badge>
      )
    }

    return <Badge color={colors[estado] || 'gray'}>{estado}</Badge>
  }

  return (
    <Container size="xl" py="md">
      <Title mb="md">Sessões</Title>
      {loading && <Text size="sm" c="dimmed" mb="md">Carregando...</Text>}

      <Grid mb="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Select
            label="Utente"
            placeholder="Todos"
            data={utentes}
            value={filters.utenteId}
            onChange={(value) => setFilters({ ...filters, utenteId: value || '' })}
            searchable
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
          <Select
            label="Estado Pagamento"
            placeholder="Todos"
            data={[
              { value: 'PAGO', label: 'Pago' },
              { value: 'NAO_PAGO', label: 'Não Pago' },
            ]}
            value={filters.estadoPagamento}
            onChange={(value) => setFilters({ ...filters, estadoPagamento: value || '' })}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Select
            label="Status Recibo"
            placeholder="Todos"
            data={[
              { value: 'com_recibo', label: 'Com Recibo' },
              { value: 'sem_recibo', label: 'Sem Recibo' },
              { value: 'nao_aplicavel', label: 'Não Aplicável' },
            ]}
            value={filters.statusRecibo}
            onChange={(value) => setFilters({ ...filters, statusRecibo: value || '' })}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <DatePickerInput
            label="Data Início"
            placeholder="Selecionar data"
            value={filters.dataInicio}
            onChange={(value) => setFilters({ ...filters, dataInicio: value })}
            clearable
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <DatePickerInput
            label="Data Fim"
            placeholder="Selecionar data"
            value={filters.dataFim}
            onChange={(value) => setFilters({ ...filters, dataFim: value })}
            clearable
          />
        </Grid.Col>
      </Grid>

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Data</Table.Th>
            <Table.Th>Utente</Table.Th>
            <Table.Th>Valor</Table.Th>
            <Table.Th>Estado Sessão</Table.Th>
            <Table.Th>Estado Pagamento</Table.Th>
            <Table.Th>Recibo</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sessoes.map((sessao) => (
            <Table.Tr key={sessao.id}>
              <Table.Td>
                {format(new Date(sessao.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}
              </Table.Td>
              <Table.Td>
                <Text fw={600} c="blue">[{sessao.utente.codigo}]</Text> {sessao.utente.nome}
              </Table.Td>
              <Table.Td>{parseFloat(sessao.valorSessao).toFixed(2)} €</Table.Td>
              <Table.Td>{getEstadoBadge(sessao.estadoSessao, sessao)}</Table.Td>
              <Table.Td>{getEstadoBadge(sessao.estadoPagamento, sessao)}</Table.Td>
              <Table.Td>{getEstadoRecibo(sessao)}</Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="subtle"
                  onClick={() => router.push(`/sessoes/${sessao.id}`)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalAberto}
        onClose={() => {
          setModalAberto(false)
          setSessaoParaPagar(null)
          setDataPagamento(null)
        }}
        title="Registrar Pagamento"
      >
        <Stack>
          {sessaoParaPagar && (
            <>
              <Text>
                <strong>Utente:</strong> {sessaoParaPagar.utente.nome}
              </Text>
              <Text>
                <strong>Data da Sessão:</strong>{' '}
                {format(new Date(sessaoParaPagar.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}
              </Text>
              <Text>
                <strong>Valor:</strong> {parseFloat(sessaoParaPagar.valorSessao).toFixed(2)} €
              </Text>
            </>
          )}
          <DatePickerInput
            label="Data de Pagamento"
            value={dataPagamento}
            onChange={setDataPagamento}
            required
            locale="pt"
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setModalAberto(false)
                setSessaoParaPagar(null)
                setDataPagamento(null)
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarPagamento} loading={salvando}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={modalReciboAberto}
        onClose={() => {
          setModalReciboAberto(false)
          setSessaoParaRecibo(null)
          setNumeroRecibo('')
        }}
        title="Registrar Número do Recibo"
      >
        <Stack>
          {sessaoParaRecibo && (
            <>
              <Text>
                <strong>Utente:</strong> {sessaoParaRecibo.utente.nome}
              </Text>
              <Text>
                <strong>Data da Sessão:</strong>{' '}
                {format(new Date(sessaoParaRecibo.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}
              </Text>
              <Text>
                <strong>Valor:</strong> {parseFloat(sessaoParaRecibo.valorSessao).toFixed(2)} €
              </Text>
            </>
          )}
          <TextInput
            label="Número do Recibo"
            value={numeroRecibo}
            onChange={(e) => setNumeroRecibo(e.target.value)}
            required
            placeholder="Ex: REC-001"
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setModalReciboAberto(false)
                setSessaoParaRecibo(null)
                setNumeroRecibo('')
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSalvarRecibo} loading={salvandoRecibo}>
              Salvar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
