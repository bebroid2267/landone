import { RegisterUserRequestBody } from '@/components/listmonk/routes/register'
import { NextRequest, NextResponse } from 'next/server'
import { isAuthorization } from '@/components/listmonk/authorization'

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as RegisterUserRequestBody
    const isUserAuthorization = await isAuthorization(req, email)

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
