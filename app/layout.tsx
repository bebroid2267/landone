import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ToastProvider } from '@/components/ui/Toast/ToastContext'
import '../styles/main.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Taller de Inteligencia Artificial - Domina las 10 Herramientas de IA',
  description: 'Aprende a usar la inteligencia artificial para crear contenido viral, automatizar tareas y construir negocios digitales. Taller gratuito en vivo.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            background-color: #108da0 !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          html {
            overflow-y: auto !important;
          }
        `}} />
      </head>
      <body
        className={`${inter.className} antialiased min-h-screen transition-colors duration-300`}
        style={{ backgroundColor: '#108da0', overflowY: 'auto' }}
      >
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
