'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  ActionIcon,
  Badge,
  Modal,
  Stack,
  Text,
  TextInput,
  Checkbox,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconEdit } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useForm } from '@mantine/form'

interface Artigo {
  id: string
  codigo: string
  nome: string
  ativo: boolean
}

export default function ArtigosPage() {
  const [artigos, setArtigos] = useState<Artigo[]>([])
  const [loading, setLoading] = useState(true)
  const [opened, { open, close }] = useDisclosure(false)
  const [editingArtigo, setEditingArtigo] = useState<Artigo | null>(null)

  const form = useForm({
    initialValues: {
      codigo: '',
      nome: '',
      ativo: true,
    },
    validate: {
      codigo: (value) => (value.trim().length < 1 ? 'Código é obrigatório' : null),
      nome: (value) => (value.trim().length < 1 ? 'Nome é obrigatório' : null),
    },
  })

  useEffect(() => {
    loadArtigos()
  }, [])

  const loadArtigos = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/artigos')
      const data = await res.json()
      setArtigos(data)
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar artigos',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    setEditingArtigo(null)
    form.reset()
    open()
  }

  const handleEdit = (artigo: Artigo) => {
    setEditingArtigo(artigo)
    form.setValues({
      codigo: artigo.codigo,
      nome: artigo.nome,
      ativo: artigo.ativo,
    })
    open()
  }

  const handleSubmit = async (values: typeof form.values) => {
    try {
      const url = editingArtigo
        ? `/api/artigos/${editingArtigo.id}`
        : '/api/artigos'
      const method = editingArtigo ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: editingArtigo ? 'Artigo atualizado' : 'Artigo criado',
          color: 'green',
        })
        close()
        loadArtigos()
      } else {
        const error = await res.json()
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao salvar artigo',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao salvar artigo',
        color: 'red',
      })
    }
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Title>Artigos</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleNew}>
          Novo Artigo
        </Button>
      </Group>

      {loading && (
        <Stack align="center" py="xl">
          <Text size="sm" c="dimmed">Carregando...</Text>
        </Stack>
      )}
      {!loading && (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {artigos.map((artigo) => (
            <Table.Tr key={artigo.id}>
              <Table.Td>{artigo.codigo}</Table.Td>
              <Table.Td>{artigo.nome}</Table.Td>
              <Table.Td>
                <Badge color={artigo.ativo ? 'green' : 'gray'}>
                  {artigo.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="subtle" onClick={() => handleEdit(artigo)}>
                  <IconEdit size={16} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      )}

      <Modal
        opened={opened}
        onClose={close}
        title={editingArtigo ? 'Editar Artigo' : 'Novo Artigo'}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Código *"
              required
              placeholder="Ex: STF001"
              {...form.getInputProps('codigo')}
              disabled={!!editingArtigo}
            />
            <TextInput
              label="Nome *"
              required
              placeholder="Ex: Sessão de Terapia da Fala"
              {...form.getInputProps('nome')}
            />
            <Checkbox
              label="Ativo"
              {...form.getInputProps('ativo', { type: 'checkbox' })}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={close}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  )
}
