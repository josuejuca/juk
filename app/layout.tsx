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