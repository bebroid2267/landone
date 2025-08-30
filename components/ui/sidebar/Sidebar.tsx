'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useGoogleAds } from '@/components/hooks/useGoogleAds'
import { useUser } from '@/components/hooks/useUser'
import { hasPremiumAccess } from '@/utils/supabase/report-usage'

interface SidebarItem {
  name: string
  href: string
  icon?: React.ReactNode
  description?: string
  isPro?: boolean
  submenu?: SidebarItem[]
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  isOnboardingMode?: boolean
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        description:
          'Your customizable command center with high-level KPIs and critical alerts.',
      },
      {
        name: 'Audit',
        href: '/google-ads/ai-analysis?timeRange=180days&auto_start=true',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Account audit and analysis',
      },
      {
        name: 'Weekly',
        href: '/google-ads/ai-analysis?timeRange=LAST_7_DAYS&auto_start=true',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        ),
        description: 'Weekly performance analysis',
      },
    ],
  },
  {
    title: 'WEEKLY ANALYSIS',
    items: [
      {
        name: 'Campaign Pacing',
        href: '/google-ads/analytics?reportType=campaign-pacing',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        ),
        description: 'Weekly campaign pacing analysis',
      },
      {
        name: 'Significant Changes',
        href: '/google-ads/analytics?reportType=weekly-significant-changes',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Weekly significant changes tracking',
      },
      {
        name: 'Daily Trends',
        href: '/google-ads/analytics?reportType=daily-trends',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        description: 'Account daily trends analysis',
      },
      {
        name: 'Weekly Search Terms',
        href: '/google-ads/analytics?reportType=weekly-search-terms',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        ),
        description:
          'Weekly search terms with cost and conversions data (LAST_14_DAYS)',
      },
      {
        name: 'New Keywords',
        href: '/google-ads/analytics?reportType=new-keywords',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        ),
        description: 'New keywords analysis and recommendations',
      },
    ],
  },
  {
    title: 'FULL AUDIT',
    items: [
      {
        name: 'Campaign Structure Overview',
        href: '/google-ads/analytics?reportType=campaign-structure-overview',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        ),
        description: 'Campaign structure overview and analysis',
      },
      {
        name: 'Search Term Analysis',
        href: '/google-ads/analytics?reportType=search-term-analysis',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        ),
        description: 'Search term analysis and insights',
      },
      {
        name: 'Keyword Match Type Mix',
        href: '/google-ads/analytics?reportType=keyword-match-type-mix',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
        ),
        description: 'Keyword match type analysis',
      },
      {
        name: 'Performance by Network',
        href: '/google-ads/analytics?reportType=performance-by-network',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        ),
        description: 'Performance analysis by network',
      },
      {
        name: 'Landing Page Performance',
        href: '/google-ads/analytics?reportType=landing-page-performance',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        description: 'Landing page performance analysis',
      },
      {
        name: 'Ad Group Theming',
        href: '/google-ads/analytics?reportType=ad-group-theming',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        ),
        description: 'Ad group theming and organization',
      },
      {
        name: 'Geo Hot/Cold Performance',
        href: '/google-ads/analytics?reportType=geo-hot-cold',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
        ),
        description: 'Geographic performance analysis',
      },
      {
        name: 'Change History Summary',
        href: '/google-ads/analytics?reportType=change-history-summary',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Account change history summary',
      },
      {
        name: 'Conversion Action Setup',
        href: '/google-ads/analytics?reportType=conversion-action-setup',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Conversion action setup and tracking',
      },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      {
        name: 'Query & Keyword Miner',
        href: '/toolkits/keyword-miner',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        ),
        description: 'Discover and analyze keywords',
      },
      {
        name: 'Ad Copy Lab',
        href: '/toolkits/ad-copy-lab',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        ),
        description: 'Create and test ad copy variations',
      },
      {
        name: 'Budget Simulator',
        href: '/toolkits/budget-simulator',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
            />
          </svg>
        ),
        description: 'Simulate budget scenarios and outcomes',
      },
      {
        name: 'Asset Performance',
        href: '/toolkits/asset-performance-matrix',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        ),
        description: 'Analyze asset performance metrics',
      },
      {
        name: 'Audience Analyzer',
        href: '/toolkits/audience-analyzer',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        ),
        description:
          'Audience segmentation by demographics, interests and behavior',
      },
      {
        name: 'Custom Reporting Builder',
        href: '/toolkits/custom-reporting-builder',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />{' '}
          </svg>
        ),
        description: 'Create custom reports for your Google Ads account',
      },
      {
        name: 'ROI Arena',
        href: '/toolkits/roi-arena',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />{' '}
          </svg>
        ),
        description: 'Weekly challenges and leaderboard for ROI optimization',
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        ),
        description:
          'Account management, subscription details, and notification preferences.',
      },
    ],
  },
  {
    title: 'INFO',
    items: [
      {
        name: 'Benefits',
        href: '/benefits',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        ),
        description: 'Learn about the benefits of using ROAS Dog',
      },
      {
        name: 'FAQ',
        href: '/faq',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Frequently asked questions',
      },
      {
        name: 'Contact',
        href: '/contact',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        ),
        description: 'Get in touch with our team',
      },
      {
        name: 'Policy',
        href: '/policy',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        description: 'Privacy policy and terms of service',
      },
      {
        name: 'Cases',
        href: '/cases',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        ),
        description: 'Real case studies and results from our clients',
      },
      {
        name: 'Common Mistakes',
        href: '/common-mistakes',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        description: 'Common Google Ads mistakes that waste budget',
      },
      {
        name: 'Optimization Guide',
        href: '/optimization-guide',
        icon: (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        ),
        description: 'Step-by-step guide to optimize your Google Ads account',
      },
    ],
  },
]

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ isCollapsed, onToggle, isOnboardingMode = false }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [hasPremium, setHasPremium] = useState(false)
  const { selectedAccountId, accounts, isConnected } = useGoogleAds()
  const { user } = useUser()
  
  // Tooltip state
  const [showUnlockTooltip, setShowUnlockTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [isHoveringElement, setIsHoveringElement] = useState(false)
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<{ item: SidebarItem; sectionTitle: string } | null>(null)

  useEffect(() => {
    if (user?.id) {
      hasPremiumAccess(user.id)
        .then(setHasPremium)
        .catch((error) => {
          console.error('Error checking premium access:', error)
          setHasPremium(false)
        })
    }
  }, [user?.id])

  const toggleSubmenu = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((name) => name !== itemName)
        : [...prev, itemName],
    )
  }

  // Helper function to check if an item should be disabled in onboarding mode
  const isDisabledInOnboarding = (item: SidebarItem) => {
    if (!isOnboardingMode) return false
    
    // Only allow "Audit" menu item during onboarding
    return item.name !== 'Audit'
  }

  // Helper function to check if an item should be disabled when user has no Google Ads accounts
  const isDisabledNoAccounts = (item: SidebarItem, sectionTitle: string) => {
    // Only apply this restriction when user is connected but has no accounts
    if (!(isConnected && accounts.length === 0)) return false
    
    // Allow all items from INFO section
    return sectionTitle !== 'INFO'
  }

  // Helper function to get tooltip text for disabled items
  const getDisabledTooltip = (item: SidebarItem, sectionTitle?: string) => {
    // Check if disabled due to no Google Ads accounts
    if (isConnected && accounts.length === 0 && sectionTitle !== 'INFO') {
      return "Connect a Google account with Google Ads access to unlock this feature."
    }
    
    if (item.name === 'Dashboard') {
      return "Your audit is running! The Dashboard will unlock once it's complete."
    }
    if (item.isPro) {
      return "Activate your trial after the audit to unlock the Toolkits."
    }
    return "This feature will unlock after your audit is complete."
  }

  // Handle hover on locked items
  const handleLockedItemHover = (event: React.MouseEvent, item: SidebarItem, sectionTitle?: string) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: rect.right + 5, // Reduced from 10px to 5px for closer positioning
      y: rect.top + rect.height / 2
    })
    
    setHoveredItem({ item, sectionTitle: sectionTitle || '' })
    setIsHoveringElement(true)
    setShowUnlockTooltip(true)
  }

  const handleLockedItemLeave = () => {
    setIsHoveringElement(false)
  }

  // Handle tooltip hover to keep it visible
  const handleTooltipEnter = () => {
    setIsHoveringTooltip(true)
  }

  const handleTooltipLeave = () => {
    setIsHoveringTooltip(false)
  }

  // Handle unlock button click
  const handleUnlockClick = () => {
    setShowUnlockTooltip(false)
    setIsHoveringElement(false)
    setIsHoveringTooltip(false)
    setHoveredItem(null)
    router.push('/message')
  }

  // Hide tooltip when cursor leaves both element and tooltip
  useEffect(() => {
    if (!isHoveringElement && !isHoveringTooltip && showUnlockTooltip) {
      setShowUnlockTooltip(false)
      setHoveredItem(null)
    }
  }, [isHoveringElement, isHoveringTooltip, showUnlockTooltip])

  // Handle click outside tooltip and Escape key to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUnlockTooltip) {
        // Check if click is outside the tooltip and sidebar area
        const target = event.target as Element
        const isInSidebar = target.closest('aside')
        const isInTooltip = target.closest('.fixed.z-50') // Tooltip container
        
        if (!isInSidebar && !isInTooltip) {
          setShowUnlockTooltip(false)
          setIsHoveringElement(false)
          setIsHoveringTooltip(false)
          setHoveredItem(null)
        }
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showUnlockTooltip) {
        setShowUnlockTooltip(false)
        setIsHoveringElement(false)
        setIsHoveringTooltip(false)
        setHoveredItem(null)
      }
    }

    if (showUnlockTooltip) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showUnlockTooltip])


  const isActive = (url: string) => {
    // Handle dashboard specifically
    if (url === '/dashboard') {
      return pathname === '/dashboard'
    }

    // For analytics pages, compare reportType parameters (ignore accountId)
    if (
      url.includes('/google-ads/analytics') &&
      pathname.includes('/google-ads/analytics')
    ) {
      const urlReportType = url.match(/reportType=([^&]+)/)?.[1]
      const currentReportType = searchParams.get('reportType')

      // If both have reportType, compare them
      if (urlReportType && currentReportType) {
        return urlReportType === currentReportType
      }

      // If URL has reportType but current doesn't, it's not active
      if (urlReportType && !currentReportType) {
        return false
      }
    }

    // For AI analysis pages, compare timeRange parameters (ignore accountId)
    if (
      url.includes('/google-ads/ai-analysis') &&
      pathname.includes('/google-ads/ai-analysis')
    ) {
      const urlTimeRange = url.match(/timeRange=([^&]+)/)?.[1]
      const currentTimeRange = searchParams.get('timeRange')

      // If both have timeRange, compare them
      if (urlTimeRange && currentTimeRange) {
        return urlTimeRange === currentTimeRange
      }

      // If URL has timeRange but current doesn't, it's not active
      if (urlTimeRange && !currentTimeRange) {
        return false
      }
    }

    // For other pages, check if pathname starts with the URL
    return pathname.startsWith(url)
  }

  // Function to build URL with accountId if needed
  const buildUrl = (baseUrl: string) => {
    if (!selectedAccountId) {
      return baseUrl
    }

    // For Google Ads related pages, add accountId
    if (
      baseUrl.includes('/google-ads/') ||
      baseUrl.includes('/data-explorer/')
    ) {
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}accountId=${selectedAccountId}`
    }

    return baseUrl
  }

  /*
   * Function to build time range URL for current page
   * Removed Time Range related functions as they are no longer needed
   */

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 overflow-hidden transition-transform duration-300 ${
          isCollapsed ? 'lg:translate-x-0 -translate-x-full' : 'translate-x-0'
        }`}
        style={{
          background: '#1a1a1a',
          borderRight: '1px solid #333333',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="space-y-8 mt-6">
              {sidebarSections.map((section, sectionIndex) => (
                <div key={sectionIndex}>
                  {!isCollapsed && (
                    <div className="mb-4">
                      <h3
                        className="text-[14px] font-extrabold uppercase tracking-wider px-6 py-3"
                        style={{ color: '#ffffff', letterSpacing: '0.05em' }}
                      >
                        {section.title}
                      </h3>
                    </div>
                  )}
                  <ul className="space-y-1">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <div className="relative">
                          {item.submenu ? (
                            isDisabledInOnboarding(item) || isDisabledNoAccounts(item, section.title) ? (
                              <div
                                className={`w-full flex items-center py-3 px-6 transition-all duration-200 group relative cursor-pointer ${
                                  'text-gray-600 opacity-50 hover:opacity-70'
                                }`}
                                style={{
                                  backgroundColor: 'transparent',
                                  borderRight: '4px solid transparent',
                                  borderLeft: '2px solid transparent',
                                }}
                                onMouseEnter={(e) => handleLockedItemHover(e, item, section.title)}
                                onMouseLeave={handleLockedItemLeave}
                              >
                                <div className="mr-3 flex-shrink-0 text-gray-600">
                                  {item.icon}
                                </div>
                                {!isCollapsed && (
                                  <>
                                    <span className="font-medium flex-1">
                                      {item.name}
                                    </span>
                                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full ml-2">
                                      PRO
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleSubmenu(item.name)}
                                className={`w-full flex items-center py-3 px-6 transition-all duration-200 group relative ${
                                  isActive(item.href)
                                    ? 'text-white font-semibold'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                                style={{
                                  backgroundColor: isActive(item.href)
                                    ? '#3a3a3a'
                                    : 'transparent',
                                  borderRight: isActive(item.href)
                                    ? '4px solid #3b82f6'
                                    : '4px solid transparent',
                                  borderLeft: isActive(item.href)
                                    ? '2px solid #3b82f6'
                                    : '2px solid transparent',
                                }}
                                onMouseEnter={(e) => {
                                  if (!isActive(item.href)) {
                                    e.currentTarget.style.backgroundColor =
                                      '#2a2a2a'
                                    e.currentTarget.style.borderRight =
                                      '4px solid #6b7280'
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isActive(item.href)) {
                                    e.currentTarget.style.backgroundColor =
                                      'transparent'
                                    e.currentTarget.style.borderRight =
                                      '4px solid transparent'
                                  }
                                }}
                              >
                                <div
                                  className={`mr-3 flex-shrink-0 ${
                                    isActive(item.href) ? 'text-blue-400' : ''
                                  }`}
                                >
                                  {item.icon}
                                </div>
                                {!isCollapsed && (
                                  <>
                                    <span className="font-medium flex-1">
                                      {item.name}
                                    </span>
                                    <span className="text-xs bg-black text-white px-2 py-1 rounded-full ml-2">
                                      PRO
                                    </span>
                                  </>
                                )}
                              </button>
                            )
                          ) : item.isPro && !hasPremium ? (
                            <div
                              className="flex items-center py-3 px-6 transition-all duration-200 group cursor-pointer relative"
                              style={{
                                backgroundColor: 'transparent',
                                borderRight: '4px solid transparent',
                                borderLeft: '2px solid transparent',
                              }}
                              onMouseEnter={(e) => handleLockedItemHover(e, item)}
                              onMouseLeave={handleLockedItemLeave}
                            >
                              <div className="mr-3 flex-shrink-0">
                                {item.icon}
                              </div>
                              {!isCollapsed && (
                                <>
                                  <span className="font-medium flex-1">
                                    {item.name}
                                  </span>
                                  <span className="text-xs bg-black text-white px-2 py-1 rounded-full ml-2">
                                    PRO
                                  </span>
                                </>
                              )}
                            </div>
                          ) : isDisabledInOnboarding(item) || isDisabledNoAccounts(item, section.title) ? (
                            <div
                              className={`flex items-center py-3 px-6 transition-all duration-200 group relative cursor-pointer ${
                                'text-gray-600 opacity-50 hover:opacity-70'
                              }`}
                              style={{
                                backgroundColor: 'transparent',
                                borderRight: '4px solid transparent',
                                borderLeft: '2px solid transparent',
                              }}
                              onMouseEnter={(e) => handleLockedItemHover(e, item)}
                              onMouseLeave={handleLockedItemLeave}
                            >
                              <div className="mr-3 flex-shrink-0 text-gray-600">
                                {item.icon}
                              </div>
                              {!isCollapsed && (
                                <>
                                  <span className="font-medium flex-1">
                                    {item.name}
                                  </span>
                                  {item.isPro && (
                                    <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full ml-2">
                                      PRO
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            <Link
                              href={buildUrl(item.href)}
                              className={`flex items-center py-3 px-6 transition-all duration-200 group relative ${
                                isActive(item.href)
                                  ? 'text-white font-semibold'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                              style={{
                                backgroundColor: isActive(item.href)
                                  ? '#3a3a3a'
                                  : 'transparent',
                                borderRight: isActive(item.href)
                                  ? '4px solid #3b82f6'
                                  : '4px solid transparent',
                                borderLeft: isActive(item.href)
                                  ? '2px solid #3b82f6'
                                  : '2px solid transparent',
                              }}
                              onMouseEnter={(e) => {
                                if (!isActive(item.href)) {
                                  e.currentTarget.style.backgroundColor =
                                    '#2a2a2a'
                                  e.currentTarget.style.borderRight =
                                    '4px solid #6b7280'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isActive(item.href)) {
                                  e.currentTarget.style.backgroundColor =
                                    'transparent'
                                  e.currentTarget.style.borderRight =
                                    '4px solid transparent'
                                }
                              }}
                            >
                              <div
                                className={`mr-3 flex-shrink-0 ${
                                  isActive(item.href) ? 'text-blue-400' : ''
                                }`}
                              >
                                {item.icon}
                              </div>
                              {!isCollapsed && (
                                <>
                                  <span className="font-medium flex-1">
                                    {item.name}
                                  </span>
                                  {item.isPro && (
                                    <span className="text-xs bg-black text-white px-2 py-1 rounded-full ml-2">
                                      PRO
                                    </span>
                                  )}
                                </>
                              )}
                            </Link>
                          )}

                          {/* Tooltip for collapsed state */}
                          {isCollapsed && (
                            <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                              {item.name}
                              {item.isPro && (
                                <span className="ml-2 text-xs bg-black text-white px-1 py-0.5 rounded">
                                  {!hasPremium ? 'PRO REQUIRED' : 'PRO'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submenu */}
                        {item.submenu &&
                          !isCollapsed &&
                          expandedItems.includes(item.name) && (
                            <motion.ul
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="ml-8 mt-2 space-y-1"
                            >
                              {item.submenu.map((subItem, subIndex) => {
                                return (
                                  <li key={subIndex}>
                                    <Link
                                      href={buildUrl(subItem.href)}
                                      className={`flex items-center py-2 px-6 transition-all duration-200 text-sm relative ${
                                        isActive(subItem.href)
                                          ? 'text-white font-medium'
                                          : 'text-gray-400 hover:text-white'
                                      }`}
                                      style={{
                                        backgroundColor: isActive(subItem.href)
                                          ? '#3a3a3a'
                                          : 'transparent',
                                        borderRight: isActive(subItem.href)
                                          ? '3px solid #3b82f6'
                                          : '3px solid transparent',
                                        borderLeft: isActive(subItem.href)
                                          ? '1px solid #3b82f6'
                                          : '1px solid transparent',
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isActive(subItem.href)) {
                                          e.currentTarget.style.backgroundColor =
                                            '#2a2a2a'
                                          e.currentTarget.style.borderRight =
                                            '3px solid #6b7280'
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isActive(subItem.href)) {
                                          e.currentTarget.style.backgroundColor =
                                            'transparent'
                                          e.currentTarget.style.borderRight =
                                            '3px solid transparent'
                                        }
                                      }}
                                    >
                                      <div
                                        className="mr-2"
                                        style={{
                                          width: '20px',
                                          textAlign: 'center',
                                        }}
                                      >
                                        {subItem.icon}
                                      </div>
                                      <span>{subItem.name}</span>
                                    </Link>
                                  </li>
                                )
                              })}
                            </motion.ul>
                          )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Description for current item */}
          {!isCollapsed &&
            (() => {
              // Check if there's any active item with description
              const activeItemWithDescription = sidebarSections
                .flatMap((section) => section.items)
                .find((item) => isActive(item.href) && item.description)

              if (!activeItemWithDescription) {
                return null
              }

              return (
                <div className="p-4" style={{ borderTop: '1px solid #333333' }}>
                  <motion.div
                    key={activeItemWithDescription.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-400 leading-relaxed"
                  >
                    {activeItemWithDescription.description}
                  </motion.div>
                </div>
              )
            })()}
        </div>
      </motion.aside>

      {/* Unlock Tooltip */}
      {showUnlockTooltip && (
        <>
          {/* Invisible bridge to prevent tooltip from disappearing */}
          <div
            className="fixed z-40"
            style={{
              left: tooltipPosition.x - 10, // Bridge from sidebar edge to tooltip
              top: tooltipPosition.y - 60,  // Cover vertical tooltip area
              width: 20, // Bridge width (reduced since tooltip is closer)
              height: 120, // Bridge height to cover tooltip area
            }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          />
          
          <motion.div
            className="fixed z-50 bg-gray-800 text-white px-3 py-2 rounded-lg shadow-xl max-w-xs"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 50,
              transform: 'translateY(-50%)'
            }}
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onMouseEnter={handleTooltipEnter}
            onMouseLeave={handleTooltipLeave}
          >
          {hoveredItem && isConnected && accounts.length === 0 && hoveredItem.sectionTitle !== 'INFO' ? (
            // Special tooltip for no Google Ads accounts
            <>
              <div className="text-sm font-medium mb-2 flex items-center">
                <span className="mr-2">⚠️</span>
                <span>No Google Ads Access</span>
              </div>
              <div className="text-xs text-gray-300 mb-3 leading-relaxed">
                {getDisabledTooltip(hoveredItem.item, hoveredItem.sectionTitle)}
              </div>
            </>
          ) : (
            // Default premium unlock tooltip
            <>
              <div className="text-sm font-medium mb-2 flex items-center">
                <span className="mr-2">🔒</span>
                <span>Unlock Premium Features</span>
              </div>
              <div className="text-xs text-gray-300 mb-3 leading-relaxed">
                {hoveredItem ? getDisabledTooltip(hoveredItem.item, hoveredItem.sectionTitle) : 'Get access to all tools and advanced analytics'}
              </div>
              <button
                onClick={handleUnlockClick}
                className="w-full bg-black text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-800 transition-all duration-200 transform hover:scale-105"
              >
                Unlock Now
              </button>
            </>
          )}
          
          {/* Tooltip arrow */}
          <div 
            className="absolute top-1/2 left-0 transform -translate-x-full -translate-y-1/2"
            style={{
              width: 0,
              height: 0,
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '6px solid #374151' // bg-gray-800
            }}
          />
        </motion.div>
        </>
      )}
    </>
  )
}
