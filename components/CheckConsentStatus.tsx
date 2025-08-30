'use client'

import { useUser } from '@/components/hooks/useUser'
import {
  getUserInfo,
  updateUserConsentStatus,
} from '@/utils/supabase/supabase-client'
import { useEffect, useState } from 'react'
import LoadingDots from './ui/LoadingDots'
import { ConsentStatus } from '@/utils/types'
import { createClient } from '@/utils/supabase/client'

const CheckConsentStatus = () => {
  const supabase = createClient()
  const { user } = useUser()

  const [userStatus, setUserStatus] = useState<ConsentStatus | null>(null)
  const [isLoadInfo, setIsLoadInfo] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      if (user) {
        const userInfo = await getUserInfo(supabase, user.id)
        if (userInfo) {
          setUserStatus(userInfo.consent_status)
        }
      }
    }

    if (user && supabase) {
      void checkStatus()
    }
  }, [supabase, user])

  const changeConsentStatus = async (status: ConsentStatus) => {
    setIsLoadInfo(true)
    if (user) {
      await updateUserConsentStatus(supabase, user.id, status)
      console.log(status)
    }
    setIsLoadInfo(false)
    setUserStatus(null)
  }

  return (
    <>
      {userStatus === 'not_specified' && (
        <div className="fixed z-[999999999999] w-[100dvw] h-[100dvh] bg-black/70 backdrop-blur-sm top-0 left-0 flex items-center justify-center">
          <div className="bg-gray-900 rounded-xl w-[800px] flex flex-col items-start p-[40px] relative border border-gray-800 shadow-xl">
            <p className="font-bold text-[26px] leading-none mb-[20px] text-white">
              Welcome to Pyxl.pro!
            </p>
            <p className="text-[18px] font-medium mb-[10px] text-gray-300">
              Stay updated with the latest news, exclusive offers, and special
              announcements delivered directly to your inbox. By clicking
              &quot;Yes, subscribe me&quot; you agree to receive emails from
              Pyxl.pro and accept our{' '}
              <a
                className="text-indigo-400 hover:text-indigo-300 underline"
                href="/policy"
              >
                Terms of Service and Privacy Policy.
              </a>{' '}
              <br /> <br />
              You can unsubscribe anytime in your account settings if you change
              your mind.
            </p>

            {isLoadInfo ? (
              <div className="mt-[20px]">
                <LoadingDots />
              </div>
            ) : (
              <div className="flex items-center gap-[30px] mt-[20px]">
                <button
                  onClick={() => void changeConsentStatus('consented')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white flex gap-[5px] text-[16px] p-[10px] font-medium leading-none transition-all duration-200 rounded-lg hover:shadow-lg hover:shadow-indigo-500/20"
                >
                  Yes, subscribe me
                </button>
                <button
                  onClick={() => void changeConsentStatus('declined')}
                  className="text-gray-400 hover:text-gray-300 text-[14px] transition-colors duration-200"
                >
                  No, thanks
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default CheckConsentStatus
