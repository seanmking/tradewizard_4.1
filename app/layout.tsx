import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TradeWizard 4.1',
  description: 'Intelligent trade compliance and product classification',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-background">
          {children}
        </main>
      </body>
    </html>
  )
}
