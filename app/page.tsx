import { redirect } from 'next/navigation'

export default function Home() {
  // Redireciona para login - a autenticação será verificada no layout do dashboard
  redirect('/login')
}
