'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Paper,
  TextInput,
  Select,
  Button,
  Stack,
  Grid,
  Textarea,
  Group,
  Text,
} from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'

export default function EditarUtentePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  const form = useForm({
    initialValues: {
      nome: '',
      dataNascimento: null as Date | null,
      telemovel: '',
      email: '',
      nomePai: '',
      telemovelPai: '',
      emailPai: '',
      ruaPai: '',
      localidadePai: '',
      codigoPostalPai: '',
      concelhoPai: '',
      nomeMae: '',
      telemovelMae: '',
      emailMae: '',
      ruaMae: '',
      localidadeMae: '',
      codigoPostalMae: '',
      concelhoMae: '',
      tipoEntidadeFaturacao: 'PROPRIO' as 'PROPRIO' | 'CLINICA',
      entidadeFaturacao: '',
      ruaFaturacao: '',
      localidadeFaturacao: '',
      codigoPostalFaturacao: '',
      concelhoFaturacao: '',
      statusProcesso: 'ATIVO' as 'ATIVO' | 'INATIVO',
      dataAberturaFicha: new Date(),
      notas: '',
    },
    validate: {
      nome: (value) => (value.trim().length < 1 ? 'Nome é obrigatório' : null),
      dataNascimento: (value) => (!value ? 'Data de nascimento é obrigatória' : null),
      tipoEntidadeFaturacao: (value) => (!value ? 'Tipo de entidade é obrigatório' : null),
    },
  })

  useEffect(() => {
    loadUtente()
  }, [id])

  const loadUtente = async () => {
    setLoadingData(true)
    try {
      const res = await fetch(`/api/utentes/${id}`)
      if (res.ok) {
        const data = await res.json()
        
        // Separar moradas em componentes
        const separarMorada = (morada: string | null | undefined) => {
          if (!morada) return { rua: '', localidade: '', codigoPostal: '', concelho: '' }
          const parts = morada.split(',').map(p => p.trim())
          return {
            rua: parts[0] || '',
            localidade: parts[1] || '',
            codigoPostal: parts[2] || '',
            concelho: parts[3] || '',
          }
        }

        const moradaPai = separarMorada(data.moradaPai)
        const moradaMae = separarMorada(data.moradaMae)
        const moradaFaturacao = separarMorada(data.moradaEntidadeFaturacao)

        form.setValues({
          nome: data.nome,
          dataNascimento: new Date(data.dataNascimento),
          telemovel: data.telemovel || '',
          email: data.email || '',
          nomePai: data.nomePai || '',
          telemovelPai: data.telemovelPai || '',
          emailPai: data.emailPai || '',
          ruaPai: moradaPai.rua,
          localidadePai: moradaPai.localidade,
          codigoPostalPai: moradaPai.codigoPostal,
          concelhoPai: moradaPai.concelho,
          nomeMae: data.nomeMae || '',
          telemovelMae: data.telemovelMae || '',
          emailMae: data.emailMae || '',
          ruaMae: moradaMae.rua,
          localidadeMae: moradaMae.localidade,
          codigoPostalMae: moradaMae.codigoPostal,
          concelhoMae: moradaMae.concelho,
          tipoEntidadeFaturacao: data.tipoEntidadeFaturacao,
          entidadeFaturacao: data.entidadeFaturacao || '',
          ruaFaturacao: moradaFaturacao.rua,
          localidadeFaturacao: moradaFaturacao.localidade,
          codigoPostalFaturacao: moradaFaturacao.codigoPostal,
          concelhoFaturacao: moradaFaturacao.concelho,
          statusProcesso: data.statusProcesso,
          dataAberturaFicha: new Date(data.dataAberturaFicha),
          notas: data.notas || '',
        })
      } else {
        notifications.show({
          title: 'Erro',
          message: 'Utente não encontrado',
          color: 'red',
        })
        router.push('/utentes')
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar utente',
        color: 'red',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const buildMorada = (rua: string, localidade: string, codigoPostal: string, concelho: string) => {
    const parts = [rua, localidade, codigoPostal, concelho].filter(p => p.trim())
    return parts.length > 0 ? parts.join(', ') : undefined
  }

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.dataNascimento) return

    setLoading(true)
    try {
      const payload = {
        nome: values.nome,
        dataNascimento: values.dataNascimento.toISOString(),
        telemovel: values.telemovel || undefined,
        email: values.email || undefined,
        nomePai: values.nomePai || undefined,
        telemovelPai: values.telemovelPai || undefined,
        emailPai: values.emailPai || undefined,
        moradaPai: buildMorada(values.ruaPai, values.localidadePai, values.codigoPostalPai, values.concelhoPai),
        nomeMae: values.nomeMae || undefined,
        telemovelMae: values.telemovelMae || undefined,
        emailMae: values.emailMae || undefined,
        moradaMae: buildMorada(values.ruaMae, values.localidadeMae, values.codigoPostalMae, values.concelhoMae),
        tipoEntidadeFaturacao: values.tipoEntidadeFaturacao,
        entidadeFaturacao: values.entidadeFaturacao || undefined,
        moradaEntidadeFaturacao: buildMorada(values.ruaFaturacao, values.localidadeFaturacao, values.codigoPostalFaturacao, values.concelhoFaturacao),
        statusProcesso: values.statusProcesso,
        dataAberturaFicha: values.dataAberturaFicha.toISOString(),
        notas: values.notas || undefined,
      }

      const res = await fetch(`/api/utentes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Utente atualizado com sucesso',
          color: 'green',
        })
        router.push(`/utentes/${id}`)
      } else {
        const error = await res.json()
        console.error('Erro na resposta:', error)
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao atualizar utente',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Erro ao atualizar utente:', error)
      notifications.show({
        title: 'Erro',
        message: 'Erro ao atualizar utente',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <Container size="lg" py="md">
        <Text>Carregando...</Text>
      </Container>
    )
  }

  return (
    <Container size="lg" py="md">
      <Title mb="md" order={2}>Editar Utente</Title>

      <Paper p="xl" withBorder>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Title order={4}>Dados da Criança</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Nome *" required {...form.getInputProps('nome')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DatePickerInput
                  label="Data de Nascimento *"
                  required
                  {...form.getInputProps('dataNascimento')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Telemóvel" {...form.getInputProps('telemovel')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Email" type="email" {...form.getInputProps('email')} />
              </Grid.Col>
            </Grid>

            <Title order={4} mt="md">Encarregado de Educação - Pai</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Nome do Pai" {...form.getInputProps('nomePai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Telemóvel do Pai" {...form.getInputProps('telemovelPai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Email do Pai" type="email" {...form.getInputProps('emailPai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Rua" {...form.getInputProps('ruaPai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Localidade" {...form.getInputProps('localidadePai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Código Postal" {...form.getInputProps('codigoPostalPai')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Concelho" {...form.getInputProps('concelhoPai')} />
              </Grid.Col>
            </Grid>

            <Title order={4} mt="md">Encarregado de Educação - Mãe</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Nome da Mãe" {...form.getInputProps('nomeMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Telemóvel da Mãe" {...form.getInputProps('telemovelMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Email da Mãe" type="email" {...form.getInputProps('emailMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Rua" {...form.getInputProps('ruaMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Localidade" {...form.getInputProps('localidadeMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Código Postal" {...form.getInputProps('codigoPostalMae')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Concelho" {...form.getInputProps('concelhoMae')} />
              </Grid.Col>
            </Grid>

            <Title order={4} mt="md">Faturação</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Tipo de Entidade *"
                  required
                  data={[
                    { value: 'PROPRIO', label: 'Próprio' },
                    { value: 'CLINICA', label: 'Clínica' },
                  ]}
                  {...form.getInputProps('tipoEntidadeFaturacao')}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Entidade de Faturação" {...form.getInputProps('entidadeFaturacao')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Rua" {...form.getInputProps('ruaFaturacao')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Localidade" {...form.getInputProps('localidadeFaturacao')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Código Postal" {...form.getInputProps('codigoPostalFaturacao')} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 3 }}>
                <TextInput label="Concelho" {...form.getInputProps('concelhoFaturacao')} />
              </Grid.Col>
            </Grid>

            <Title order={4} mt="md">Processo</Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label="Status do Processo"
                  data={[
                    { value: 'ATIVO', label: 'Ativo' },
                    { value: 'INATIVO', label: 'Inativo' },
                  ]}
                  {...form.getInputProps('statusProcesso')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Textarea label="Notas" rows={3} {...form.getInputProps('notas')} />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" loading={loading}>
                Salvar Alterações
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
