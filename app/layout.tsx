import { Inter } from 'next/font/google'
import React from 'react';
import './globals.css'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interpret contract',
  description: 'Explain the contents of a contract at the provided address',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
