'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Button,
  Table,
  Group,
  TextInput,
  Select,
  ActionIcon,
  Modal,
  Stack,
  Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPlus, IconEdit, IconEye, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { useRouter } from 'next/navigation'

interface Utente {
  id: string
  codigo: number
  nome: string
  email: string | null
  telemovel: string | null
  statusProcesso: string
  _count: { sessoes: number }
}

export default function UtentesPage() {
  const router = useRouter()
  const [utentes, setUtentes] = useState<Utente[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [deleteModalAberto, { open: abrirDeleteModal, close: fecharDeleteModal }] = useDisclosure(false)
  const [utenteParaExcluir, setUtenteParaExcluir] = useState<Utente | null>(null)
  const [deletando, setDeletando] = useState(false)

  useEffect(() => {
    loadUtentes()
  }, [search, statusFilter])

  const loadUtentes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)

      const res = await fetch(`/api/utentes?${params}`)
      const data = await res.json()
      setUtentes(data)
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao carregar utentes',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (utente: Utente) => {
    setUtenteParaExcluir(utente)
    abrirDeleteModal()
  }

  const handleDelete = async () => {
    if (!utenteParaExcluir) return

    setDeletando(true)
    console.log('Iniciando exclusão do utente:', utenteParaExcluir.id)

    const controller = new AbortController()
    const signal = controller.signal

    // Timeout de segurança - se a requisição demorar mais de 10 segundos, cancelar
    const timeoutId = setTimeout(() => {
      console.warn('Timeout na exclusão do utente - cancelando requisição')
      controller.abort()
      setDeletando(false)
      fecharDeleteModal()
      setUtenteParaExcluir(null)
      notifications.show({
        title: 'Timeout',
        message: 'A operação demorou muito. Tente novamente.',
        color: 'yellow',
      })
    }, 10000)

    try {
      const res = await fetch(`/api/utentes/${utenteParaExcluir.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      })

      clearTimeout(timeoutId)
      console.log('Resposta da API:', res.status, res.statusText)

      if (res.ok) {
        const data = await res.json()
        console.log('Utente excluído com sucesso:', data)
        
        notifications.show({
          title: 'Sucesso',
          message: 'Utente excluído com sucesso',
          color: 'green',
        })
        
        // Fechar modal e limpar estado
        fecharDeleteModal()
        setUtenteParaExcluir(null)
        setDeletando(false)
        
        // Recarregar a lista
        await loadUtentes()
      } else {
        const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro na resposta:', error)
        
        notifications.show({
          title: 'Erro',
          message: error.error || `Erro ao excluir utente (${res.status})`,
          color: 'red',
        })
        
        setDeletando(false)
        fecharDeleteModal()
        setUtenteParaExcluir(null)
      }
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('Erro ao excluir utente:', error)
      
      // Se for erro de abort (timeout), já foi tratado no timeout
      if (error.name === 'AbortError') {
        return
      }
      
      notifications.show({
        title: 'Erro',
        message: error?.message || 'Erro ao excluir utente. Verifique o console.',
        color: 'red',
      })
      
      setDeletando(false)
      fecharDeleteModal()
      setUtenteParaExcluir(null)
    }
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Title>Utentes</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => router.push('/utentes/novo')}>
          Novo Utente
        </Button>
      </Group>

      <Group mb="md">
        <TextInput
          placeholder="Pesquisar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Status"
          data={[
            { value: 'ATIVO', label: 'Ativo' },
            { value: 'INATIVO', label: 'Inativo' },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
        />
      </Group>
      {loading && <Text size="sm" c="dimmed" mb="md">Carregando...</Text>}

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Nome</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Telemóvel</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Sessões</Table.Th>
            <Table.Th>Ações</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {utentes.map((utente) => (
            <Table.Tr key={utente.id}>
              <Table.Td>
                <Text fw={600} c="blue">{utente.codigo}</Text>
              </Table.Td>
              <Table.Td>{utente.nome}</Table.Td>
              <Table.Td>{utente.email || '-'}</Table.Td>
              <Table.Td>{utente.telemovel || '-'}</Table.Td>
              <Table.Td>{utente.statusProcesso}</Table.Td>
              <Table.Td>{utente._count.sessoes}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon
                    variant="subtle"
                    onClick={() => router.push(`/utentes/${utente.id}`)}
                  >
                    <IconEye size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    onClick={() => router.push(`/utentes/${utente.id}/editar`)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    onClick={() => handleDeleteClick(utente)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={deleteModalAberto}
        onClose={() => {
          if (!deletando) {
            fecharDeleteModal()
            setUtenteParaExcluir(null)
          }
        }}
        title="Confirmar Exclusão"
        centered
        closeOnClickOutside={!deletando}
        closeOnEscape={!deletando}
      >
        <Stack>
          <Text>
            Tem certeza que deseja excluir o utente <strong>{utenteParaExcluir?.nome}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Esta ação não pode ser desfeita. Todas as condições comerciais e sessões associadas também serão excluídas.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button 
              variant="outline" 
              onClick={() => {
                fecharDeleteModal()
                setUtenteParaExcluir(null)
                setDeletando(false)
              }} 
              disabled={deletando}
            >
              Cancelar
            </Button>
            <Button color="red" onClick={handleDelete} loading={deletando}>
              Excluir
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
