import { useState } from 'react'
import AuthButtons from './AuthButtons'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { getCallback, getUserDetails } from '@/utils/supabase/supabase-client'
import { useRouter } from 'next/navigation'
import { registerListmonkUser } from '@/utils/oauth-helpers/listmonk/routes/register'
import { sendEmailToListmonkUser } from '@/utils/oauth-helpers/listmonk/routes/sendEmail'

const Consent = ({
  state,
  redirect_uri,
  scope,
  code,
  accessToken,
  refreshToken,
}: {
  state: string
  redirect_uri: string
  scope: string
  code: string
  accessToken: string
  refreshToken: string
}) => {
  const router = useRouter()
  const [termsOfService, setTermsOfService] = useState(true)

  const singInWithProvider = () => {
    const signInWithGoogle = async () => {
      const queryParams = new URLSearchParams({
        state,
        redirect_uri,
        code,
        scope,
      })

      const response = `${window.location.origin}/oauth`

      const supabase = createClient()
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        document.cookie = 'ERROR_AUTH_NAME=Error create session'
        router.push(response)
        return
      }

      const authorizationUrl = `${redirect_uri}?${queryParams.toString()}`
      const userData = await getUserDetails(supabase, data.user?.id!)

      if (!userData) {
        document.cookie = 'ERROR_AUTH_NAME=Error while check user'
        router.push(response)
        return
      }

      const { consent_status } = userData

      if (consent_status !== 'consented') {
        const { error } = await supabase
          .from('users')
          .update({ consent_status: 'consented', gpt_id: redirect_uri })
          .eq('id', userData.id)
          .single()

        if (error) {
          document.cookie = "ERROR_AUTH_NAME=Error update user's consent"
          router.push(response)
          return
        }

        const respReg = await registerListmonkUser(
          {
            email: userData.email,
            name: userData.full_name!,
            lists: [3],
          },
          accessToken,
        )

        if (respReg) {
          const callback = await getCallback(supabase, redirect_uri)

          if (callback) {
            await sendEmailToListmonkUser(
              {
                subscriber_email: userData.email,
                template_id: 4,
              },
              accessToken,
            )
          }
        }
      }
      router.push(authorizationUrl)
    }
    signInWithGoogle().catch(() => console.error())
  }

  return (
    <div className="flex justify-center items-center gap-1 h-[100%]">
      <div className="bg-gray-800/50 backdrop-blur-sm md:w-1/2 flex flex-col justify-center items-stretch gap-5 p-8 rounded-2xl border border-gray-700/50">
        <div className="flex flex-col gap-5">
          <h1 className="text-white text-center text-xl">
            {'Sign Up'} to{' '}
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-fuchsia-500 to-cyan-400">
              Songy.ai
            </span>
          </h1>
          <AuthButtons
            consent={true}
            register={true}
            termsOfService={termsOfService}
            singInWithProvider={singInWithProvider}
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              className="flex-shrink-0 size-4 cursor-pointer accent-indigo-500"
              type="checkbox"
              onClick={() => setTermsOfService((prev) => !prev)}
              checked={termsOfService}
              readOnly
            />
            <span className="text-gray-400 text-sm text-start">
              Yes, I agree to the{' '}
              <Link
                className="text-indigo-400 hover:text-indigo-300"
                href="/policy"
              >
                Terms of Service
              </Link>
              .
            </span>
          </div>
          <div className="flex items-start gap-3">
            <input
              className="flex-shrink-0 size-4 cursor-pointer accent-indigo-500"
              type="checkbox"
              onClick={() => setTermsOfService((prev) => !prev)}
              checked={termsOfService}
              readOnly
            />
            <span className="text-gray-400 text-sm text-start">
              Yes, I agree to receive emails about my account, presentations,
              and our occasional product updates. We respect your inbox.
              Unsubscribe at any time.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Consent
