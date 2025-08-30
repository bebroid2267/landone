'use client'

import { useState, useEffect } from 'react'

import { useToast } from '@/components/ui/Toast/ToastContext'
import { useRouter } from 'next/navigation'
import CustomSelect from './CustomSelect'

// Type definitions for API responses
interface ConversionTimingData {
  dayOfWeek: {
    monday: number
    tuesday: number
    wednesday: number
    thursday: number
    friday: number
    saturday: number
    sunday: number
  }
  hourOfDay: Record<string, number>
  campaignShare: Record<
    string,
    { name: string; conversions: number; share: number }
  >
}

interface ConversionActionInventory {
  actions: {
    name: string
    status: string
    type: string
    volume: number
  }[]
}

interface RoasByDeviceGeography {
  data: {
    device: string
    countries: Record<
      string,
      { roas: number; cost: number; conversions: number }
    >
  }[]
}

interface NegativeKeywordsGaps {
  newIrrelevantTerms: {
    count: number
    sinceDate: string
    percentage: number
  }
  highSpendPlacements: {
    placement: string
    cost: number
    ctr: number
  }[]
}

interface ZeroConversionKeywords {
  keywords: {
    text: string
    matchType: string
    adGroup: string
    campaign: string
    cost: number
    clicks: number
    impressions: number
  }[]
}

interface SearchTermCoverage {
  coverage: {
    exact: { impressions: number; cost: number; share: number }
    phrase: { impressions: number; cost: number; share: number }
    broad: { impressions: number; cost: number; share: number }
  }
  topTerms: {
    term: string
    cost: number
    impressions: number
    clicks: number
  }[]
}

// Additional type definition for campaigns
interface Campaign {
  id: string
  name: string
  status: string
  channelType: string
  metrics: {
    clicks: number
    impressions: number
    ctr: number
    costMicros: number
    averageCpc: number
  }
}

// Add new interface for Ads & Assets data
interface AdsAssetsData {
  activeAssets: {
    id: string
    name: string
    type: string
    status: string
    metrics: {
      impressions: number
      clicks: number
      ctr: number
      conversions: number
      costMicros: number
    }
  }[]
  adGroups: {
    id: string
    name: string
    status: string
    cpc: number
    metrics: {
      impressions: number
      clicks: number
      ctr: number
      conversions: number
      costMicros: number
    }
  }[]
  adMetrics: {
    enabledAds: number
    disapprovedAds: number
    limitedAds: number
    activeAds: number
    totalAds: number
  }
}

// Define a type for the tabs to avoid any type errors
type TabName = 'conversions' | 'keywords' | 'campaign' | 'ads'

// Props interface
interface GoogleAdsAnalyticsProps {
  selectedAccountId: string
  accessToken: string
}

