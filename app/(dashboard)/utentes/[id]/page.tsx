'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Paper,
  Tabs,
  Text,
  Group,
  Button,
  Stack,
  Badge,
  Table,
  ActionIcon,
  Modal,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconEdit, IconPlus, IconEye, IconTrash } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

export default function UtenteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [utente, setUtente] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [detalhesAberto, { open: abrirDetalhes, close: fecharDetalhes }] = useDisclosure(false)
  const [condicaoSelecionada, setCondicaoSelecionada] = useState<any>(null)
  const [deleteModalAberto, { open: abrirDeleteModal, close: fecharDeleteModal }] = useDisclosure(false)
  const [deletando, setDeletando] = useState(false)

  useEffect(() => {
    loadUtente()
  }, [id])

  const loadUtente = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/utentes/${id}`)
      if (res.ok) {
        const data = await res.json()
        setUtente(data)
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
      setLoading(false)
    }
  }

  const verDetalhes = (condicao: any) => {
    setCondicaoSelecionada(condicao)
    abrirDetalhes()
  }

  const isCondicaoAtiva = (condicao: any) => {
    const fimVigencia = condicao.fimVigencia ? new Date(condicao.fimVigencia) : null
    return !fimVigencia || fimVigencia >= new Date()
  }

  const handleDelete = async () => {
    setDeletando(true)
    try {
      const res = await fetch(`/api/utentes/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        notifications.show({
          title: 'Sucesso',
          message: 'Utente excluído com sucesso',
          color: 'green',
        })
        router.push('/utentes')
      } else {
        const error = await res.json()
        notifications.show({
          title: 'Erro',
          message: error.error || 'Erro ao excluir utente',
          color: 'red',
        })
      }
    } catch (error) {
      console.error('Erro ao excluir utente:', error)
      notifications.show({
        title: 'Erro',
        message: 'Erro ao excluir utente',
        color: 'red',
      })
    } finally {
      setDeletando(false)
      fecharDeleteModal()
    }
  }

  if (loading || !utente) {
    return (
      <Container size="xl" py="md">
        <Text>Carregando...</Text>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="md">
        <Group>
          <Title>{utente.nome}</Title>
          <Badge size="lg" variant="light" color="blue">
            Código: {utente.codigo}
          </Badge>
        </Group>
        <Group>
          <Badge color={utente.statusProcesso === 'ATIVO' ? 'green' : 'gray'}>
            {utente.statusProcesso}
          </Badge>
          <Button leftSection={<IconEdit size={16} />} onClick={() => router.push(`/utentes/${id}/editar`)}>
            Editar
          </Button>
          <Button 
            leftSection={<IconTrash size={16} />} 
            color="red" 
            variant="outline"
            onClick={abrirDeleteModal}
          >
            Excluir
          </Button>
        </Group>
      </Group>

      <Tabs defaultValue="dados">
        <Tabs.List>
          <Tabs.Tab value="dados">Dados</Tabs.Tab>
          <Tabs.Tab value="condicoes">Condições Comerciais</Tabs.Tab>
          <Tabs.Tab value="sessoes">Sessões</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="dados" pt="md">
          <Paper p="md" withBorder>
            <Stack>
              <Title order={4}>Dados da Criança</Title>
              <Group>
                <Text><strong>Código:</strong> {utente.codigo}</Text>
                <Text><strong>Nome:</strong> {utente.nome}</Text>
                <Text><strong>Data de Nascimento:</strong> {format(new Date(utente.dataNascimento), 'dd/MM/yyyy', { locale: pt })}</Text>
              </Group>
              {utente.email && <Text><strong>Email:</strong> {utente.email}</Text>}
              {utente.telemovel && <Text><strong>Telemóvel:</strong> {utente.telemovel}</Text>}

              {utente.nomePai && (
                <>
                  <Title order={4} mt="md">Pai</Title>
                  <Text><strong>Nome:</strong> {utente.nomePai}</Text>
                  {utente.telemovelPai && <Text><strong>Telemóvel:</strong> {utente.telemovelPai}</Text>}
                  {utente.emailPai && <Text><strong>Email:</strong> {utente.emailPai}</Text>}
                  {utente.moradaPai && <Text><strong>Morada:</strong> {utente.moradaPai}</Text>}
                </>
              )}

              {utente.nomeMae && (
                <>
                  <Title order={4} mt="md">Mãe</Title>
                  <Text><strong>Nome:</strong> {utente.nomeMae}</Text>
                  {utente.telemovelMae && <Text><strong>Telemóvel:</strong> {utente.telemovelMae}</Text>}
                  {utente.emailMae && <Text><strong>Email:</strong> {utente.emailMae}</Text>}
                  {utente.moradaMae && <Text><strong>Morada:</strong> {utente.moradaMae}</Text>}
                </>
              )}

              <Title order={4} mt="md">Faturação</Title>
              <Text><strong>Tipo:</strong> {utente.tipoEntidadeFaturacao}</Text>
              {utente.entidadeFaturacao && <Text><strong>Entidade:</strong> {utente.entidadeFaturacao}</Text>}
              {utente.moradaEntidadeFaturacao && <Text><strong>Morada:</strong> {utente.moradaEntidadeFaturacao}</Text>}

              {utente.notas && (
                <>
                  <Title order={4} mt="md">Notas</Title>
                  <Text>{utente.notas}</Text>
                </>
              )}
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="condicoes" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Condições Comerciais</Title>
              <Button leftSection={<IconPlus size={16} />} onClick={() => router.push(`/utentes/${id}/condicoes/novo`)}>
                Nova Condição
              </Button>
            </Group>

            {utente.condicoes && utente.condicoes.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Artigo</Table.Th>
                    <Table.Th>Início</Table.Th>
                    <Table.Th>Fim</Table.Th>
                    <Table.Th>Preço Cliente</Table.Th>
                    <Table.Th>Valor Terapeuta</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Ações</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {utente.condicoes.map((condicao: any) => (
                    <Table.Tr key={condicao.id}>
                      <Table.Td>{condicao.artigo ? `${condicao.artigo.codigo} - ${condicao.artigo.nome}` : '-'}</Table.Td>
                      <Table.Td>{format(new Date(condicao.inicioVigencia), 'dd/MM/yyyy', { locale: pt })}</Table.Td>
                      <Table.Td>{condicao.fimVigencia ? format(new Date(condicao.fimVigencia), 'dd/MM/yyyy', { locale: pt }) : '-'}</Table.Td>
                      <Table.Td>{parseFloat(condicao.precoCliente.toString()).toFixed(2)} €</Table.Td>
                      <Table.Td>{parseFloat(condicao.valorTerapeuta.toString()).toFixed(2)} €</Table.Td>
                      <Table.Td>
                        <Badge color={isCondicaoAtiva(condicao) ? 'green' : 'gray'}>
                          {isCondicaoAtiva(condicao) ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => verDetalhes(condicao)}
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => router.push(`/utentes/${id}/condicoes/${condicao.id}/editar`)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">Nenhuma condição comercial registrada</Text>
            )}
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="sessoes" pt="md">
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Sessões</Title>
            {utente.sessoes && utente.sessoes.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Data</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th>Pagamento</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {utente.sessoes.map((sessao: any) => (
                    <Table.Tr key={sessao.id}>
                      <Table.Td>{format(new Date(sessao.dataSessao), 'dd/MM/yyyy HH:mm', { locale: pt })}</Table.Td>
                      <Table.Td>{sessao.estadoSessao}</Table.Td>
                      <Table.Td>{parseFloat(sessao.valorSessao.toString()).toFixed(2)} €</Table.Td>
                      <Table.Td>{sessao.estadoPagamento}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text c="dimmed">Nenhuma sessão registrada</Text>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={detalhesAberto}
        onClose={fecharDetalhes}
        title={condicaoSelecionada?.artigo ? `${condicaoSelecionada.artigo.codigo} - ${condicaoSelecionada.artigo.nome}` : 'Detalhes da Condição'}
        size="lg"
      >
        {condicaoSelecionada && (
          <Stack>
            <Table>
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td><strong>Artigo:</strong></Table.Td>
                  <Table.Td>{condicaoSelecionada.artigo ? `${condicaoSelecionada.artigo.codigo} - ${condicaoSelecionada.artigo.nome}` : '-'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Preço Cliente:</strong></Table.Td>
                  <Table.Td>{parseFloat(condicaoSelecionada.precoCliente.toString()).toFixed(2)} €</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Valor Clínica:</strong></Table.Td>
                  <Table.Td>{parseFloat(condicaoSelecionada.valorClinica.toString()).toFixed(2)} €</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Valor Terapeuta:</strong></Table.Td>
                  <Table.Td>{parseFloat(condicaoSelecionada.valorTerapeuta.toString()).toFixed(2)} €</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Retenção IRS:</strong></Table.Td>
                  <Table.Td>{parseFloat(condicaoSelecionada.retencaoIRS.toString()).toFixed(2)} %</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Valor Líquido:</strong></Table.Td>
                  <Table.Td>{parseFloat(condicaoSelecionada.valorLiquido.toString()).toFixed(2)} €</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Necessita Recibo:</strong></Table.Td>
                  <Table.Td>{condicaoSelecionada.necessitaRecibo ? 'Sim' : 'Não'}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Início Vigência:</strong></Table.Td>
                  <Table.Td>{format(new Date(condicaoSelecionada.inicioVigencia), 'dd/MM/yyyy', { locale: pt })}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Fim Vigência:</strong></Table.Td>
                  <Table.Td>
                    {condicaoSelecionada.fimVigencia
                      ? format(new Date(condicaoSelecionada.fimVigencia), 'dd/MM/yyyy', { locale: pt })
                      : '-'}
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td><strong>Status:</strong></Table.Td>
                  <Table.Td>
                    <Badge color={isCondicaoAtiva(condicaoSelecionada) ? 'green' : 'gray'}>
                      {isCondicaoAtiva(condicaoSelecionada) ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
            <Group justify="flex-end" mt="md">
              <Button variant="outline" onClick={fecharDetalhes}>
                Fechar
              </Button>
              <Button onClick={() => {
                fecharDetalhes()
                router.push(`/utentes/${id}/condicoes/${condicaoSelecionada.id}/editar`)
              }}>
                Editar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={deleteModalAberto}
        onClose={fecharDeleteModal}
        title="Confirmar Exclusão"
        centered
      >
        <Stack>
          <Text>
            Tem certeza que deseja excluir o utente <strong>{utente?.nome}</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Esta ação não pode ser desfeita. Todas as condições comerciais e sessões associadas também serão excluídas.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={fecharDeleteModal} disabled={deletando}>
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
