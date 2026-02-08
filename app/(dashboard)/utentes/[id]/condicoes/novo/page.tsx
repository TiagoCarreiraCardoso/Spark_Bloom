'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Paper,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Grid,
  Group,
  Checkbox,
  Select,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'

export default function NovaCondicaoPage() {
  const params = useParams()
  const router = useRouter()
  const utenteId = params.id as string
  const [loading, setLoading] = useState(false)
  const [artigos, setArtigos] = useState<Array<{ value: string; label: string }>>([])

  useEffect(() => {
    loadArtigos()
  }, [])

  const loadArtigos = async () => {
    try {
      const res = await fetch('/api/artigos?ativo=true')
      const data = await res.json()
      setArtigos(data.map((a: any) => ({ value: a.id, label: `${a.codigo} - ${a.nome}` })))
    } catch (error) {
      console.error('Erro ao carregar artigos:', error)
    }
  }

  const form = useForm({
    initialValues: {
      artigoId: '',
      precoCliente: 0,
      valorClinica: 0,
      valorTerapeuta: 0,
      retencaoIRS: 0,
      necessitaRecibo: true,
      inicioVigencia: new Date(),
      fimVigencia: null as Date | null,
    },
    validate: {
      precoCliente: (value) => (value <= 0 ? 'Preço deve ser positivo' : null),
      valorTerapeuta: (value) => (value < 0 ? 'Valor não pode ser negativo' : null),
      valorClinica: (value) => (value < 0 ? 'Valor não pode ser negativo' : null),
      retencaoIRS: (value) => (value < 0 || value > 100 ? 'Retenção deve estar entre 0 e 100' : null),
      inicioVigencia: (value) => (!value ? 'Data de início é obrigatória' : null),
    },
    transformValues: (values) => ({
      ...values,
      // Calcular valor líquido automaticamente
      valorLiquido: values.valorTerapeuta - (values.valorTerapeuta * values.retencaoIRS / 100),
    }),
  })

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.inicioVigencia) return

    setLoading(true)
    try {
      // Garantir que todos os valores numéricos são números
      const payload = {
        artigoId: values.artigoId || null,
        precoCliente: Number(values.precoCliente),
        valorClinica: Number(values.valorClinica),
        valorTerapeuta: Number(values.valorTerapeuta),
        retencaoIRS: Number(values.retencaoIRS),
        necessitaRecibo: Boolean(values.necessitaRecibo),
        inicioVigencia: values.inicioVigencia.toISOString(),
        fimVigencia: values.fimVigencia ? values.fimVigencia.toISOString() : null,
      }

      const res = await fetch(`/api/utentes/${utenteId}/condicoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Condição comercial criada com sucesso',
          color: 'green',
        })
        router.push(`/utentes/${utenteId}`)
      } else {
        const error = await res.json()
        console.error('Erro na resposta:', error)
        notifications.show({
          title: 'Erro',
          message: error.error || error.details?.[0]?.message || 'Erro ao criar condição comercial',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Erro ao criar condição:', error)
      notifications.show({
        title: 'Erro',
        message: 'Erro ao criar condição comercial',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const valorLiquido = form.values.valorTerapeuta - (form.values.valorTerapeuta * form.values.retencaoIRS / 100)

  return (
    <Container size="lg" py="md">
      <Title mb="md" order={2}>Nova Condição Comercial</Title>

      <Paper p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={12}>
                <Select
                  label="Artigo *"
                  required
                  placeholder="Selecione um artigo"
                  data={artigos}
                  searchable
                  {...form.getInputProps('artigoId')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Preço Cliente (€) *"
                  required
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  {...form.getInputProps('precoCliente')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Valor Clínica (€)"
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  {...form.getInputProps('valorClinica')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Valor Terapeuta (€)"
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  {...form.getInputProps('valorTerapeuta')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Retenção IRS (%)"
                  min={0}
                  max={100}
                  step={0.01}
                  decimalScale={2}
                  {...form.getInputProps('retencaoIRS')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Valor Líquido (€)"
                  value={valorLiquido.toFixed(2)}
                  readOnly
                  variant="filled"
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Checkbox
                  label="Necessita Recibo"
                  mt="xl"
                  {...form.getInputProps('necessitaRecibo', { type: 'checkbox' })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label="Início Vigência *"
                  required
                  {...form.getInputProps('inicioVigencia')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label="Fim Vigência (opcional)"
                  clearable
                  {...form.getInputProps('fimVigencia')}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Criar Condição
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