export default function GoogleAdsAnalytics({
  selectedAccountId = '',
  accessToken = '',
}: GoogleAdsAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<TabName>('conversions')
  const [timeRange, setTimeRange] = useState<string>('180days')
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('')
  const [availableCampaigns, setAvailableCampaigns] = useState<Campaign[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  // Data states
  const [conversionTiming, setConversionTiming] =
    useState<ConversionTimingData | null>(null)
  const [conversionInventory, setConversionInventory] =
    useState<ConversionActionInventory | null>(null)
  const [roasByGeography, setRoasByGeography] =
    useState<RoasByDeviceGeography | null>(null)
  const [negativeKeywords, setNegativeKeywords] =
    useState<NegativeKeywordsGaps | null>(null)
  const [zeroConvKeywords, setZeroConvKeywords] =
    useState<ZeroConversionKeywords | null>(null)
  const [searchTermCoverage, setSearchTermCoverage] =
    useState<SearchTermCoverage | null>(null)
  const [adsAssetsData, setAdsAssetsData] = useState<AdsAssetsData | null>(null)

  // UI states - use Record with the TabName type
  const [isLoading, setIsLoading] = useState<Record<TabName, boolean>>({
    conversions: false,
    keywords: false,
    campaign: false,
    ads: false,
  })
  const [errors, setErrors] = useState<Record<TabName, string | null>>({
    conversions: null,
    keywords: null,
    campaign: null,
    ads: null,
  })

  const { showToast } = useToast()

  // Load campaigns for the selected account
  useEffect(() => {
    if (!selectedAccountId || !accessToken) {
      return
    }

    const loadCampaigns = async () => {
      try {
        setIsLoading((prev) => ({ ...prev, campaign: true }))
        setErrors((prev) => ({ ...prev, campaign: null }))

        // Fetch all available campaigns
        const response = await fetch('/api/google-ads/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: selectedAccountId,
            accessToken,
          }),
        })

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              'Authentication required. Please log in to access Google Ads data.',
            )
          }
          throw new Error('Failed to fetch campaigns')
        }

        const data = (await response.json()) as Campaign[]
        const campaigns = data

        // Type check the campaigns data
        if (Array.isArray(campaigns)) {
          setAvailableCampaigns(campaigns)

          /*
           * Select the first campaign by default if none is selected and
           * campaigns are available
           */
          if (campaigns.length > 0 && selectedCampaignId === '') {
            setSelectedCampaignId(campaigns[0]?.id ?? '')
          }
        } else {
          throw new Error('Invalid campaign data received')
        }
      } catch (error) {
        console.error('Error loading campaigns:', error)
        setErrors((prev) => ({
          ...prev,
          campaign:
            error instanceof Error ? error.message : 'Failed to load campaigns',
        }))
        showToast('Failed to load campaigns', 'error')
      } finally {
        setIsLoading((prev) => ({
          ...prev,
          campaign: false,
        }))
      }
    }

    void loadCampaigns()
  }, [selectedAccountId, accessToken, showToast, selectedCampaignId])

  // Load data based on active tab
  useEffect(() => {
    if (!selectedAccountId || !accessToken) {
      return
    }

    const loadTabData = async () => {
      try {
        if (activeTab === 'conversions') {
          setIsLoading((prev) => ({ ...prev, conversions: true }))
          setErrors((prev) => ({ ...prev, conversions: null }))

          // Fetch conversion timing data
          const timingResponse = await fetch(
            '/api/google-ads/conversion-timing',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
              }),
            },
          )

          if (!timingResponse.ok) {
            throw new Error('Failed to fetch conversion timing')
          }

          const timingData =
            (await timingResponse.json()) as ConversionTimingData
          setConversionTiming(timingData)

          // Fetch conversion inventory data
          const inventoryResponse = await fetch(
            '/api/google-ads/conversion-action-inventory',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
                timeRange,
                campaignId: selectedCampaignId,
              }),
            },
          )

          if (!inventoryResponse.ok) {
            throw new Error('Failed to fetch conversion inventory')
          }

          const inventoryData =
            (await inventoryResponse.json()) as ConversionActionInventory
          setConversionInventory(inventoryData)

          // Fetch ROAS by geography data
          const roasResponse = await fetch(
            '/api/google-ads/roas-by-device-geography',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
                timeRange,
                campaignId: selectedCampaignId,
              }),
            },
          )

          if (!roasResponse.ok) {
            throw new Error('Failed to fetch ROAS data')
          }

          const roasData = (await roasResponse.json()) as RoasByDeviceGeography
          setRoasByGeography(roasData)

          // Fetch negative keywords gaps
          const negativeResponse = await fetch(
            '/api/google-ads/negative-keywords-gaps',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
                timeRange,
                campaignId: selectedCampaignId,
              }),
            },
          )

          if (!negativeResponse.ok) {
            throw new Error('Failed to fetch negative keywords')
          }

          const negativeData =
            (await negativeResponse.json()) as NegativeKeywordsGaps
          setNegativeKeywords(negativeData)
        } else if (activeTab === 'keywords') {
          setIsLoading((prev) => ({ ...prev, keywords: true }))
          setErrors((prev) => ({ ...prev, keywords: null }))

          // Fetch zero conversion keywords
          const zeroConvResponse = await fetch(
            '/api/google-ads/zero-conversion-keywords',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
              }),
            },
          )

          if (!zeroConvResponse.ok) {
            throw new Error('Failed to fetch zero conversion keywords')
          }

          const zeroConvData =
            (await zeroConvResponse.json()) as ZeroConversionKeywords
          setZeroConvKeywords(zeroConvData)

          // Fetch search term coverage
          const coverageResponse = await fetch(
            '/api/google-ads/search-term-coverage',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                accountId: selectedAccountId,
                accessToken,
                timeRange,
                campaignId: selectedCampaignId,
              }),
            },
          )

          if (!coverageResponse.ok) {
            throw new Error('Failed to fetch search term coverage')
          }

          const coverageData =
            (await coverageResponse.json()) as SearchTermCoverage
          setSearchTermCoverage(coverageData)
        } else if (activeTab === 'ads') {
          setIsLoading((prev) => ({ ...prev, ads: true }))
          setErrors((prev) => ({ ...prev, ads: null }))

          // Fetch ads and assets data
          const adsResponse = await fetch('/api/google-ads/ads-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId: selectedAccountId,
              accessToken,
              timeRange,
              campaignId: selectedCampaignId,
            }),
          })

          if (!adsResponse.ok) {
            throw new Error('Failed to fetch ads and assets data')
          }

          const adsData = (await adsResponse.json()) as AdsAssetsData
          setAdsAssetsData(adsData)
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error)
        setErrors((prev) => ({
          ...prev,
          [activeTab]:
            error instanceof Error ? error.message : 'Failed to load data',
        }))
        showToast(`Failed to load ${activeTab} data`, 'error')
      } finally {
        setIsLoading((prev) => ({
          ...prev,
          [activeTab]: false,
        }))
      }
    }

    void loadTabData()
  }, [
    activeTab,
    selectedAccountId,
    accessToken,
    timeRange,
    selectedCampaignId,
    showToast,
  ])

  // Get campaign share values from API or create empty object
  const campaignShareValues = conversionTiming?.campaignShare ?? {}

  // Handle export report button click
  const handleExportReport = () => {
    // Show loading state
    setIsExporting(true)

    // Convert timeRange to Google Ads format
    let formattedTimeRange = '180days'
    if (timeRange === '7days') {
      formattedTimeRange = 'LAST_7_DAYS'
    } else if (timeRange === 'alltime') {
      formattedTimeRange = 'ALL_TIME'
    }

    // Close any open modals first
    if (typeof window !== 'undefined') {
      const modals = document.querySelectorAll('[id^="google-ads-modal"]')
      modals.forEach((modal) => {
        const closeButton = modal.querySelector('button[aria-label="Close"]')
        if (closeButton) {
          ;(closeButton as HTMLButtonElement).click()
        }
      })
    }

    // Add a small delay before navigation to ensure modal closes smoothly
    setTimeout(() => {
      // Navigate to AI analysis page with parameters
      router.push(
        `/google-ads/ai-analysis?timeRange=${formattedTimeRange}${
          selectedCampaignId ? `&campaignId=${selectedCampaignId}` : ''
        }&accountId=${selectedAccountId}`,
      )
    }, 100)
  }

  return (
    <div className="bg-white">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-black">
            {selectedAccountId
              ? `Account ${selectedAccountId} - Google Ads Analysis`
              : 'Google Ads Analysis'}
          </h1>
          <p className="text-gray-600">
            Last{' '}
            {timeRange === '180days'
               ? '180'
               : timeRange === '90days'
               ? '90'
               : '7'}{' '}
            Days
          </p>
        </div>
        <div className="flex gap-2">
          {/* Фильтры и кнопки */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4 w-full max-w-full">
            <CustomSelect
              options={[
                { value: '', label: 'All Campaigns' },
                ...availableCampaigns.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.channelType})`,
                })),
              ]}
              value={selectedCampaignId}
              onChange={setSelectedCampaignId}
              placeholder="Select campaign..."
              className="mb-2 sm:mb-0"
            />
            <CustomSelect
              options={[
                { value: '7days', label: 'Last 7 Days' },
                { value: '180days', label: 'Last 180 Days' },
              ]}
              value={timeRange}
              onChange={setTimeRange}
              placeholder="Select time range..."
              className="mb-2 sm:mb-0 sm:w-auto"
            />
            <button
              className="px-2 py-2 sm:px-4 sm:py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors text-xs sm:text-sm w-full sm:w-auto"
              onClick={handleExportReport}
              disabled={isExporting}
            >
              {isExporting
                ? 'Exporting...'
                : timeRange === '7days'
                ? 'Weekly Report'
                : 'Export Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Error for campaign loading */}
      {errors.campaign && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="font-medium">Error loading campaigns</p>
          <p className="text-sm mt-1">{errors.campaign}</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mb-8 border-b border-gray-200 overflow-x-auto">
        <nav className="flex flex-nowrap space-x-4 sm:space-x-8 text-xs sm:text-base min-w-[340px]">
          <button
            className={`px-2 py-2 sm:px-1 sm:py-4 whitespace-nowrap ${
              activeTab === 'conversions'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600'
            } font-medium`}
            onClick={() => setActiveTab('conversions')}
          >
            Conversions
          </button>
          <button
            className={`px-2 py-2 sm:px-1 sm:py-4 whitespace-nowrap ${
              activeTab === 'keywords'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600'
            } font-medium`}
            onClick={() => setActiveTab('keywords')}
          >
            Keywords & Search Terms
          </button>
          <button
            className={`px-2 py-2 sm:px-1 sm:py-4 whitespace-nowrap ${
              activeTab === 'ads'
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600'
            } font-medium`}
            onClick={() => setActiveTab('ads')}
          >
            Ads & Assets
          </button>
        </nav>
      </div>

      {/* Error display */}
      {errors[activeTab] && (
        <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-md text-red-800">
          <p className="font-medium">Error loading data</p>
          <p className="text-sm mt-1">{errors[activeTab]}</p>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading[activeTab] && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-900 border-t-transparent"></div>
          <span className="ml-3 text-gray-700">
            Loading {activeTab} data...
          </span>
        </div>
      )}

      {/* Conversions Tab Content */}
      {activeTab === 'conversions' &&
        !isLoading.conversions &&
        !errors.conversions && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Timing Distribution */}
            <div className="bg-white rounded-xl p-3 sm:p-6 shadow-lg border border-gray-200 text-xs sm:text-base">
              <h2 className="text-lg sm:text-xl font-semibold text-black mb-2 sm:mb-4">
                Conversion Timing Distribution
              </h2>

              {/* Campaign Share Chart */}
              <div className="h-64 w-full overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600 font-medium">
                        Campaign
                      </th>
                      <th className="text-right py-2 text-gray-600 font-medium">
                        Conversions
                      </th>
                      <th className="text-right py-2 text-gray-600 font-medium">
                        Share
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(campaignShareValues).length > 0 ? (
                      Object.values(campaignShareValues)
                        .sort((a, b) => b.conversions - a.conversions)
                        .map((campaign, index) => (
                          <tr key={index} className="border-b border-gray-200">
                            <td className="py-3 text-black">{campaign.name}</td>
                            <td className="py-3 text-right text-black">
                              {campaign.conversions}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end">
                                <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden mr-2">
                                  <div
                                    className="h-full bg-black"
                                    style={{ width: `${campaign.share}%` }}
                                  ></div>
                                </div>
                                <span className="text-gray-700">
                                  {campaign.share}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="py-4 text-center text-gray-500"
                        >
                          No campaign data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conversion Action Inventory */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">
                Conversion Action Inventory
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-600 font-medium">
                        Conversion Action
                      </th>
                      <th className="text-left py-2 text-gray-600 font-medium">
                        Status
                      </th>
                      <th className="text-left py-2 text-gray-600 font-medium">
                        Type
                      </th>
                      <th className="text-right py-2 text-gray-600 font-medium">
                        Volume
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversionInventory?.actions?.map((action, index) => (
                      <tr
                        key={index}
                        className={
                          index < conversionInventory.actions.length - 1
                            ? 'border-b border-gray-200'
                            : ''
                        }
                      >
                        <td className="py-3 text-black">{action.name}</td>
                        <td className="py-3">
                          <span className="flex items-center">
                            <span
                              className={`w-2 h-2 ${
                                action.status === 'Active'
                                  ? 'bg-black'
                                  : 'bg-gray-500'
                              } rounded-full mr-2`}
                            ></span>
                            <span className="text-gray-700">
                              {action.status}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 text-gray-700">{action.type}</td>
                        <td className="py-3 text-right text-black">
                          {action.volume}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {conversionInventory?.actions?.some(
                (a) => a.status === 'Inactive' && a.volume < 10,
              ) && (
                <div className="mt-4 bg-gray-100 border-l-4 border-gray-400 px-4 py-3 text-sm text-gray-700">
                  Alert: Some inactive conversion actions have very low volume.
                </div>
              )}
            </div>

            {/* ROAS by Device & Geography */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">
                ROAS by Device & Geography
              </h2>

              <div className="mb-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 text-gray-600 font-medium">
                        Device
                      </th>
                      {roasByGeography?.data?.[0]?.countries &&
                        Object.keys(roasByGeography.data[0].countries).map(
                          (country) => (
                            <th
                              key={country}
                              className="text-center py-2 text-gray-600 font-medium"
                            >
                              {country}
                            </th>
                          ),
                        )}
                    </tr>
                  </thead>
                  <tbody>
                    {roasByGeography?.data?.map((deviceData, index) => (
                      <tr
                        key={deviceData.device}
                        className={
                          index < roasByGeography.data.length - 1
                            ? 'border-b border-gray-200'
                            : ''
                        }
                      >
                        <td className="py-3 text-black">{deviceData.device}</td>
                        {Object.entries(deviceData.countries).map(
                          ([country, data]) => (
                            <td key={country} className="py-3 px-6">
                              <div
                                className={`bg-black/${Math.round(
                                  data.roas * 10,
                                )} text-center py-3 px-4 rounded text-white font-medium`}
                                style={{
                                  opacity: Math.min(
                                    Math.max(data.roas / 5, 0.2),
                                    0.8,
                                  ),
                                }}
                              >
                                {data.roas.toFixed(1)}x
                              </div>
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Negative Keywords & Placement Gaps */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h2 className="text-xl font-semibold text-black mb-4">
                Negative Keywords & Placement Gaps
              </h2>

              <div>
                <h3 className="text-black font-medium mb-3">
                  New Irrelevant Search Terms
                </h3>
                <div className="flex items-center mb-2">
                  <span className="text-2xl font-bold text-black mr-2">
                    {negativeKeywords?.newIrrelevantTerms?.count ?? 0}
                  </span>
                  <span className="text-gray-600">
                    since last audit (
                    {negativeKeywords?.newIrrelevantTerms?.sinceDate ?? 'N/A'})
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black rounded-full"
                    style={{
                      width: `${
                        negativeKeywords?.newIrrelevantTerms?.percentage ?? 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-black font-medium mb-3">
                  High Spend / Low Engagement Placements
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600 font-medium">
                          Placement
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Cost
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          CTR
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {negativeKeywords?.highSpendPlacements?.map(
                        (placement, index) => (
                          <tr
                            key={index}
                            className={
                              index <
                              negativeKeywords.highSpendPlacements.length - 1
                                ? 'border-b border-gray-200'
                                : ''
                            }
                          >
                            <td className="py-2 text-black">
                              {placement.placement}
                            </td>
                            <td className="py-2 text-right text-black">
                              ${placement.cost.toFixed(2)}
                            </td>
                            <td className="py-2 text-right text-gray-600">
                              {(placement.ctr * 100).toFixed(2)}%
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Keywords Tab Content */}
      {activeTab === 'keywords' && !isLoading.keywords && !errors.keywords && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top-Spend, Zero-Conversion Keywords */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Top-Spend, Zero-Conversion Keywords
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Keyword
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium">
                      Cost
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium">
                      Clicks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {zeroConvKeywords?.keywords
                    ?.slice(0, 5)
                    .map((keyword, index) => (
                      <tr
                        key={index}
                        className={index < 4 ? 'border-b border-gray-200' : ''}
                      >
                        <td className="py-3 text-black">{keyword.text}</td>
                        <td className="py-3 text-right text-black">
                          ${keyword.cost.toFixed(2)}
                        </td>
                        <td className="py-3 text-right text-gray-700">
                          {keyword.clicks}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-xs text-gray-600">
              Showing top {Math.min(5, zeroConvKeywords?.keywords?.length ?? 0)}{' '}
              of {zeroConvKeywords?.keywords?.length ?? 0} keywords
            </div>
          </div>

          {/* Search-Term Coverage */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Search-Term Coverage
            </h2>

            <div className="grid gap-6">
              <div>
                <div className="mb-4 flex justify-center">
                  <div className="w-48 h-48 rounded-full overflow-hidden relative">
                    <div
                      className="absolute inset-0 bg-black"
                      style={{
                        clipPath: 'polygon(50% 50%, 100% 0, 100% 70%, 50% 50%)',
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 bg-gray-600"
                      style={{
                        clipPath:
                          'polygon(50% 50%, 100% 70%, 80% 100%, 50% 50%)',
                      }}
                    ></div>
                    <div
                      className="absolute inset-0 bg-gray-400"
                      style={{
                        clipPath:
                          'polygon(50% 50%, 80% 100%, 20% 100%, 50% 50%)',
                      }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-6">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-black mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Exact ({searchTermCoverage?.coverage?.exact?.share ?? 0}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-600 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Phrase (
                        {searchTermCoverage?.coverage?.phrase?.share ?? 0}%)
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-400 mr-2"></div>
                      <span className="text-sm text-gray-600">
                        Broad ({searchTermCoverage?.coverage?.broad?.share ?? 0}
                        %)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-black font-medium mb-3">
                  Top Terms Without Keywords
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-gray-600 font-medium">
                          Term
                        </th>
                        <th className="text-right py-2 text-gray-600 font-medium">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchTermCoverage?.topTerms?.map((term, index) => (
                        <tr
                          key={index}
                          className={
                            index < searchTermCoverage.topTerms.length - 1
                              ? 'border-b border-gray-200'
                              : ''
                          }
                        >
                          <td className="py-3 text-black">{term.term}</td>
                          <td className="py-3 text-right text-black">
                            ${term.cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ads & Assets Tab Content */}
      {activeTab === 'ads' && !isLoading.ads && !errors.ads && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ad Metrics Summary */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Ad Status Overview
            </h2>

            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-black">
                  {adsAssetsData?.adMetrics?.totalAds ?? 0}
                </span>
                <span className="text-gray-600 text-[10px] sm:text-sm">
                  Total Ads
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">
                  {adsAssetsData?.adMetrics?.enabledAds ?? 0}
                </span>
                <span className="text-gray-600 text-[10px] sm:text-sm">
                  Enabled
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-yellow-600">
                  {adsAssetsData?.adMetrics?.limitedAds ?? 0}
                </span>
                <span className="text-gray-600 text-[10px] sm:text-sm">
                  Limited
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-red-600">
                  {adsAssetsData?.adMetrics?.disapprovedAds ?? 0}
                </span>
                <span className="text-gray-600 text-[10px] sm:text-sm">
                  Disapproved
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-blue-600">
                  {adsAssetsData?.adMetrics?.activeAds ?? 0}
                </span>
                <span className="text-gray-600 text-[10px] sm:text-sm">
                  Active
                </span>
              </div>
            </div>

            <h3 className="text-lg font-medium text-black mt-6 mb-3">
              Active Ad Groups
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Ad Group
                    </th>
                    <th className="text-center py-2 text-gray-600 font-medium">
                      Status
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium pr-2 sm:pr-0">
                      Avg. CPC
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium pl-2 sm:pl-0">
                      Clicks
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adsAssetsData?.adGroups?.map((adGroup, index) => (
                    <tr
                      key={adGroup.id}
                      className={
                        index < (adsAssetsData?.adGroups?.length ?? 0) - 1
                          ? 'border-b border-gray-200'
                          : ''
                      }
                    >
                      <td className="py-3 text-black">{adGroup.name}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            adGroup.status === 'ENABLED'
                              ? 'bg-green-100 text-green-800'
                              : adGroup.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {adGroup.status === 'ENABLED'
                            ? 'Enabled'
                            : adGroup.status === 'PAUSED'
                            ? 'Paused'
                            : 'Removed'}
                        </span>
                      </td>
                      <td className="py-3 text-right text-black pr-2 sm:pr-0">
                        ${adGroup.cpc.toFixed(2)}
                      </td>
                      <td className="py-3 text-right text-black pl-2 sm:pl-0">
                        {adGroup.metrics.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assets Overview */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h2 className="text-xl font-semibold text-black mb-4">
              Active Assets
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600 font-medium">
                      Asset
                    </th>
                    <th className="text-center py-2 text-gray-600 font-medium">
                      Type
                    </th>
                    <th className="text-center py-2 text-gray-600 font-medium">
                      Status
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium">
                      Impressions
                    </th>
                    <th className="text-right py-2 text-gray-600 font-medium">
                      Conv.
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {adsAssetsData?.activeAssets?.map((asset, index) => (
                    <tr
                      key={asset.id}
                      className={
                        index < (adsAssetsData?.activeAssets?.length || 0) - 1
                          ? 'border-b border-gray-200'
                          : ''
                      }
                    >
                      <td className="py-3 text-black">{asset.name}</td>
                      <td className="py-3 text-center text-gray-700">
                        {asset.type}
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            asset.status === 'ENABLED'
                              ? 'bg-green-100 text-green-800'
                              : asset.status === 'PAUSED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>
                      <td className="py-3 text-right text-black">
                        {asset.metrics.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-black">
                        {asset.metrics.conversions}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
