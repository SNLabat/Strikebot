import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strikebot Builder',
  description: 'Internal chatbot builder tool - Create and configure AI chatbots for WordPress',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
