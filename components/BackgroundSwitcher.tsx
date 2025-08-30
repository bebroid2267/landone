'use client'

import { usePathname } from 'next/navigation'
import AuditMetricsBackground from './AuditMetricsBackground'
import ReviewMetricsBackground from './ReviewMetricsBackground'
import StartMetricsBackground from './StartMetricsBackground'
import FlashMetricsBackground from './FlashMetricsBackground'

export default function BackgroundSwitcher() {
  const pathname = usePathname()
  
  // Switch backgrounds based on page
  if (pathname === '/audit') {
    return <AuditMetricsBackground />
  }
  
  if (pathname === '/review') {
    return <ReviewMetricsBackground />
  }
  
  if (pathname === '/start') {
    return <StartMetricsBackground />
  }
  
  if (pathname === '/flash') {
    return <FlashMetricsBackground />
  }
  
  return <StartMetricsBackground />
}