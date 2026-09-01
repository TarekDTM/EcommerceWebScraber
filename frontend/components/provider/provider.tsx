'use client'
import { getQueryClientSingleton } from '@/lib/queryClient/get-query-client';
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type * as React from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClientSingleton()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}