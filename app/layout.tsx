import type { Metadata } from 'next'
import "./globals.css";

export const metadata: Metadata = {
  title: 'imoGo',
  description: 'imoGo', 
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>       
        <main>{children}</main>
      </body>
    </html>
  )
}