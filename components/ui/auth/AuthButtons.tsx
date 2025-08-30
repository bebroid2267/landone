import { Provider } from '@supabase/supabase-js'

const AuthButtons = ({
  consent,
  register,
  termsOfService,
  singInWithProvider,
  googleAdsEnabled = false,
}: {
  consent?: boolean
  register: boolean
  termsOfService: boolean
  singInWithProvider: (provider: Provider) => void
  googleAdsEnabled?: boolean
}) => {
  return (
    <div className="flex flex-col gap-3">
      <button
        className={`${
          termsOfService
            ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
            : 'bg-gray-700 text-gray-400 border-gray-600'
        } border flex gap-3 justify-center items-center whitespace-nowrap rounded-lg py-2 px-4 transition-colors duration-200`}
        onClick={() => singInWithProvider('google')}
        disabled={!termsOfService}
      >
        {consent && (
          <div className="flex items-center gap-3 pointer-events-none">
            <img
              className="size-20 rounded-full"
              src="/PRESENTATION.jpg"
              alt="Presentation Icon"
            />
            <svg
              className="size-8"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g data-name="Layer 2" id="Layer_2">
                <path d="M16.88,15.53,7,5.66A1,1,0,0,0,5.59,7.07l9.06,9.06-8.8,8.8a1,1,0,0,0,0,1.41h0a1,1,0,0,0,1.42,0l9.61-9.61A.85.85,0,0,0,16.88,15.53Z" />
                <path d="M26.46,15.53,16.58,5.66a1,1,0,0,0-1.41,1.41l9.06,9.06-8.8,8.8a1,1,0,0,0,0,1.41h0a1,1,0,0,0,1.41,0l9.62-9.61A.85.85,0,0,0,26.46,15.53Z" />
              </g>
            </svg>
            <img
              className="size-20 rounded-full"
              src="/oauth/gpt.png"
              alt="GPT Icon"
            />
          </div>
        )}
        {!consent && (
          <div className="flex items-center gap-3">
            <svg
              className="size-8"
              enableBackground="new 0 0 128 128"
              id="Social_Icons"
              version="1.1"
              viewBox="0 0 128 128"
              xmlSpace="preserve"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <g id="_x31__stroke">
                <g id="Google">
                  <rect
                    clipRule="evenodd"
                    fill="none"
                    fillRule="evenodd"
                    height="128"
                    width="128"
                  />
                  <path
                    clipRule="evenodd"
                    d="M27.585,64c0-4.157,0.69-8.143,1.923-11.881L7.938,35.648    C3.734,44.183,1.366,53.801,1.366,64c0,10.191,2.366,19.802,6.563,28.332l21.558-16.503C28.266,72.108,27.585,68.137,27.585,64"
                    fill="#FBBC05"
                    fillRule="evenodd"
                  />
                  <path
                    clipRule="evenodd"
                    d="M65.457,26.182c9.031,0,17.188,3.2,23.597,8.436L107.698,16    C96.337,6.109,81.771,0,65.457,0C40.129,0,18.361,14.484,7.938,35.648l21.569,16.471C34.477,37.033,48.644,26.182,65.457,26.182"
                    fill="#EA4335"
                    fillRule="evenodd"
                  />
                  <path
                    clipRule="evenodd"
                    d="M65.457,101.818c-16.812,0-30.979-10.851-35.949-25.937    L7.938,92.349C18.361,113.516,40.129,128,65.457,128c15.632,0,30.557-5.551,41.758-15.951L86.741,96.221    C80.964,99.86,73.689,101.818,65.457,101.818"
                    fill="#34A853"
                    fillRule="evenodd"
                  />
                  <path
                    clipRule="evenodd"
                    d="M126.634,64c0-3.782-0.583-7.855-1.457-11.636H65.457v24.727    h34.376c-1.719,8.431-6.397,14.912-13.092,19.13l20.474,15.828C118.981,101.129,126.634,84.861,126.634,64"
                    fill="#4285F4"
                    fillRule="evenodd"
                  />
                </g>
              </g>
            </svg>
            {googleAdsEnabled && (
              <svg
                className="size-6 text-blue-500"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-10-5z" />
                <path
                  d="M12 7.13l-6.5 3.25V17c0 3.6 2.4 6.5 6.5 6.5s6.5-2.9 6.5-6.5v-6.62L12 7.13z"
                  fill="white"
                />
              </svg>
            )}
          </div>
        )}
        {consent ? (
          <label className="text-[30px] font-bold">Sign Up to PRO</label>
        ) : (
          <span className="font-medium">
            {googleAdsEnabled
              ? `${register ? 'Sign Up' : 'Sign In'} with Google Ads`
              : `${register ? 'Sign Up' : 'Sign In'} with Google`}
          </span>
        )}
      </button>
    </div>
  )
}

export default AuthButtons
