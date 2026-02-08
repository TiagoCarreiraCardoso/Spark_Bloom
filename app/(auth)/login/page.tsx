'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim() || !password) {
      notifications.show({
        title: 'Atenção',
        message: 'Por favor, preencha todos os campos',
        color: 'yellow',
      })
      return
    }

    setLoading(true)
    console.log('Tentando fazer login com:', { email: email.trim() })

    try {
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      console.log('Resultado do signIn:', result)

      if (result?.error) {
        console.error('Erro no login:', result.error)
        let errorMessage = 'Email ou senha incorretos'
        
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Credenciais inválidas. Verifique seu email e senha.'
        }
        
        notifications.show({
          title: 'Erro',
          message: errorMessage,
          color: 'red',
        })
      } else if (result?.ok) {
        console.log('Login bem-sucedido, redirecionando...')
        notifications.show({
          title: 'Sucesso',
          message: 'Login realizado com sucesso!',
          color: 'green',
        })
        
        // Aguardar um pouco antes de redirecionar
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      } else {
        console.warn('Resultado inesperado:', result)
        notifications.show({
          title: 'Atenção',
          message: 'Resposta inesperada do servidor. Tente novamente.',
          color: 'yellow',
        })
      }
    } catch (error: any) {
      console.error('Erro ao fazer login:', error)
      notifications.show({
        title: 'Erro',
        message: error?.message || 'Ocorreu um erro ao fazer login. Verifique o console.',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container size={420} my={40}>
      <Title ta="center" mb="xs" c="#1D3668" fw={700}>
        Spark & Bloom
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={4} mb={24}>
        Speech, Mind and Motion
      </Text>

      <Paper withBorder shadow="md" p={30} radius="md" style={{ borderColor: '#e8ecf4' }}>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="seu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" fullWidth mt="xl" loading={loading} color="twy-blue">
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  )
}
