'use client'

import { useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Stack,
  Textarea,
  Group,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'

export default function ConfirmarSessaoPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const sessaoId = params.id as string
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleConfirm = async () => {
    if (!token) {
      notifications.show({
        title: 'Erro',
        message: 'Token não encontrado',
        color: 'red',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/webhooks/sessao/${sessaoId}/confirm?token=${token}`, {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        notifications.show({
          title: 'Sucesso',
          message: 'Sessão confirmada com sucesso',
          color: 'green',
        })
      } else {
        notifications.show({
          title: 'Erro',
          message: data.error || 'Erro ao confirmar sessão',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao confirmar sessão',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!token) {
      notifications.show({
        title: 'Erro',
        message: 'Token não encontrado',
        color: 'red',
      })
      return
    }

    if (!motivo.trim()) {
      notifications.show({
        title: 'Erro',
        message: 'Por favor, informe o motivo da rejeição',
        color: 'red',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/webhooks/sessao/${sessaoId}/reject?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ motivo }),
      })

      const data = await res.json()

      if (res.ok) {
        setSubmitted(true)
        notifications.show({
          title: 'Sucesso',
          message: 'Sessão rejeitada',
          color: 'orange',
        })
      } else {
        notifications.show({
          title: 'Erro',
          message: data.error || 'Erro ao rejeitar sessão',
          color: 'red',
        })
      }
    } catch (error) {
      notifications.show({
        title: 'Erro',
        message: 'Erro ao rejeitar sessão',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Container size="sm" py="xl">
        <Paper p="xl" withBorder>
          <Stack align="center">
            <Title order={2}>Obrigado!</Title>
            <Text>Sua resposta foi registrada com sucesso.</Text>
          </Stack>
        </Paper>
      </Container>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Paper p="xl" withBorder>
        <Stack>
          <Title order={2} ta="center">
            Confirmação de Sessão
          </Title>
          <Text ta="center" c="dimmed">
            Por favor, confirme ou rejeite a realização desta sessão
          </Text>

          <Group grow mt="md">
            <Button
              color="green"
              size="lg"
              onClick={handleConfirm}
              loading={loading}
              disabled={!token}
            >
              Confirmar Sessão
            </Button>
            <Button
              color="red"
              size="lg"
              variant="outline"
              onClick={() => {
                // Mostrar campo de motivo
                const motivoInput = document.getElementById('motivo')
                if (motivoInput) {
                  motivoInput.style.display = 'block'
                }
              }}
              disabled={!token}
            >
              Rejeitar Sessão
            </Button>
          </Group>

          <Textarea
            id="motivo"
            label="Motivo da Rejeição"
            placeholder="Informe o motivo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            style={{ display: 'none' }}
            mt="md"
          />

          {motivo && (
            <Button color="red" onClick={handleReject} loading={loading} mt="md">
              Confirmar Rejeição
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  )
}
