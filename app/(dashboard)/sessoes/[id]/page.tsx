'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Paper,
  Text,
  Group,
  Button,
  Stack,
  Select,
  TextInput,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default function EditarSessaoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [sessao, setSessao] = useState<any>(null)

  const form = useForm({
    initialValues: {
      estadoSessao: '',
      estadoPagamento: '',
      dataPagamento: null as Date | null,
      numeroRecibo: '',
      motivoRejeicao: '',
    },
  })

  useEffect(() => {
    loadSessao()
  }, [id])

  const loadSessao = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`/api/sessoes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setSessao(data)
        form.setValues({
          estadoSessao: data.estadoSessao || '',
          estadoPagamento: data.estadoPagamento || '',
          dataPagamento: data.dataPagamento ? new Date(data.dataPagamento) : null,
          numeroRecibo: data.numeroRecibo || '',
          motivoRejeicao: data.motivoRejeicao || '',
        })
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Sessão não encontrada',
          color: 'red',
        })
        router.push('/sessoes')
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar sessão',
        color: 'red',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (values: typeof form.values) => {
    setLoading(true)
    try {
      const payload: any = {
        estadoSessao: values.estadoSessao || undefined,
        estadoPagamento: values.estadoPagamento || undefined,
        dataPagamento: values.dataPagamento ? values.dataPagamento.toISOString() : null,
        numeroRecibo: values.numeroRecibo || undefined,
        motivoRejeicao: values.motivoRejeicao || undefined,
      }

      const res = await fetch(`/api/sessoes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Sessão atualizada com sucesso',
          color: 'green',
        })
        router.push('/sessoes')
      } else {
        const error = await res.json()
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao atualizar sessão',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao atualizar sessão',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData || !sessao) {
    return (
      <Container size="xl" py="md">
        <Text>Carregando...</Text>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Title>Editar Sessão</Title>
        <Button variant="outline" onClick={() => router.push('/sessoes')}>
          Voltar
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <Stack>
          <Group>
            <Text><strong>Utente:</strong> {sessao.utente.nome}</Text>
            <Text><strong>Data da Sessão:</strong> {format(new Date(sessao.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}</Text>
          </Group>
          <Group>
            <Text><strong>Valor Sessão:</strong> {parseFloat(sessao.valorSessao.toString()).toFixed(2)} €</Text>
            <Text><strong>Valor Terapeuta:</strong> {parseFloat(sessao.valorTerapeuta.toString()).toFixed(2)} €</Text>
            <Text><strong>Valor Líquido:</strong> {parseFloat(sessao.valorLiquido.toString()).toFixed(2)} €</Text>
          </Group>
        </Stack>
      </Paper>

      <Paper p="md" withBorder mt="md">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Select
              label="Estado da Sessão"
              data={[
                { value: 'PENDENTE', label: 'Pendente' },
                { value: 'CONFIRMADA', label: 'Confirmada' },
                { value: 'REJEITADA', label: 'Rejeitada' },
              ]}
              {...form.getInputProps('estadoSessao')}
            />

            <Select
              label="Estado de Pagamento"
              data={[
                { value: 'PAGO', label: 'Pago' },
                { value: 'NAO_PAGO', label: 'Não Pago' },
              ]}
              {...form.getInputProps('estadoPagamento')}
            />

            <DatePickerInput
              label="Data de Pagamento"
              value={form.values.dataPagamento}
              onChange={(value) => form.setFieldValue('dataPagamento', value)}
              clearable
            />

            <TextInput
              label="Número de Recibo"
              {...form.getInputProps('numeroRecibo')}
              disabled={!sessao.sujeitaRecibo}
            />

            {form.values.estadoSessao === 'REJEITADA' && (
              <TextInput
                label="Motivo da Rejeição"
                {...form.getInputProps('motivoRejeicao')}
              />
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => router.push('/sessoes')}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
