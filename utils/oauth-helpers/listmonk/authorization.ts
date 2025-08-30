import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

export async function isAuthorization(req: NextRequest, email: string) {
  try {
    const access_token = req.headers.get('authorization')?.split(' ')[1]

    if (access_token) {
      const supabase = await createClient()
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(access_token)
      if (error) {
        return false
      }
      if (user) {
        return user.email === email
      }
      return false
    }
    return false
  } catch {
    return false
  }
}
