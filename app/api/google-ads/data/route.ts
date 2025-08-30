import { NextRequest, NextResponse } from 'next/server'

interface GoogleAdsRequestBody {
  dataType: string
  accessToken?: string
  accountId?: string
  timeRange?: string
  campaignId?: string
}

// This is now a router that redirects to the appropriate endpoint
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GoogleAdsRequestBody
    const { dataType } = body

    if (!dataType) {
      return NextResponse.json(
        { error: 'Data type is required' },
        { status: 400 },
      )
    }

    // Create a URL for the appropriate endpoint
    const url = new URL(req.url)
    const baseUrl = `${url.protocol}//${url.host}/api/google-ads`

    // Map data types to their new routes
    let redirectUrl: string

    switch (dataType) {
      case 'availableCampaigns':
        redirectUrl = `${baseUrl}/campaigns`
        break
      case 'adAssetPerformance':
        redirectUrl = `${baseUrl}/ad-asset-performance`
        break
      case 'adsAssets':
        redirectUrl = `${baseUrl}/ads-assets`
        break
      case 'conversionTiming':
        redirectUrl = `${baseUrl}/conversion-timing`
        break
      case 'zeroConversionKeywords':
        redirectUrl = `${baseUrl}/zero-conversion-keywords`
        break
      case 'conversionActionInventory':
        redirectUrl = `${baseUrl}/conversion-action-inventory`
        break
      case 'roasByDeviceGeography':
        redirectUrl = `${baseUrl}/roas-by-device-geography`
        break
      case 'negativeKeywordsGaps':
        redirectUrl = `${baseUrl}/negative-keywords-gaps`
        break
      case 'searchTermCoverage':
        redirectUrl = `${baseUrl}/search-term-coverage`
        break
      case 'adGroupDistribution':
        redirectUrl = `${baseUrl}/ad-group-distribution`
        break
      case 'networkPerformance':
        redirectUrl = `${baseUrl}/network-performance`
        break
      case 'impressionShareLost':
        redirectUrl = `${baseUrl}/impression-share-lost`
        break
      case 'searchTermAnalysis':
        redirectUrl = `${baseUrl}/search-term-analysis`
        break
      default:
        return NextResponse.json(
          { error: `Unsupported data type: ${dataType}` },
          { status: 400 },
        )
    }

    // Forward the request to the new endpoint
    const response = await fetch(redirectUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    // Return the response with proper status and headers
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('Failed to route Google Ads analytics data request:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
