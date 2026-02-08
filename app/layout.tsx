import type { Metadata } from 'next'
import { Nunito } from 'next/font/google'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { Providers } from '@/components/Providers'
import { theme } from '@/lib/theme'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-nunito',
})

export const metadata: Metadata = {
  title: 'Spark & Bloom – Speech, Mind and Motion',
  description: 'Sistema de gestão de sessões de terapia da fala e faturação. Speech, Mind and Motion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className={nunito.variable}>
      <body className={nunito.className}>
        <Providers>
          <MantineProvider theme={theme}>
            <Notifications />
            {children}
          </MantineProvider>
        </Providers>
      </body>
    </html>
  )
}
