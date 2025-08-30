import { NextRequest, NextResponse } from 'next/server'
import { SendEmailRequestBody } from '@/components/listmonk/routes/sendEmail'
import { isAuthorization } from '@/components/listmonk/authorization'

export async function POST(req: NextRequest) {
  try {
    const { subscriber_email } = (await req.json()) as SendEmailRequestBody
    const isUserAuthorization = await isAuthorization(req, subscriber_email)

    if (!isUserAuthorization) {
      return NextResponse.json(
        { success: false, message: 'Authorization is missing' },
        { status: 401 },
      )
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to register user.' },
      { status: 500 },
    )
  }
}
