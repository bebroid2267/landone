import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/utils/supabase/supabase-admin'

interface LoginUserRequestBody {
  email: string
  name: string
  callback: string
  isNeedSendEmail: boolean
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') ?? 'http://localhost'
    const isUserAuthorization = (process.env.ORIGINS ?? '')
      ?.split(',')
      .includes(origin)
    if (!isUserAuthorization) {
      return NextResponse.json(
        { success: false, message: 'Authorization is missing' },
        { status: 401 },
      )
    }

    const { email, name, callback, isNeedSendEmail } =
      (await req.json()) as LoginUserRequestBody

    if (!(email && name && callback && isNeedSendEmail !== undefined)) {
      throw new Error('Not enough parameters')
    }

    const { data: user, error: er } = await supabaseAdmin.auth.admin.createUser(
      {
        email,
        email_confirm: true,
        user_metadata: { full_name: name, email },
      },
    )

    if (er) {
      throw new Error('Create a user failed')
    }

    try {
      const { error } = await supabaseAdmin
        .from('users')
        .update({ gpt_id: callback, consent_status: 'consented' })
        .eq('id', user.user.id)
        .single()

      if (error) {
        throw new Error('Update user failed')
      }

      return NextResponse.json({
        success: true,
      })
    } finally {
      await supabaseAdmin.auth.signOut()
    }
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to register user.',
    })
  }
}
