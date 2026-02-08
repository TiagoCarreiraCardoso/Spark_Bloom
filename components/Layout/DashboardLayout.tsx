'use client'

import { useSession, signOut } from 'next-auth/react'
import { AppShell, Group, Button, Text, NavLink } from '@mantine/core'
import { usePathname, useRouter } from 'next/navigation'
import {
  IconUsers,
  IconCalendar,
  IconDashboard,
  IconLogout,
  IconPackage,
} from '@tabler/icons-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: IconDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: IconUsers, label: 'Utentes', href: '/utentes' },
    { icon: IconCalendar, label: 'Sessões', href: '/sessoes' },
    { icon: IconPackage, label: 'Artigos', href: '/artigos' },
  ]

  return (
    <AppShell
      navbar={{
        width: 260,
        breakpoint: 'sm',
      }}
      header={{
        height: 64,
      }}
      styles={{
        header: {
          backgroundColor: '#1D3668', // Strong Blue TWY
        },
        navbar: {
          backgroundColor: '#f8f9fb',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fw={700} size="lg" c="white">
              Spark & Bloom
            </Text>
            <Text size="xs" c="white" opacity={0.9}>
              Speech, Mind and Motion
            </Text>
          </Group>
          <Group>
            <Text size="sm" c="white" opacity={0.9}>
              {session?.user?.email}
            </Text>
            <Button
              variant="white"
              color="twy-blue"
              size="xs"
              leftSection={<IconLogout size={14} />}
              onClick={() => signOut()}
            >
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            label={item.label}
            leftSection={<item.icon size={20} />}
            active={pathname === item.href}
            onClick={() => router.push(item.href)}
            color="twy-blue"
            variant="subtle"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          backgroundColor: '#fafbfc',
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  )
}
